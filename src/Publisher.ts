import mysql, { RowDataPacket } from 'mysql2/promise';
import { HollowPublicationRequest, PublicationRequest } from '../../models/PublicationRequest';
import { BookDumpJson, PublicationBook } from '../../models/publication/PublicationBook';
import { BookIdentifier } from '../../models/BookIdentifier';
import path from 'path';
import { Canon, UbsBook } from '../../models/VerseReference';
import { ProjectConfiguration, ProjectId } from '../../models/ProjectConfiguration';
import { GitHubAdapter, GitHubFile } from './GitHubAdapter';
import { GitHubActionYML } from './GitHubActionYML';
import axios, { ResponseType } from 'axios';
import { XslTransformations } from './XslTransformations';
import logger from "./logger";
import { PublicationConfiguration } from '../../models/PublicationConfiguration';
import { annotationFromJson } from '../../models/Annotation';
import { PublicationHebrewWordElementRow } from '../../models/publication/PublicationHebrewWordElementRow';
import { PublicationGreekWordElementRow } from '../../models/publication/PublicationGreekWordElementRow';
import { CheckResults } from '../../models/database-input-output';

export interface PublisherInterface {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    checkForMissingGlosses(): Promise<string[]>;
    createDataDump(): Promise<void>;
    createTeX(): Promise<void>;
}

/// a feature of this case is that _request is not defined until the connect method is called
export class Publisher {
    protected connection!: mysql.Connection;
    protected _request!: PublicationRequest;
    protected _github: GitHubAdapter = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');

    constructor() {
    }

    async initialize(req: HollowPublicationRequest) {
        this.connection = await mysql.createConnection({
            host: process.env['RDS_HOST'],
            user: process.env['MARIADB_USER'],
            password: process.env['MARIADB_PASSWORD'],
            database: process.env['RDS_DATABASE'],
            port: parseInt(process.env['RDS_PORT'] || '3306', 10),
        });

        /// get the project from the database        
        const project = await this.getProjectFromId(req.project_id);
        if (!project) {
            return Promise.reject(`Project not found: ${req.project_id}`);
        }

        const configuration = project.publicationConfigurations.get(req.publication_configuration_id);
        if (!configuration) {
            return Promise.reject(`Publication configuration not found: ${req.publication_configuration_id}`);
        }
        console.log(configuration.parsing_formats.get('NT'))
        // console.log(configuration.parsing_formats.values())

        this._request = {
            books: req.books.map(b => BookIdentifier.fromObject(b)).filter(b => b !== undefined) as BookIdentifier[],
            project: project,
            configuration: configuration,
            nopdf: req.nopdf,
        };

    }

    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.end();
            } catch (error) {
                logger.error('Error disconnecting from the database:', error);
            }
        }
    }

    async checkAllFilesForMissingGlosses(): Promise<CheckResults> {
        const results: CheckResults = {};
        await Promise.all(this.request.books.map(async (bid: BookIdentifier) => {
            const mg = await this.checkForMissingGlosses(bid);
            if (mg.length > 0) {
                logger.error(`Missing glosses for ${bid.toString()}: ${mg.join(', ')}`);
            }
            results[bid.toString()] = mg;
        }));
        return results;
    }

    async checkForMissingGlosses(bid: BookIdentifier): Promise<string[]> {
        const canon = bid.canon.toLowerCase(); /// in Linux, MariaDB table names can be case sensitive
        const queryString = `SELECT ${canon}.reference FROM ${canon} 
                                    LEFT JOIN gloss 
                                    ON ${canon}._id = gloss.word_id AND gloss.project_id = ?
                                    LEFT JOIN votes
                                    ON gloss._id = votes.gloss_id 
                                WHERE 
                                    ${canon}.reference LIKE '${canon} ${bid.book}%' 
                                    AND ${canon}.freq_lex < ?	
                                GROUP BY ${canon}.reference 
                                HAVING SUM(IFNULL(vote,0)) < 1 OR SUM(IFNULL(vote,0)) IS NULL
                                ORDER BY ${canon}._id ASC
                                LIMIT 10;`;

        const frequency_threshold = this._request.project.getFrequencyThreshold(bid.canon);
        const [rows] = await this.connection.query<RowDataPacket[]>(queryString, [this._request.project.id, frequency_threshold]);
        return rows.map((row) => row.reference);
    }

    async publish(): Promise<unknown> {
        /// Create the repository if it doesn't yet exist
        await this._github.createRepositoryIfNotExists(this.request.project.repositoryName);

        /// Create the GitHub pages if it doesn't yet exist
        await this._github.createGitHubPages(this.request.project.repositoryName);

        /// The content of the files we create will be kept in this array:
        const files: GitHubFile[] = [];

        /// Create a data dump for each book
        await this.createBookDumps(files);

        const filesFromXml = XslTransformations.produceTransformedFiles(files, this.request.configuration);
        files.push(...filesFromXml);

        /// Create the GitHub action file
        if (this._request.nopdf) {
            files.push({ path: GitHubActionYML.ymlFilePath, content: '' });
        } else {
            const ymlContent = await this.createYMLFile(this._request.books.map(bid => this.texFilename(bid)), this.request.configuration);
            files.push({ path: GitHubActionYML.ymlFilePath, content: ymlContent });
        }

        /// Get the fonts
        const googleFonts = await this.getGoogleFonts(this.request.configuration.publicationProjectFont);
        files.push(...googleFonts);

        /// Get the biblical font
        if (this.request.configuration.publicationBiblicalFont === 'SBL BibLit') {
            files.push({ path: this.addPublicationConfigurationFolder('fonts/SBL_BLit.ttf'), content: await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/SBL_BLit.ttf`, 'arraybuffer') });
        } else {
            const googleFonts = await this.getGoogleFonts(this.request.configuration.publicationBiblicalFont);
            files.push(...googleFonts);
        }

        /// Copy the CLS file
        files.push({ path: this.addPublicationConfigurationFolder('openreader.cls'), content: await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/openreader.cls`) });

        /// Copy the CSS file
        const styleCssContent = await this.createStyleCss();
        files.push({ path: this.addPublicationConfigurationFolder('style.css'), content: styleCssContent });

        /// Copy the JS file
        files.push({ path: this.addPublicationConfigurationFolder('script.js'), content: await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/script.js`) });

        /// Save the project configuration file to `[project_id].json`
        files.push({ path: `${this.request.project.id}.json`, content: JSON.stringify(this.request.project.toObject(), null, 2) });

        /// Print file paths to console
        // files.forEach(file => {
        //     logger.info(`File path: ${file.path}`);
        // });

        /// Add the files to the repository and create a new commit
        return await this._github.addFilesToRepository(this.request.project.repositoryName, files);
    }

    async createBookDumps(files: GitHubFile[]): Promise<void[]> {
        return Promise.all(this.request.books.map(async (bid: BookIdentifier) => {
            logger.info(`Processing ${bid.canon} ${bid.book}`);

            /// Create the book dump
            let pb: PublicationBook<PublicationGreekWordElementRow> | PublicationBook<PublicationHebrewWordElementRow>;
            if (bid.canon === 'OT') {
                // pb = await this.getBook<PublicationHebrewWordElementRow>(bid);
                pb = await this.getOTBook(bid);
            } else {
                // pb = await this.getBook<PublicationGreekWordElementRow>(bid);
                pb = await this.getNTBook(bid);
            }
            files.push({ path: this.dumpFilename(bid), content: JSON.stringify(pb.toJsonObject(), null, 2) });

            const tei = pb.toTEI(this._request);
            files.push({ path: this.teiFilename(bid), content: tei, pb: pb });

            logger.info(`Finished processing ${bid.canon} ${bid.book}. Now files has ${files.length} items.`);
        }));
    }

    async getBook(bid: BookIdentifier): Promise<PublicationBook<PublicationGreekWordElementRow> | PublicationBook<PublicationHebrewWordElementRow>> {
        switch (bid.canon) {
            case 'OT':
                return await this.getOTBook(bid);
            case 'NT':
                return await this.getNTBook(bid);
            case 'LXX':
                logger.error("LXX not implemented yet");
                return Promise.reject("LXX not implemented yet");
        }
    }

    async getProjectFromId(project_id: ProjectId): Promise<ProjectConfiguration | undefined> {
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
        if (rows.length > 0) {
            return ProjectConfiguration.fromRow(JSON.parse(rows[0].settings));
        } else {
            return Promise.reject(`Project not found or error loading it: ${project_id}`);
        }
    }

    public get request(): PublicationRequest {
        return this._request;
    }

    protected baseFilename(bid: BookIdentifier) {
        return `${this._request.project.id}_${bid.canon}_${bid.book}`;
    }

    protected dumpFilename(bid: BookIdentifier) {
        return `${this.baseFilename(bid)}.json`;
    }

    protected texFilename(bid: BookIdentifier) {
        return `${this.baseFilename(bid)}.tex`;
    }

    protected teiFilename(bid: BookIdentifier) {
        return `${this.baseFilename(bid)}.xml`;
    }

    protected addPublicationConfigurationFolder(filename: string): string {
        return this.request.configuration.id + '/' + filename;
    }

    async getOTBook(bid: BookIdentifier): Promise<PublicationBook<PublicationHebrewWordElementRow>> {
        const content = await this.getDatabaseRows<PublicationHebrewWordElementRow>(bid, `SELECT ot._id,g_word_utf8, trailer_utf8, voc_lex_utf8, gn, nu, st, vt, vs, ps, pdp, freq_lex, gloss.gloss AS gloss, qere_utf8, kq_hybrid_utf8, prs_gn, prs_nu, prs_ps, ot.reference,ot.lex_id,
IF( count(from_word_id) = 0, JSON_ARRAY(),
JSON_ARRAYAGG( DISTINCT JSON_OBJECT('from_word_id', from_word_id, 'to_word_id', to_word_id, 'markdown', phrase_gloss.markdown) )) AS phrasalGlosses
FROM ot 
                        LEFT JOIN gloss 
                        ON ot._id = gloss.word_id AND gloss.project_id = ?
                        LEFT JOIN votes
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

    async getNTBook(bid: BookIdentifier): Promise<PublicationBook<PublicationGreekWordElementRow>> {
        const content = await this.getDatabaseRows<PublicationGreekWordElementRow>(bid, `SELECT nt._id,punctuated_text, unpunctuated_text, lemma, part_of_speech, person, tense, voice, mood, grammatical_case, grammatical_number, gender, degree, freq_lex, nt.reference,nt.lex_id, gloss.gloss AS gloss,
            IF( count(from_word_id) = 0, JSON_ARRAY(),
                JSON_ARRAYAGG( DISTINCT JSON_OBJECT('from_word_id', from_word_id, 'to_word_id', to_word_id, 'markdown', phrase_gloss.markdown) )) AS phrasalGlosses
            FROM nt 
                        LEFT JOIN gloss 
                        ON nt._id = gloss.word_id AND gloss.project_id = ?
                        LEFT JOIN votes
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

    async getDatabaseRows<T extends PublicationGreekWordElementRow | PublicationHebrewWordElementRow>(bid: BookIdentifier, query: string): Promise<BookDumpJson<T>> {
        const bookName = await this.getCanonicalBookName(bid.canon, bid.book);
        let [rows] = await this.connection.execute<RowDataPacket[]>(query, [this._request.project.id, this._request.project.id])
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

    async getGoogleFonts(family: string): Promise<GitHubFile[]> {
        const urls = await this.getFontUrlsForFamiliy(family);
        const promises = urls.map(async (url: string) => {
            const parsedUrl = new URL(url);
            const basename = this.addPublicationConfigurationFolder('fonts/' + path.basename(parsedUrl.pathname));
            const fileContent = await Publisher.downloadContent(url, 'arraybuffer');
            const ghf: GitHubFile = { path: basename, content: fileContent };
            return ghf;
        });
        return await Promise.all(promises);
    }

    static async downloadContent(url: string, responseType: ResponseType = 'text'): Promise<string> {
        try {
            const response = await axios.get<string>(url, {
                responseType: responseType
            });
            return response.data;
        } catch (error) {
            logger.error(`Error downloading content from ${url}:`, error);
            return Promise.reject(error);
        }
    }

    async createYMLFile(texFilenames: string[], configuration: PublicationConfiguration): Promise<string> {
        const fileContent = await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/github-actions.yml`)
        const lines = texFilenames.join("\n            ");
        const newContent = fileContent.replace(/__FILES_GO_HERE__/g, lines)
            .replace(/__PUBLICATION_CONFIGURATION__/g, configuration.id);
        return newContent;
    }

    async createStyleCss(): Promise<string> {
        const cssContentSource = this._request.configuration.css_template;
        const cssContent = cssContentSource
            .replace(/__BIBLICAL_FONT__/g, this.request.configuration.publicationBiblicalFont)
            .replace(/__PROJECT_FONT__/g, this.request.configuration.publicationProjectFont);
        return cssContent;
    }

}