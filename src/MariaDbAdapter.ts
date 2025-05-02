import { GenericDatabaseAdapter } from './GenericDatabaseAdapter.js';
import { BadRequest, Failure, InternalFailure } from '@models/ReturnValue.js';
import { UserId } from '@models/UserProfile.js';
import { ProjectConfiguration, ProjectId } from '@models/ProjectConfiguration.js';
import mysql, { RowDataPacket } from 'mysql2/promise';
import { VerseReference } from '@models/VerseReference.js';
import { HebrewWordRow } from '@models/HebrewWordRow.js';
import { WordGlossLocation } from '@models/gloss-locations.js';
import { annotationFromJson } from '@models/Annotation.js';
import { GreekWordRow } from '@models/GreekWordRow.js';
import { VerseResponse } from '@models/Verse.js';
import { BookIdentifier } from '@models/BookIdentifier.js';
import { BookDumpJson, PublicationBook } from '@models/publication/PublicationBook.js';
import { PublicationGreekWordElementRow } from '@models/publication/PublicationGreekWordElementRow.js';
import { PublicationHebrewWordElementRow } from '@models/publication/PublicationHebrewWordElementRow.js';
import { Canon } from '@models/Canon.js';
import { UbsBook } from '@models/UbsBook.js';
import { MarkdownAnnotationContent } from '@models/AnnotationJsonObject.js';
import { PhraseGlossRow } from '@models/PhraseGlossRow.js';
import { SuggestionRow } from '@models/SuggestionRow.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { WordGlossLocationObject } from '@models/WordGlossLocationObject.js';
import { PhraseGlossLocationObject } from '@models/PhraseGlossLocationObject.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';
import { WordRow } from '@models/WordRow.js';
import { ProjectConfigurationRow } from '@models/ProjectConfigurationRow.js';
import { ProjectDescription } from '@models/ProjectDescription.js';
import { UserProfileRow } from '@models/UserProfileRow.js';
import { UserUpdateObject } from '@models/UserUpdateObject.js';
import { StatsSummary } from '@models/StatsSummary.js';
import { PublicationRequest } from '@models/PublicationRequest.js';
import { getCanon } from '@models/Canons.js';

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

    async getUserData(user_id: UserId): Promise<UserProfileRow> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT user_id, user_description FROM user WHERE user_id=?;`, [user_id]);

            /// if no user is returned, we'll insert it into the database
            if (rows.length === 0) {
                await this.updateUser(user_id, { user_id: user_id, user_description: "" });
                return this.getUserData(user_id);
            }

            const [projects] = await this.connection.query<RowDataPacket[]>(`SELECT 
	project.project_id,
	json_insert(settings, '$.roles', JSON_ARRAYAGG(JSON_OBJECT('user_id', user_id, 'user_role', user_role, 'power_user', power_user))) AS settings
FROM 
	project 
	LEFT JOIN project_roles ON project.project_id = project_roles.project_id 
where user_id=?
GROUP BY 
	project.project_id;`, [user_id]);

            // const project_rows = projects.map((row) => { JSON.parse(row.settings) as ProjectConfigurationRow });
            const project_rows: ProjectConfigurationRow[] = [];
            for (const row of projects) {
                const projectRow = JSON.parse(row.settings) as ProjectConfigurationRow;
                project_rows.push(projectRow);
            }

            return {
                user_id: user_id,
                user_description: rows[0].user_description,
                projects: project_rows
            };
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving user data");
        }
    }
    /*
        async getUserData(user_id: UserId): Promise<UserProfileRow> {
            try {
                // very strange, but the nested query here introduces an extra set of brackets around the roles array array
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
        user.user_id = ? AND settings IS NOT NULL  
    GROUP BY 
        user.user_id;`, [user_id]);
    
                /// if no user is returned, we'll insert it into the database
                if (rows.length === 0) {
                    await this.updateUser(user_id, { user_id: user_id, user_description: "" });
                    return this.getUserData(user_id);
                } else {
                    return rows[0] as UserProfileRow;
                }
            } catch (error) {
                console.error(error);
                return InternalFailure("Error retrieving user data");
            }
        }
    */
    async updateUser(requesting_user_id: UserId, userObject: UserUpdateObject): Promise<boolean> {
        try {
            if (userObject.user_id !== requesting_user_id && requesting_user_id !== "orbadmin") {
                console.error("User is not allowed to update another user's data", userObject.user_id, requesting_user_id);
                return BadRequest("You are not allowed to update that user's data.");
            }
            const [result] = await this.connection.execute<mysql.ResultSetHeader>("REPLACE INTO `user` (user_id,user_description) VALUES (?,?);", [userObject.user_id, userObject.user_description]);
            if (result.affectedRows < 1) {
                console.error("User was not updated", userObject.user_id, userObject.user_description);
                return BadRequest("The user was not updated. (Perhaps a bad project id?)");
            }

            return true;
        } catch (err) {
            console.error(err);
            return Promise.reject(InternalFailure("Error updating user data"));
        }
    }

    async removeUser(user_id: UserId): Promise<boolean> {
        try {
            await this.connection.query<RowDataPacket[]>("DELETE FROM `user` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `project_roles` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `votes` WHERE user_id=?;", [user_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `phrase_gloss_votes` WHERE user_id=?;", [user_id]);
            return true;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error deleting user data");
        }
    }

    async removeProject(project_id: ProjectId): Promise<boolean> {
        try {
            await this.connection.query<RowDataPacket[]>("DELETE FROM `project` WHERE project_id=?;", [project_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `project_roles` WHERE project_id=?;", [project_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `gloss` WHERE project_id=?;", [project_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `phrase_gloss` WHERE project_id=?;", [project_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `votes` WHERE gloss_id NOT IN ( SELECT _id FROM gloss );", [project_id]);
            await this.connection.query<RowDataPacket[]>("DELETE FROM `phrase_gloss_votes` WHERE phrase_gloss_id NOT IN ( SELECT _id FROM phrase_gloss );", [project_id]);
            return true;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error deleting project");
        }
    }

    async updateProject(requesting_user_id: UserId, project: ProjectConfigurationRow): Promise<boolean> {
        try {
            /// strip the "roles" element from the project object
            const roles = project.roles;
            const settingWithoutRoles = JSON.parse(JSON.stringify(project));
            delete settingWithoutRoles.roles;

            const [result] = await this.connection.execute<mysql.ResultSetHeader>(`UPDATE project p
                            JOIN project_roles pr ON p.project_id = pr.project_id
                            SET p.settings = ?
                            WHERE p.project_id = ?
                            AND pr.user_id = ?
                            AND pr.user_role = 'admin';`, [JSON.stringify(settingWithoutRoles), project.project_id, requesting_user_id]);
            if (result.affectedRows < 1) {
                return BadRequest("The project was not updated. (Perhaps a bad project id?)");
            }

            for (const role of roles) {
                await this.connection.execute(`REPLACE INTO project_roles (user_id,project_id,user_role,power_user) VALUES (?,?,?,?);`, [role.user_id, project.project_id, role.user_role, role.power_user]);
            }
            return true;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating project data");
        }
    }

    async createProject(user_id: UserId, project: ProjectConfigurationRow): Promise<boolean> {
        try {
            /// strip the "roles" element from the project object
            const roles = project.roles;
            const settingWithoutRoles = JSON.parse(JSON.stringify(project));
            delete settingWithoutRoles.roles;

            /// insert the new project
            await this.connection.execute(`INSERT INTO project (project_id,settings) VALUES (?,?);`, [project.project_id, JSON.stringify(settingWithoutRoles)]);

            /// make the user the admin of the project
            for (const role of roles) {
                await this.connection.execute(`REPLACE INTO project_roles (user_id,project_id,user_role,power_user) VALUES (?,?,?,?);`, [role.user_id, project.project_id, role.user_role, role.power_user]);
            }
            return true;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating project data");
        }
    }

    async getUserIds(): Promise<string[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>('SELECT `user_id` FROM user ORDER BY lower(user_id) ASC;');
            return rows.map((row) => row.user_id);
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving user IDs");
        }
    }

    async getProjectIdExists(project_id: ProjectId): Promise<boolean> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>('SELECT project_id FROM project WHERE project_id=?;', [project_id]);
            return rows.length > 0;
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

    async updateVerse(user_id: UserId, data: UpdateVerseData, project_id: ProjectId): Promise<boolean> {
        const wordGlossUpdates = data.word_gloss_updates;
        const phraseGlossUpdates = data.phrase_gloss_updates;

        try {
            /// we first need to add any glosses to the database
            /// these are identified by gloss_id == -1
            /// we'll then store the new gloss_id in the postArray
            /// array so that we can use it to update votes
            for (let i = 0; i < wordGlossUpdates.length; i++) {
                if (wordGlossUpdates[i].annotationObject.gloss_id == -1) {
                    const location = wordGlossUpdates[i].location as WordGlossLocation
                    await this.connection.execute(`INSERT INTO gloss (project_id, gloss, lex_id) VALUES (?,?,?);`, [project_id, JSON.stringify(wordGlossUpdates[i].annotationObject), location.lex_id]);
                    wordGlossUpdates[i].annotationObject.gloss_id = await this.lastInsertId();
                }
            }

            /// add/update the votes table
            for (const item of wordGlossUpdates) {
                const location = item.location as unknown as WordGlossLocationObject;
                const myVote = item.votes.includes(user_id) ? 1 : 0;
                const gloss_id = item.annotationObject.gloss_id;
                await this.connection.execute(`REPLACE INTO votes (vote,gloss_id,user_id,word_id,project_id) VALUES (?,?,?,?,?);`, [myVote, gloss_id, user_id, location.word_id, project_id]);
            }

            /// insert new phrase-level glosses
            for (let i = 0; i < phraseGlossUpdates.length; i++) {
                if (phraseGlossUpdates[i].annotationObject.gloss_id === -1) {
                    const location = phraseGlossUpdates[i].location as unknown as PhraseGlossLocationObject;
                    /// phrase-level glosses are always just markdown annotation
                    const annotation = phraseGlossUpdates[i]?.annotationObject as { type: "markdown"; content: MarkdownAnnotationContent; };
                    await this.connection.execute(`INSERT INTO phrase_gloss (from_word_id, to_word_id, project_id, markdown) VALUES (?,?,?,?);`, [location.from_word_id, location.to_word_id, project_id, annotation.content.markdown]);
                    phraseGlossUpdates[i].annotationObject.gloss_id = await this.lastInsertId();
                }
            }

            /// update phrase-level gloss votes
            for (const item of phraseGlossUpdates) {
                const myVote = item.votes.includes(user_id) ? 1 : 0;
                await this.connection.execute(`REPLACE INTO phrase_gloss_votes (vote,phrase_gloss_id,user_id) VALUES (?,?,?);`, [myVote, item.annotationObject.gloss_id, user_id]);
            }

            return true;
        } catch (err) {
            console.error("Error updating verse data in MariaDbAdapter.updateVerse()");
            console.error(err);
            return InternalFailure("Error updating verse data");
        }
    }

    async getOTVerse(project_id: ProjectId, user_id: UserId, reference: VerseReference): Promise<VerseResponse<HebrewWordRow>> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT 
    _id,
    freq_lex,
    g_word_utf8,
    trailer_utf8,
    lex_id,
    gn,
    nu,
    st,
    vt,
    vs,
    ps,
    pdp,
    ot.gloss AS englishGloss,
    prs_gn,
    prs_nu,
    prs_ps,
    voc_lex_utf8,
    languageISO,
    CASE when votes IS NULL THEN '[]' ELSE JSON_ARRAYAGG(votes) END AS votes
FROM 
    ot
LEFT JOIN 
    (
        SELECT 
    votes.word_id,
    JSON_OBJECT('annotationObject',JSON_SET(JSON_REMOVE(gloss, '$.gloss_id'), '$.gloss_id', gloss._id ),'gloss_id',gloss._id,'votes', JSON_ARRAYAGG(user_id) ) as votes 
FROM 
    gloss
LEFT JOIN 
    votes 
ON 
    votes.gloss_id = gloss._id
WHERE 
    gloss.project_id = ? 
    and gloss.project_id = votes.project_id
    and user_id is not null
    and vote=1
GROUP BY 
    gloss._id,votes.word_id
ORDER BY 
    votes.word_id DESC
    ) AS voteResults
ON 
    ot._id = voteResults.word_id
WHERE 
    ot.reference = ?
GROUP BY 
    ot._id;`, [project_id, reference.toString()]);

            return await this.processIntoVerseResponse<HebrewWordRow>(rows, user_id, project_id, reference, 'ot');

        } catch (error) {
            console.error(user_id, project_id, reference, reference);
            console.error(error);
            return InternalFailure("Error retrieving OT verse data");
        }
    }

    async getNTVerse(project_id: ProjectId, user_id: UserId, reference: VerseReference): Promise<VerseResponse<GreekWordRow>> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`
SELECT 
    _id,
    freq_lex,
    lex_id,
    punctuated_text,
    unpunctuated_text,
    lemma,
    part_of_speech,
    person,
    tense,
    voice,
    mood,
    grammatical_case,
    grammatical_number,
    gender,
    degree,
    'grc' AS languageISO,
    nt.gloss AS englishGloss,
    CASE when votes IS NULL THEN '[]' ELSE JSON_ARRAYAGG(votes) END AS votes 
FROM 
    nt
LEFT JOIN 
    (
        SELECT 
    votes.word_id,
    JSON_OBJECT('annotationObject',JSON_SET(JSON_REMOVE(gloss, '$.gloss_id'), '$.gloss_id', gloss._id ),'gloss_id',gloss._id,'votes', JSON_ARRAYAGG(user_id) ) as votes 
FROM 
    gloss
LEFT JOIN 
    votes 
ON 
    votes.gloss_id = gloss._id
WHERE 
    gloss.project_id = ? 
    and gloss.project_id = votes.project_id
    and user_id is not null
    and vote=1
GROUP BY 
    gloss._id,votes.word_id
ORDER BY 
    votes.word_id DESC
    ) AS voteResults
ON 
    nt._id = voteResults.word_id
WHERE 
    nt.reference = ? 
GROUP BY 
    nt._id;
`, [project_id, reference.toString()]);

            return await this.processIntoVerseResponse<GreekWordRow>(rows, user_id, project_id, reference, 'nt');

        } catch (error) {
            console.error(error);
            console.error(project_id, user_id, reference);
            return InternalFailure("Error retrieving NT verse data");
        }
    }

    private async processIntoVerseResponse<T extends WordRow>(rows: RowDataPacket[], user_id: UserId, project_id: ProjectId, reference: VerseReference, databaseTable: 'ot' | 'nt'): Promise<VerseResponse<T>> {
        const glossSuggestions = await this.getWordGlosses(project_id, reference, databaseTable);
        const phraseGlosses = await this.getPhraseGlosses(project_id, reference);
        const words = rows.map((row) => {
            row.votes = JSON.parse(row.votes);
            return row as T;
        });

        return {
            words: words,
            suggestions: glossSuggestions,
            phrase_glosses: phraseGlosses
        };
    }

    async getWordGlosses(project_id: ProjectId, reference: VerseReference, dataTableName: 'nt' | 'ot'): Promise<SuggestionRow[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`
SELECT 
    lex_id,
    JSON_ARRAYAGG(DISTINCT JSON_SET(gloss, '$.gloss_id', _id)) AS suggestions
FROM 
    gloss
WHERE 
    project_id = ? 
    AND lex_id IN (
        SELECT 
            lex_id 
        FROM 
            ${dataTableName} 
        WHERE 
            reference = ?
    )
GROUP BY 
    lex_id;
                    `, [project_id, reference.toString()]);
            return rows.map((row) => {
                return {
                    lex_id: row.lex_id,
                    suggestions: JSON.parse(row.suggestions)
                };
            });
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async getPhraseGlosses(project_id: ProjectId, reference: VerseReference): Promise<PhraseGlossRow[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`
SELECT 
    _id AS phrase_gloss_id,
    from_word_id,
    to_word_id,
    markdown,
    JSON_ARRAYAGG(user_id) as votes
FROM 
    phrase_gloss
LEFT JOIN 
    phrase_gloss_votes 
ON 
    phrase_gloss._id = phrase_gloss_votes.phrase_gloss_id
WHERE 
    project_id = ? 
    and from_word_id in (select _id from ${reference.canon.toLowerCase()} where reference = ?)
    and vote = 1
GROUP BY 
    _id
ORDER BY 
    votes DESC;
`, [project_id, reference.toString()]);
            return rows.map((row) => {
                return {
                    phrase_gloss_id: row.phrase_gloss_id,
                    from_word_id: row.from_word_id,
                    to_word_id: row.to_word_id,
                    markdown: row.markdown,
                    votes: JSON.parse(row.votes) as string[],
                };
            });
        } catch (err) {
            console.error(err);
            return [];
        }
    }

    async seekVerse(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after", exclusivity: "me" | "anyone"): Promise<VerseReference> {
        if (exclusivity == "me") {
            return await this.seekVerseExclusiveToMe(project_id, user_id, frequency_threshold, startingPosition, direction);
        } else {
            return await this.seekVerseExclusiveAnyone(project_id, user_id, frequency_threshold, startingPosition, direction);
        }
    }

    private async seekVerseExclusiveToMe(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after"): Promise<VerseReference> {
        try {
            // console.info(`Seeking verse for user ${user_id} in project ${project_id} starting at ${startingPosition} in direction ${direction} with exclusivity ${exclusivity} and frequency threshold ${frequency_threshold}`);

            const orderDirection = direction === "before" ? "DESC" : "ASC";
            const greaterThanLessThan = direction === "before" ? "<" : ">";
            const minMax = direction === "before" ? "min" : "max";
            const canon = startingPosition.canon.toLowerCase();

            const query = `SELECT ${canon}.reference FROM ${canon} 
                                    LEFT JOIN votes
                                    ON  votes.word_id=${canon}._id and votes.project_id=?  AND votes.user_id=? 
                                    LEFT JOIN gloss 
                                    ON votes.gloss_id=gloss._id  
        LEFT JOIN project_roles
        ON votes.user_id = project_roles.user_id     
        WHERE 
            (vote is null OR vote=0) 
            AND 
            ${canon}.freq_lex < ? 
            AND 
            ${canon}._id ${greaterThanLessThan} (SELECT ${minMax}(_id) FROM ${canon} WHERE reference=? ) 
        ORDER BY ${canon}._id ${orderDirection} 
        LIMIT 1;`;

            const [rows] = await this.connection.query<RowDataPacket[]>(query, [project_id, user_id, frequency_threshold.toString(), startingPosition.toString()]);
            if (rows.length === 0) {
                return this.boundaryVerse(startingPosition.canon, direction);
            }
            const ref = VerseReference.fromString(rows[0].reference);

            if (ref === undefined) {
                console.error(query);
                console.error(`Bad reference returned for user ${user_id} in project ${project_id} starting at ${startingPosition} in direction ${direction} with exclusivity me and frequency threshold ${frequency_threshold}`);
                return InternalFailure(`Bad reference returned for user ${user_id} in project ${project_id} starting at ${startingPosition} in direction ${direction} with exclusivity me and frequency threshold ${frequency_threshold}`);
            }
            return ref;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error seeking verse data");
        }
    }

    private async seekVerseExclusiveAnyone(project_id: ProjectId, user_id: UserId, frequency_threshold: number, startingPosition: VerseReference, direction: "before" | "after"): Promise<VerseReference> {
        try {
            const orderDirection = direction === "before" ? "DESC" : "ASC";
            const greaterThanLessThan = direction === "before" ? "<" : ">";
            const minMax = direction === "before" ? "min" : "max";
            const canon = startingPosition.canon.toLowerCase();

            const query = `SELECT ${canon}.reference ,sum( ifnull(vote,0) ) as vote_count FROM ${canon}
                                    LEFT JOIN votes
                                    ON  votes.word_id=${canon}._id and votes.project_id=?  
                                    LEFT JOIN gloss 
                                    ON votes.gloss_id=gloss._id  
                                left join project_roles
                                on project_roles.user_id = votes.user_id and project_roles.project_id=? and project_roles.user_role != 'disabled'
                            WHERE
                                ${canon}.freq_lex < ?
                                AND
                                ${canon}._id ${greaterThanLessThan} (SELECT ${minMax}(_id) FROM ${canon} WHERE reference=?)
                            group by ${canon}._id
                            having vote_count = 0 
                            order by ${canon}._id ${orderDirection}
                            limit 1
                        ;`;

            const [rows] = await this.connection.query<RowDataPacket[]>(query, [project_id, project_id, frequency_threshold.toString(), startingPosition.toString()]);
            if (rows.length === 0) {
                return this.boundaryVerse(startingPosition.canon, direction);
            }
            const ref = VerseReference.fromString(rows[0].reference);

            if (ref === undefined) {
                const msg = `Bad reference returned for user ${user_id} in project ${project_id} starting at ${startingPosition} in direction ${direction} with exclusivity anyone and frequency threshold ${frequency_threshold}`;
                console.error(msg);
                return InternalFailure(msg);
            }
            return ref;
        } catch (err) {
            console.error(err);
            return InternalFailure("Error seeking verse data");
        }
    }

    private boundaryVerse(canon: Canon, direction: "before" | "after"): VerseReference {
        const canonData = getCanon(canon);
        if (direction === "before") {
            return canonData.firstVerseOfCanon();
        } else {
            return canonData.lastVerseOfCanon();
        }
    }

    async getProjectDescriptions(): Promise<ProjectDescription[]> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`select project_id,JSON_VALUE(settings,'$.project_title') as project_title,JSON_VALUE(settings,'$.project_description') as project_description,JSON_VALUE(settings,'$.allow_joins') as allow_joins from project order by project_title ASC;`);
            return rows.map((row) => {
                return {
                    project_id: row.project_id,
                    project_title: row.project_title,
                    project_description: row.project_description,
                    allow_joins: row.allow_joins === "1"
                };
            });
        } catch (error) {
            console.error(error);
            return InternalFailure("Error retrieving project descriptions");
        }
    }

    async updateGloss(user_id: UserId, gso: GlossSendObject): Promise<boolean> {
        try {
            const hasPower = await this.userHasPowerOverGloss(user_id, gso.annotationObject.gloss_id, 'gloss');
            if (hasPower) {
                const [result] = await this.connection.execute<mysql.ResultSetHeader>(`update gloss set gloss=? where _id=?;`, [JSON.stringify(gso.annotationObject), gso.annotationObject.gloss_id]);
                return result.affectedRows > 0;
            } else {
                return Failure(403, "User is not a power user in this project.");
            }
        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating gloss");
        }
    }

    async updatePhraseGloss(user_id: UserId, gso: GlossSendObject): Promise<boolean> {
        try {
            const hasPower = await this.userHasPowerOverGloss(user_id, gso.annotationObject.gloss_id, 'phrase_gloss');
            if (hasPower) {
                const markdown = (gso.annotationObject.content as MarkdownAnnotationContent).markdown;
                const [result] = await this.connection.execute<mysql.ResultSetHeader>(`update phrase_gloss set markdown=? where _id=?;`, [markdown, gso.annotationObject.gloss_id]);
                return result.affectedRows > 0;
            } else {
                return Failure(403, "User is not a power user in this project.");
            }
        } catch (err) {
            console.error(err);
            return InternalFailure("Error updating phrase gloss");
        }
    }

    async deleteGloss(user_id: UserId, gloss_id: number, table: 'gloss' | 'phrase_gloss'): Promise<boolean> {
        try {
            const hasPower = await this.userHasPowerOverGloss(user_id, gloss_id, table);
            if (hasPower) {
                const [result] = await this.connection.execute<mysql.ResultSetHeader>(`delete from ${table} where _id=?;`, [gloss_id]);
                return result.affectedRows > 0;
            } else {
                return Failure(403, "User is not a power user in this project.");
            }
        } catch (err) {
            console.error(err);
            return InternalFailure("Error deleting gloss");
        }
    }

    async userHasPowerOverGloss(user_id: UserId, gloss_id: number, table: 'gloss' | 'phrase_gloss'): Promise<boolean> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`select power_user from ${table} left join project_roles on project_roles.project_id=${table}.project_id where _id=? and user_id=?;`, [gloss_id, user_id]);
            if (rows.length === 0) {
                return false; // No such gloss or user
            }
            return rows[0].power_user === 1; // Check if the user has power over the gloss
        } catch (err) {
            console.error(err);
            return InternalFailure("Error checking if user has power over gloss");
        }
    }


    async joinProject(user_id: UserId, project_id: ProjectId): Promise<boolean> {
        try {
            const isJoinable = await this.projectIsJoinable(project_id);
            if (isJoinable) {
                await this.connection.execute(`insert ignore into project_roles values (?,?,'member',0);`, [user_id, project_id]);
                return true;
            } else {
                return Failure(403, "Project is not joinable by this user.");
            }
        } catch (err) {
            console.error(err);
            return InternalFailure("Error joining project");
        }
    }

    async projectIsJoinable(project_id: ProjectId): Promise<boolean> {
        try {
            const [rows] = await this.connection.query<RowDataPacket[]>(`select JSON_VALUE(settings,'$.allow_joins') AS allow_joins FROM project WHERE project_id=?;`, [project_id]);
            if (rows.length === 0) {
                return false; // Project not found, so not joinable
            }
            return rows[0].allow_joins === '1';
        } catch (err) {
            console.error(err);
            return false; // Error occurred, treat as not joinable
        }
    }


    async getProjectFromId(project_id: ProjectId): Promise<ProjectConfiguration> {
        try {

            const queryString = `SELECT 
        project.project_id,
        json_insert(settings, '$.roles', JSON_ARRAYAGG(JSON_OBJECT('user_id', user_id, 'user_role', user_role, 'power_user', power_user))) AS settings
    FROM 
        project 
        LEFT JOIN project_roles ON project.project_id = project_roles.project_id 
    WHERE project.project_id = ?
    GROUP BY 
        project.project_id;`;
            const [rows] = await this.connection.query<RowDataPacket[]>(queryString, [project_id]);
            return ProjectConfiguration.fromRow(JSON.parse(rows[0].settings))
        } catch (error) {
            console.error(error);
            return Promise.reject("Error retrieving project data: ${project_id}");
        }
    }

    async checkForMissingGlosses(request: PublicationRequest, bid: BookIdentifier): Promise<string[]> {
        const canon = bid.canon.toLowerCase(); /// in Linux, MariaDB table names can be case sensitive
        const queryString = `SELECT DISTINCT ${canon}.reference FROM ${canon} 
                                    LEFT JOIN votes
                                        ON ${canon}._id = votes.word_id  AND votes.project_id = ? 
                                    LEFT JOIN gloss 
                                        ON gloss._id = votes.gloss_id 
                                    WHERE 
                                        ${canon}.reference LIKE '${canon} ${bid.book}%' 
                                        AND ${canon}.freq_lex < ?	
                                    GROUP BY ${canon}._id 
                                    HAVING SUM(IFNULL(vote,0)) < 1 OR SUM(IFNULL(vote,0)) IS NULL
                                    ORDER BY ${canon}._id ASC
                                    LIMIT 10;`;

        const frequency_threshold = request.frequency_thresholds.get(bid.canon);
        const [rows] = await this.connection.query<RowDataPacket[]>(queryString, [request.project.project_id, frequency_threshold]);
        return rows.map((row) => row.reference);
    }

    async getDatabaseRows<T extends PublicationGreekWordElementRow | PublicationHebrewWordElementRow>(project_id: ProjectId, bid: BookIdentifier, query: string): Promise<BookDumpJson<T>> {
        const bookName = await this.getCanonicalBookName(bid.canon, bid.book);
        let [rows] = await this.connection.execute<RowDataPacket[]>(query, [project_id, project_id])
        if (rows === undefined) {
            console.error(`No rows returned for ${bid.canon} ${bid.book}`);
            console.error(query);
            return Promise.reject(`No rows returned for ${bid.canon} ${bid.book}`);
        }

        /// convert the annotation JSON to objects
        /// I'm doing this so that we can assume that the data in PublicationBook has objects rather than just strings
        rows = rows.map((row) => {
            if (row.gloss != null && typeof row.gloss === 'string') {
                row.gloss = annotationFromJson(row.gloss);
            }

            if (row.phrasalGlosses != null) {
                row.phrasalGlosses = JSON.parse(row.phrasalGlosses);
            }

            return row;
        });

        return {
            book_id: bid.book,
            canon: bid.canon,
            book_title: bookName || '',
            rows: rows as T[]
        };
    }

    async getCanonicalBookName(canon: Canon, book: UbsBook): Promise<string | undefined> {
        const [rows] = await this.connection.execute<RowDataPacket[]>('SELECT `name` FROM `canonical_names` WHERE `canon`=? AND ubs=?;', [canon, book])
        if (rows.length > 0) {
            return rows[0].name;
        } else {
            return undefined;
        }
    }

    async getFontUrlsForFamiliy(family: string): Promise<string[]> {
        const [rows] = await this.connection.execute<RowDataPacket[]>('SELECT `url` FROM `fonturls` WHERE `family`=?;', [family]);
        return rows.map((row) => row.url);
    }

    async getOTBook(project_id: ProjectId, bid: BookIdentifier): Promise<PublicationBook<PublicationHebrewWordElementRow>> {
        const content = await this.getDatabaseRows<PublicationHebrewWordElementRow>(project_id, bid, `SELECT ot._id,g_word_utf8, trailer_utf8, voc_lex_utf8, gn, nu, st, vt, vs, ps, pdp, freq_lex, gloss.gloss AS gloss, qere_utf8, kq_hybrid_utf8, prs_gn, prs_nu, prs_ps, ot.reference,ot.lex_id,
IF( count(from_word_id) = 0, JSON_ARRAY(),
JSON_ARRAYAGG( DISTINCT JSON_OBJECT('from_word_id', from_word_id, 'to_word_id', to_word_id, 'markdown', phrase_gloss.markdown) )) AS phrasalGlosses
FROM ot 
                        LEFT JOIN votes
                        ON votes.project_id = ? AND votes.word_id = ot._id
                        LEFT JOIN gloss 
                        ON gloss._id = votes.gloss_id 
                        LEFT JOIN phrase_gloss 
                        ON phrase_gloss.from_word_id = ot._id 
                        AND phrase_gloss.project_id = ? 
                    WHERE 
                        ot.reference LIKE '${bid.canon} ${bid.book}%' 
                    GROUP BY ot._id
                    ORDER BY ot._id ASC;`);
        return new PublicationBook<PublicationHebrewWordElementRow>(content);
    }

    async getNTBook(project_id: ProjectId, bid: BookIdentifier): Promise<PublicationBook<PublicationGreekWordElementRow>> {
        const content = await this.getDatabaseRows<PublicationGreekWordElementRow>(project_id, bid, `SELECT nt._id,punctuated_text, unpunctuated_text, lemma, part_of_speech, person, tense, voice, mood, grammatical_case, grammatical_number, gender, degree, freq_lex, nt.reference,nt.lex_id, gloss.gloss AS gloss,
            IF( count(from_word_id) = 0, JSON_ARRAY(),
                JSON_ARRAYAGG( DISTINCT JSON_OBJECT('from_word_id', from_word_id, 'to_word_id', to_word_id, 'markdown', phrase_gloss.markdown) )) AS phrasalGlosses
            FROM nt 
                        LEFT JOIN votes
                        ON votes.project_id = ? AND votes.word_id = nt._id
                        LEFT JOIN gloss 
                        ON gloss._id = votes.gloss_id 
                        LEFT JOIN phrase_gloss 
                        ON phrase_gloss.from_word_id = nt._id 
                        AND phrase_gloss.project_id = ? 
                    WHERE 
                        nt.reference LIKE '${bid.canon} ${bid.book}%' 
                    GROUP BY nt._id 
                    ORDER BY nt._id ASC;`);
        return new PublicationBook<PublicationGreekWordElementRow>(content);
    }

    async getStats(project_id: ProjectId, canoncanon: Canon, book?: UbsBook): Promise<StatsSummary> {
        const canon = canoncanon.toLowerCase(); /// in Linux, MariaDB table names can be case sensitive
        const project = await this.getProjectFromId(project_id);
        const frequency_threshold = project.getFrequencyThreshold(canoncanon);
        // const bookClause = book ? ` and ${canon}.reference LIKE '${canon} ${book}%' ` : ` `;
        const bookClause = book ? ` and reference LIKE '${canon} ${book}%' ` : ` `;

        let query = `select count(distinct lex_id) as tally from ${canon} where freq_lex < ? ${bookClause}`;
        let [result] = await this.connection.query<RowDataPacket[]>(query, [frequency_threshold]);
        if (result.length === 0 || result[0].tally === undefined) {
            return InternalFailure("Error retrieving stats data");
        }
        const totalLexicalItems = result[0].tally as number;

        query = `select count(distinct lex_id) as tally from gloss where project_id=? and lex_id in (select lex_id from ${canon} where 1=1 ${bookClause});`;
        [result] = await this.connection.query<RowDataPacket[]>(query, [project_id]);
        if (result.length === 0 || result[0].tally === undefined) {
            console.error(query);
            console.error(result);
            return InternalFailure("Error retrieving stats data");
        }
        const lexicalItemsWithGloss = result[0].tally as number;

        query = `select count(_id) as tally from ${canon} where freq_lex < ? ${bookClause};`;
        [result] = await this.connection.query<RowDataPacket[]>(query, [frequency_threshold]);
        if (result.length === 0 || result[0].tally === undefined) {
            console.error(query);
            console.error(result);
            return InternalFailure("Error retrieving stats data");
        }
        const totalWords = result[0].tally as number;

        query = `select count(distinct word_id) as tally from votes where project_id=? and word_id in (select _id from ${canon} where 1=1 ${bookClause});`;
        [result] = await this.connection.query<RowDataPacket[]>(query, [project_id]);
        if (result.length === 0 || result[0].tally === undefined) {
            console.error(query);
            console.error(result);
            return InternalFailure("Error retrieving stats data");
        }
        const wordsWithGlosses = result[0].tally as number;

        query = `select count(_id) as tally from ${canon} where _id not in (select word_id from votes where project_id=?) and lex_id in (select lex_id from gloss where project_id=?) ${bookClause};`;
        [result] = await this.connection.query<RowDataPacket[]>(query, [project_id, project_id]);
        if (result.length === 0 || result[0].tally === undefined) {
            console.error(query);
            console.error(result);
            return InternalFailure("Error retrieving stats data");
        }
        const potentialGlosses = result[0].tally as number;

        return {
            lexicalItems: {
                with: lexicalItemsWithGloss,
                without: totalLexicalItems - lexicalItemsWithGloss
            },
            words: {
                with: wordsWithGlosses,
                without: totalWords - wordsWithGlosses - potentialGlosses,
                potential: potentialGlosses
            },
        }
    }

}