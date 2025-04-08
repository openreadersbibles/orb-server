import { GenericDatabaseAdapter } from './GenericDatabaseAdapter.js';
import { BadRequest, HttpReturnValue, InternalFailure, SuccessValue } from '../../models/ReturnValue.js';
import { PhraseGlossRow, ProjectPackage, UpdateVerseData } from '../../models/database-input-output.js';
import { UserId, UserUpdateObject } from '../../models/UserProfile.js';
import { ProjectId } from '../../models/ProjectConfiguration.js';
import mysql, { RowDataPacket } from 'mysql2/promise';
import { VerseReference } from '../../models/VerseReference.js';
import { SuggestionRow } from '../../models/HebrewWordRow.js';
import { PhraseGlossLocationObject, WordGlossLocation, WordGlossLocationObject } from '../../models/gloss-locations.js';
import { MarkdownAnnotationContent } from '../../models/Annotation.js';

export class MariaDbAdapter implements GenericDatabaseAdapter {
    private connection!: mysql.Connection;

    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.RDS_HOST,
                user: process.env.MARIADB_USER,
                password: process.env.MARIADB_PASSWORD,
                database: process.env.RDS_DATABASE,
                port: parseInt(process.env.RDS_PORT || '3306', 10),
            });
        } catch (error) {
            console.error(error);
            throw new Error('Error connecting to the database: ' + error);
        }
    }

    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.end();
            } catch (error) {
                console.error('Error disconnecting from the database:', error);
            }
        }
    }

    async getUserData(user_id: UserId): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT 
    user.user_id,
    user_description,
    IF(settings IS NULL,JSON_ARRAY(),JSON_ARRAYAGG(settings)) AS projects
FROM 
    user 
    LEFT JOIN project_roles ON user.user_id = project_roles.user_id
    LEFT JOIN (
        SELECT 
            project.project_id,
            json_insert(settings, '$.roles', JSON_ARRAYAGG(JSON_OBJECT('user_id', user_id, 'user_role', user_role, 'power_user', power_user))) AS settings
        FROM 
            project 
            LEFT JOIN project_roles ON project.project_id = project_roles.project_id 
        GROUP BY 
            project.project_id
    ) AS combined_project_data ON project_roles.project_id = combined_project_data.project_id
WHERE 
    user.user_id = ?
GROUP BY 
    user.user_id;`, [user_id]);

            /// if no user is returned, we'll insert it into the database
            if (rows.length === 0) {
                await this.updateUser(user_id, { user_id: user_id, user_description: "" });
                return this.getUserData(user_id);
            } else {
                return SuccessValue(rows[0]);
            }
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving user data");
        }
    }

    async updateUser(requesting_user_id: UserId, userObject: UserUpdateObject): Promise<HttpReturnValue> {
        try {
            if (userObject.user_id !== requesting_user_id && requesting_user_id !== "orbadmin") {
                return BadRequest("You are not allowed to update that user's data.");
            }
            const [result] = await this.connection.execute<mysql.ResultSetHeader>("REPLACE INTO `user` (user_id,user_description) VALUES (?,?);", [userObject.user_id, userObject.user_description]);
            if (result.affectedRows < 1) {
                return BadRequest("The user was not updated. (Perhaps a bad project id?)");
            }

            return SuccessValue("User data updated successfully");
        } catch (err) {
            console.error(err);
            return Promise.reject(InternalFailure("Error updating user data"));
        }
    }

    async removeUser(user_id: UserId): Promise<HttpReturnValue> {
        try {
            await this.connection.query<RowDataPacket[]>("DELETE FROM `user` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `project_roles` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `votes` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `phrase_gloss_votes` WHERE user_id=?;", [user_id]);
            return SuccessValue("User data deleted successfully");
        } catch (err) {
            console.error(err);
            return InternalFailure("Error deleting user data");
        }
    }


    async updateProject(user_id: UserId, pkg: ProjectPackage): Promise<HttpReturnValue> {
        try {
            const project = pkg.project;
            const roles = pkg.project.roles;
            const settingWithoutRoles = JSON.parse(JSON.stringify(project));
            delete settingWithoutRoles.roles;

            /// I'm handling new projects separately so that a project can't be accidentally overwritten
            if (pkg.new_project) {
                /// insert the new project
                await this.connection.execute(`INSERT INTO project (project_id,settings) VALUES (?,?);`, [project.project_id, JSON.stringify(settingWithoutRoles)]);

                /// make the user the admin of the project
                for (const role of roles) {
                    await this.connection.execute(`INSERT INTO project_roles (user_id,project_id,user_role,power_user) VALUES (?,?,?,?);`, [role.user_id, project.project_id, role.user_role, role.power_user]);
                }
                return SuccessValue("Project created successfully");
            } else {
                /// update the new project
                const [result] = await this.connection.execute<mysql.ResultSetHeader>(`UPDATE project p
                            JOIN project_roles pr ON p.project_id = pr.project_id
                            SET p.settings = ?
                            WHERE p.project_id = ?
                            AND pr.user_id = ?
                            AND pr.user_role = 'admin';`, [JSON.stringify(settingWithoutRoles), project.project_id, user_id]);
                if (result.affectedRows < 1) {
                    return BadRequest("The project was not updated. (Perhaps a bad project id?)");
                }

                for (const role of roles) {
                    await this.connection.execute(`REPLACE INTO project_roles (user_id,project_id,user_role,power_user) VALUES (?,?,?,?);`, [role.user_id, project.project_id, role.user_role, role.power_user]);
                }
                return SuccessValue("Project updated successfully");
            }
        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating project data");
        }
    }

    async getUserIds(): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>('SELECT `user_id` FROM user ORDER BY lower(user_id) ASC;');
            return SuccessValue(rows.map((row) => row.user_id));
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving user IDs");
        }
    }

    async getProjectIdExists(project_id: ProjectId): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>('SELECT project_id FROM project WHERE project_id=?;', [project_id]);
            return SuccessValue({
                project_id: project_id,
                exists: rows.length > 0 ? true : false
            });
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving project ID existence");
        }
    }

    async lastInsertId(): Promise<number> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>('SELECT LAST_INSERT_ID() AS lid;');
            return rows[0].lid;
        } catch (error) {
            console.error(error);
            return Promise.reject();
        }
    }

    async updateVerse(user_id: UserId, data: UpdateVerseData, project_id: ProjectId, reference_text: string): Promise<HttpReturnValue> {
        const wordGlossUpdates = data.word_gloss_updates;
        const phraseGlossUpdates = data.phrase_gloss_updates;

        try {
            /// we first need to add any glosses to the database
            /// these are identified by gloss_id == -1
            /// we'll then store the new gloss_id in the postArray
            /// array so that we can use it to update votes
            for (let i = 0; i < wordGlossUpdates.length; i++) {
                if (wordGlossUpdates[i].gloss_id == -1) {
                    const location = wordGlossUpdates[i].location as WordGlossLocation
                    await this.connection.execute(`INSERT INTO gloss (word_id, project_id, gloss,reference, lex_id) VALUES (?,?,?,?,?);`, [location.word_id, project_id, JSON.stringify(wordGlossUpdates[i].annotationObject), reference_text, location.lex_id]);
                    wordGlossUpdates[i].gloss_id = await this.lastInsertId();
                }
            }

            /// add/update the votes table
            for (const item of wordGlossUpdates) {
                const location = item.location as unknown as WordGlossLocationObject;
                await this.connection.execute(`REPLACE INTO votes (vote,gloss_id,user_id,word_id) VALUES (?,?,?,?);`, [item.myVote, item.gloss_id, user_id, location.word_id]);
            }

            /// insert new phrase-level glosses
            for (let i = 0; i < phraseGlossUpdates.length; i++) {
                if (phraseGlossUpdates[i].gloss_id === -1) {
                    const location = phraseGlossUpdates[i].location as unknown as PhraseGlossLocationObject;
                    /// phrase-level glosses are always just markdown annotation
                    const annotation = phraseGlossUpdates[i]?.annotationObject as { type: "markdown"; content: MarkdownAnnotationContent; };
                    await this.connection.execute(`INSERT INTO phrase_gloss (from_word_id, to_word_id, project_id, markdown,reference) VALUES (?,?,?,?,?);`, [location.from_word_id, location.to_word_id, project_id, annotation.content.markdown, reference_text]);
                    phraseGlossUpdates[i].gloss_id = await this.lastInsertId();
                }
            }

            /// update phrase-level gloss votes
            for (const item of phraseGlossUpdates) {
                await this.connection.execute(`REPLACE INTO phrase_gloss_votes (vote,phrase_gloss_id,user_id) VALUES (?,?,?);`, [item.myVote, item.gloss_id, user_id]);
            }

            return SuccessValue("Verse data updated successfully");

        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating verse data");
        }
    }

    /// serverless deploy function -f getVerse
    getVerse(project_id: ProjectId, user_id: UserId, reference: string): Promise<HttpReturnValue> {
        const r = VerseReference.fromString(reference);
        if (r === undefined) {
            console.error("Bad reference", reference);
            return Promise.reject("Bad reference");
        }
        switch (r.canon) {
            case "OT":
                return this.getOTVerse(project_id, user_id, reference);
            case "NT":
                return this.getNTVerse(project_id, user_id, reference);
            default:
                console.error("LXX Not Supported");
                return Promise.reject("LXX Not Supported");
        }
    }

    /// TODO The clause "GROUP BY user_id" (here an in the NT call) is a cludge because
    /// at least during development sometimes two glosses would both be voted for. I think
    /// that is fixed, but it might be better to make that kind of error unable to happen.
    async getOTVerse(project_id: ProjectId, user_id: UserId, reference: string): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT _id,freq_lex,g_word_utf8,trailer_utf8,lex_id,gn, nu, st, vt, vs, ps, pdp, ot.gloss AS englishGloss, prs_gn, prs_nu, prs_ps,voc_lex_utf8,languageISO,
            CASE WHEN voteResults.gloss IS NULL THEN '[]' ELSE JSON_ARRAYAGG(JSON_OBJECT('jsonContent',voteResults.gloss,'votes',voteCount,'gloss_id',gloss_id)) END AS votes,
            (SELECT gloss_id FROM votes WHERE user_id=? AND votes.word_id=ot._id AND vote=1 GROUP BY user_id) AS myVote
            FROM ot
            LEFT JOIN 
            (SELECT gloss.word_id,gloss._id AS gloss_id,gloss.project_id,gloss,SUM(ifnull(vote,0)) AS voteCount FROM gloss LEFT JOIN votes ON votes.gloss_id=gloss._id  WHERE gloss.project_id=? AND reference=? GROUP BY gloss._id ORDER BY gloss.word_id,voteCount DESC) AS voteResults
            ON ot._id=voteResults.word_id
            WHERE ot.reference=? 
            GROUP BY ot._id;`, [user_id, project_id, reference, reference]);

            const glossSuggestions = await this.getWordGlosses(project_id, reference, 'ot');
            const phraseGlosses = await this.getPhraseGlosses(user_id, project_id, reference);

            return SuccessValue({
                words: rows.map((row) => { row.votes = JSON.parse(row.votes); return row; }),
                suggestions: glossSuggestions,
                phrase_glosses: phraseGlosses
            });
        } catch (error) {
            console.error(user_id, project_id, reference, reference);
            console.error(error);
            return InternalFailure("Error retrieving OT verse data");
        }
    }

    async getNTVerse(project_id: ProjectId, user_id: UserId, reference: string): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT _id, freq_lex, lex_id, 0 AS myVote, punctuated_text, unpunctuated_text, lemma, part_of_speech, person, tense, voice, mood, grammatical_case, grammatical_number, gender, degree, 'grc' AS languageISO,nt.gloss AS englishGloss,
            CASE WHEN voteResults.gloss IS NULL THEN '[]' ELSE JSON_ARRAYAGG(JSON_OBJECT('jsonContent',voteResults.gloss,'votes',voteCount,'gloss_id',gloss_id)) END AS votes,
            (SELECT gloss_id FROM votes WHERE user_id=? AND votes.word_id=nt._id AND vote=1 GROUP BY user_id) AS myVote
            FROM nt
            LEFT JOIN 
            (SELECT gloss.word_id,gloss._id AS gloss_id,gloss.project_id,gloss,SUM(ifnull(vote,0)) AS voteCount FROM gloss LEFT JOIN votes ON votes.gloss_id=gloss._id  WHERE gloss.project_id=? AND reference=? GROUP BY gloss._id ORDER BY gloss.word_id,voteCount DESC) AS voteResults
            ON nt._id=voteResults.word_id
            WHERE nt.reference=? 
            GROUP BY nt._id;`, [user_id, project_id, reference, reference]);

            const glossSuggestions = await this.getWordGlosses(project_id, reference, 'nt');
            const phraseGlosses = await this.getPhraseGlosses(user_id, project_id, reference);

            return SuccessValue({
                words: rows.map((row) => { row.votes = JSON.parse(row.votes); return row; }),
                suggestions: glossSuggestions,
                phrase_glosses: phraseGlosses
            });
        } catch (error) {
            console.error(error);
            console.error(project_id, user_id, reference);
            return InternalFailure("Error retrieving NT verse data");
        }
    }

    async getWordGlosses(project_id: ProjectId, reference: string, dataTableName: 'nt' | 'ot'): Promise<SuggestionRow[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT _id AS gloss_id,lex_id,JSON_ARRAYAGG(DISTINCT gloss.gloss) AS suggestions FROM gloss WHERE project_id=? AND lex_id IN (SELECT lex_id FROM ${dataTableName} WHERE reference=?) GROUP BY lex_id;`, [project_id, reference]);
            return rows.map((row) => {
                return {
                    lex_id: row.lex_id,
                    suggestions: JSON.parse(row.suggestions).map((str: string) => JSON.parse(str))
                };
            });
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async getPhraseGlosses(user_id: UserId, project_id: ProjectId, reference: string): Promise<PhraseGlossRow[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT _id AS phrase_gloss_id,from_word_id,to_word_id,markdown,SUM(IFNULL(vote,0)) AS votes,(SELECT phrase_gloss_id FROM phrase_gloss_votes WHERE user_id=? AND vote=1 AND phrase_gloss_id=phrase_gloss._id) AS myVote FROM phrase_gloss LEFT JOIN phrase_gloss_votes ON phrase_gloss._id=phrase_gloss_votes.phrase_gloss_id  WHERE project_id=? AND reference=? GROUP BY _id ORDER BY votes DESC;`, [user_id, project_id, reference]);
            return rows as PhraseGlossRow[];
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async seekVerse(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after", exclusivity: "me" | "anyone"): Promise<HttpReturnValue> {
        try {
            const orderDirection = direction === "before" ? "DESC" : "ASC";
            const userClause = exclusivity === "me" ? " AND user_id=? " : "";
            const greaterThanLessThan = direction === "before" ? "<" : ">";
            const minMax = direction === "before" ? "min" : "max";
            const canon = startingPosition.canon.toLowerCase();

            const args: string[] = exclusivity === "me" ? [user_id, project_id, frequency_threshold.toString(), startingPosition.toString()] : [project_id, frequency_threshold.toString(), startingPosition.toString()];

            /// TODO this is nonsense
            const query = `SELECT ${canon}.reference FROM ${canon} 
        LEFT JOIN gloss
        ON gloss.word_id=${canon}._id  
        LEFT JOIN votes
        ON votes.word_id=${canon}._id ${userClause} AND vote='1' 
        LEFT JOIN project_roles 
        ON votes.user_id = project_roles.user_id  AND project_roles.project_id=? AND user_role!='disabled' 
        WHERE (vote is null OR vote=0) AND ${canon}.freq_lex < ? AND ${canon}._id ${greaterThanLessThan} (SELECT ${minMax}(_id) FROM ${canon} WHERE reference=?) 
        ORDER BY ${canon}._id ${orderDirection} 
        LIMIT 1;`;

            const result = await this.connection.query<RowDataPacket[]>(query, args);

            if (result[0][0] === undefined) {
                console.error(`Query returned empty; returning starting position: ${startingPosition.toString()}`);
                return SuccessValue({ reference: startingPosition.toString() });
            }
            return SuccessValue(result[0][0]);
        } catch (err) {
            console.error(err);
            return InternalFailure("Error seeking verse data");
        }
    }

    async getProjectDescriptions(): Promise<HttpReturnValue> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`select project_id,JSON_VALUE(settings,'$.project_title') as project_title,JSON_VALUE(settings,'$.project_description') as project_description,JSON_VALUE(settings,'$.allow_joins') as allow_joins from project order by project_title ASC;`);
            return SuccessValue(rows.map((row) => {
                row.allow_joins = row.allow_joins === "1";
                return row;
            }));
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving project descriptions");
        }
    }

    async joinProject(user_id: UserId, project_id: ProjectId): Promise<HttpReturnValue> {
        try {
            await this.connection.execute(`insert ignore into project_roles values (?,?,'member',0);`, [user_id, project_id]);
            return SuccessValue("User added to project successfully");
        } catch (err) {
            console.error(err);
            return InternalFailure("Error joining project");
        }
    }
}