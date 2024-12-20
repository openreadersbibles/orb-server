import mysql from 'mysql2/promise';
import { HollowPublicationRequest, PublicationRequest } from '../../models/PublicationRequest';
import { BookIdentifier } from '../../models/BookIdentifier';
import path from 'path';
import { annotationFromObject } from '../../models/Annotation';
import { Canon, UbsBook, VerseReference } from '../../models/VerseReference';
import { BookDump, BookHopper } from '../../models/ProjectDump';
import { HasReferenceString, PublicationHebrewWordElement } from '../../models/publication/PublicationHebrewWordElement';
import { PublicationVerse, WordElementCreator } from '../../models/publication/PublicationVerse';
import { PublicationGreekWordElement } from '../../models/publication/PublicationGreekWordElement';
import { ProjectConfiguration, ProjectId } from '../../models/ProjectConfiguration';
import { GitHubAdapter, GitHubFile } from './GitHubAdapter';
import { GitHubActionYML } from './GitHubActionYML';
import axios, { ResponseType } from 'axios';
import { ParsingFormat } from '../../models/parsing-formats/ParsingFormat';
import { create } from 'xmlbuilder2';
import logger from './logger';

export interface PublisherInterface {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    checkForMissingGlosses(): Promise<string[]>;
    createDataDump(): Promise<void>;
    createTeX(): Promise<void>;
}


export interface CheckResults {
    [key: string]: string[];
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

        /// get the parsing formats from the project
        let parsingFormats = new Map<Canon, ParsingFormat>();
        for (const key in req.parsing_formats) {
            if (req.parsing_formats.hasOwnProperty(key)) {
                const format = project.publicationSettings.getParsingFormatFromId(req.parsing_formats[key]);
                if (!format) {
                    return Promise.reject('Parsing format not found:' + req.parsing_formats[key]);
                } else {
                    parsingFormats.set(key as Canon, format);
                }
            }
        }

        this._request = {
            books: req.books.map(b => BookIdentifier.fromString(b)).filter(b => b !== undefined) as BookIdentifier[],
            project: project,
            parsing_formats: parsingFormats,
            nopdf: req.nopdf,
            latex_template_id: req.latex_template_id
        };

    }

    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.end();
                // console.log('Disconnected from the database');
            } catch (error) {
                console.error('Error disconnecting from the database:', error);
            }
        }
    }

    async checkAllFilesForMissingGlosses(): Promise<CheckResults> {
        let results: CheckResults = {};
        await Promise.all(this.request.books.map(async (bid: BookIdentifier) => {
            let mg = await this.checkForMissingGlosses(bid);
            console.log(`Missing glosses for ${bid.toString()}: ${mg.join(', ')}`);
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
        const [rows] = await this.connection.query<any[]>(queryString, [this._request.project.id, frequency_threshold]);
        return rows.map((row: any) => row.reference);
    }

    async publish(): Promise<any> {
        /// Create the repository if it doesn't yet exist
        await this._github.createRepositoryIfNotExists(this.request.project.repositoryNameForTemplate(this.request.latex_template_id));

        /// The content of the files we create will be kept in this array:
        let files: GitHubFile[] = [];

        /// Create a data dump for each book
        await Promise.all(this.request.books.map(async (bid: BookIdentifier) => {
            console.log(`Processing ${bid.canon} ${bid.book}`);

            /// Create the book dump
            const dump: BookDump = await this.getBookDump(bid);
            files.push({ path: this.dumpFilename(bid), content: JSON.stringify(dump, null, 2) });

            /// Create a TeX file for the book
            const tex = await Publisher.bookDumpToTex(dump, this._request);
            files.push({ path: this.texFilename(bid), content: tex });

            const tei = await Publisher.bookDumpToTEI(dump, this._request);
            files.push({ path: this.teiFilename(bid), content: tex });

            console.log(`Finished processing ${bid.canon} ${bid.book}. Now files has ${files.length} items.`);
        }));

        /// Create the GitHub action file
        if (this._request.nopdf) {
            files.push({ path: GitHubActionYML.ymlFilePath, content: '' });
        } else {
            let ymlContent = await this.createYMLFile(this._request.books.map(bid => this.texFilename(bid)));
            files.push({ path: GitHubActionYML.ymlFilePath, content: ymlContent });
        }

        /// Get the fonts
        let googleFonts = await this.getGoogleFonts(this.request.project.publicationProjectFont);
        files.push(...googleFonts);

        /// Get the biblical font
        if (this.request.project.publicationBiblicalFont === 'SBL BibLit') {
            files.push({ path: 'fonts/SBL_BLit.ttf', content: await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/SBL_BLit.ttf`, 'arraybuffer') });
        } else {
            let googleFonts = await this.getGoogleFonts(this.request.project.publicationBiblicalFont);
            files.push(...googleFonts);
        }

        /// Copy the CLS file
        files.push({ path: 'openreader.cls', content: await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/openreader.cls`) });

        /// Print file paths to console
        files.forEach(file => {
            console.log(`File path: ${file.path}`);
        });

        /// Add the files to the repository and create a new commit
        return await this._github.addFilesToRepository(this.request.project.repositoryNameForTemplate(this.request.latex_template_id), files);
    }

    async getBookDump(bid: BookIdentifier): Promise<BookDump> {
        let book: BookDump = { book_id: bid.book, canon: 'LXX', book_title: '', verses: [] };
        switch (bid.canon) {
            case 'OT':
                book = await this.getOTBook(bid);
            case 'NT':
                book = await this.getNTBook(bid);
            case 'LXX':
                console.log("LXX not implemented yet");
        }

        /// convert the annotation JSON to objects
        book.verses = book.verses.map((row: any) => {
            if (row.gloss !== null) {
                row.gloss = annotationFromObject(row.gloss);
            }
            return row;
        });

        return book;
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
        const [rows] = await this.connection.query<any[]>(queryString, [project_id]);
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

    static bookDumpToTex(book: BookDump, request: PublicationRequest): string {
        let content = "";
        switch (book.canon) {
            case 'OT':
                content = this.processRowsToTex(book.verses, request, PublicationHebrewWordElement.fromWordRow);
                break;
            case 'NT':
                content = this.processRowsToTex(book.verses, request, PublicationGreekWordElement.fromWordRow);
                break;
            default:
                throw new Error('Invalid canon');
        }

        let biblicalFontCommand = "";
        if (book.canon == "OT") {
            biblicalFontCommand = `\\newfontfamily\\hebrewfont[Script=Hebrew]{${request.project.publicationBiblicalFont}}`;
        } else {
            biblicalFontCommand = `\\newfontfamily\\greekfont[Script=Greek]{${request.project.publicationBiblicalFont}}`;
        }

        const template = request.latex_template_id === undefined ? ProjectConfiguration.default_latex_template : request.project.getLatexTemplate(request.latex_template_id) || ProjectConfiguration.default_latex_template;
        const tex = template
            .replace('__TITLE__', book.book_title)
            .replace('__MAINLANGUAGE__', request.project.polyglossiaOtherLanguage)
            .replace('__MAINLANGUAGEFONT__', request.project.publicationProjectFont)
            .replace('__BIBLICALLANGUAGE__', book.canon == "OT" ? "hebrew" : "greek")
            .replace('__BIBLICALLANGUAGE__', book.canon == "OT" ? "hebrew" : "greek") /// occurs twice
            .replace('__NEWFONTFAMILYCOMMAND__', biblicalFontCommand)
            .replace('__CONTENT__', content);

        return tex;
    }

    static processRowsToTex(
        rows: any[],
        request: PublicationRequest,
        objectCreator: WordElementCreator
    ): string {
        let buffer = '';
        let book = Publisher.putIntoHoppers(rows);

        book.forEach((chapter: any[], chapterIndex: number) => {
            let plainChapterNumber = request.project.replaceNumerals((chapterIndex + 1).toString());
            let footnoteChapterHeader = request.project.getChapterHeader(chapterIndex + 1);
            buffer += `\\section*{${plainChapterNumber}}\n`;
            buffer += `\\FootnoteHeader{${footnoteChapterHeader}}\n`;
            chapter.forEach((verse: any[]) => {
                let reference = VerseReference.fromString(verse[0].reference);
                if (reference) {
                    const v = PublicationVerse.fromWordElements(verse, reference, request, objectCreator);
                    buffer += v.text();
                }
            });
        });

        return buffer;
    }

    static bookDumpToTEI(book: BookDump, request: PublicationRequest): string {
        let content = "";
        switch (book.canon) {
            case 'OT':
                content = this.processRowsToXml(book, request, PublicationHebrewWordElement.fromWordRow);
                break;
            case 'NT':
                content = this.processRowsToXml(book, request, PublicationGreekWordElement.fromWordRow);
                break;
            default:
                throw new Error('Invalid canon');
        }
        return content;
    }

    static processRowsToXml(
        book: BookDump,
        request: PublicationRequest,
        objectCreator: WordElementCreator
    ): string {
        let chapters = Publisher.putIntoHoppers(book.verses);

        const currentDate = new Date();
        const publicationStmt = `Generated by openreadersbibles.org at ${currentDate.toISOString()}`;

        const doc = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('TEI', { version: '3.3.0', xmlns: 'http://www.tei-c.org/ns/1.0' })
            .ele('teiHeader')
            .ele('fileDesc')
            .ele('titleStmt')
            .ele('title').txt(book.book_title).up()
            .up()
            .ele('publicationStmt')
            .ele('p').txt(publicationStmt).up()
            .up()
            .up()
            .up()
            .ele('text')
            .ele('body');

        chapters.forEach((chapter: any[], chapterIndex: number) => {
            const plainChapterNumber = request.project.replaceNumerals((chapterIndex + 1).toString());
            const footnoteChapterHeader = request.project.getChapterHeader(chapterIndex + 1);

            const chapter_node = doc.ele('div', { type: 'chapter', n: chapterIndex + 1 });

            chapter.forEach((verse: any[]) => {
                let reference = VerseReference.fromString(verse[0].reference);
                if (reference) {
                    const v = PublicationVerse.fromWordElements(verse, reference, request, objectCreator);
                    const verse_node = chapter_node.ele('div', { type: 'verse', n: reference.verse });
                    v.verseXml(verse_node);
                }
            });
        });

        return doc.end({ prettyPrint: false });
    }

    static putIntoHoppers(rows: HasReferenceString[]): BookHopper {
        let hopper: BookHopper = [];
        let currentChapter = 0;
        let currentVerse = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let reference = VerseReference.fromString(row.reference);
            if (reference) {
                /// if we've hit a new chapter create a new section
                if (reference.chapter !== currentChapter) {
                    /// create a new chapter
                    hopper.push([]);
                    /// create a new verse
                    hopper[hopper.length - 1].push([]);
                    currentChapter = reference.chapter;
                    currentVerse = 1;
                } else if (reference.verse !== currentVerse) {
                    /// create a new verse
                    hopper[hopper.length - 1].push([]);
                    currentVerse = reference.verse;
                }
                let chapter = hopper[hopper.length - 1];
                let verse = chapter[chapter.length - 1];
                verse.push(row);
            } else {
                console.error('Error parsing reference: ' + reference);
            }
        }
        return hopper;
    }

    async getOTBook(bid: BookIdentifier): Promise<BookDump> {
        return await this.getDatabaseRows(bid, `SELECT ot._id,g_word_utf8, trailer_utf8, voc_lex_utf8, gn, nu, st, vt, vs, ps, pdp, freq_lex, gloss.gloss AS gloss, qere_utf8, kq_hybrid_utf8, prs_gn, prs_nu, prs_ps, ot.reference,ot.lex_id,
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
    }

    async getNTBook(bid: BookIdentifier): Promise<BookDump> {
        return this.getDatabaseRows(bid, `SELECT nt._id,punctuated_text, unpunctuated_text, lemma, part_of_speech, person, tense, voice, mood, grammatical_case, grammatical_number, gender, degree, freq_lex, nt.reference,nt.lex_id, gloss.gloss AS gloss,
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
    }

    async getDatabaseRows(bid: BookIdentifier, query: string): Promise<BookDump> {
        // console.log(query);
        let bookName = await this.getCanonicalBookName(bid.canon, bid.book);
        let [rows] = await this.connection.execute<any[]>(query, [this._request.project.id, this._request.project.id])
        rows = rows.map((row: any) => {
            if (row.gloss !== null) {
                let obj = JSON.parse(row.gloss);
                row.gloss = annotationFromObject(obj)?.toAnnotationObject();
            }
            if (row.phrasalGlosses !== null) {
                row.phrasalGlosses = JSON.parse(row.phrasalGlosses);
            }

            return row;
        });
        return {
            book_id: bid.book,
            canon: bid.canon,
            book_title: bookName || '',
            verses: rows
        };
    }

    async getCanonicalBookName(canon: Canon, book: UbsBook): Promise<string | undefined> {
        let [rows] = await this.connection.execute<any[]>('SELECT `name` FROM `canonical_names` WHERE `canon`=? AND ubs=?;', [canon, book])
        if (rows.length > 0) {
            return rows[0].name;
        } else {
            return undefined;
        }
    }

    async getFontUrlsForFamiliy(family: string): Promise<string[]> {
        let [rows] = await this.connection.execute<any[]>('SELECT `url` FROM `fonturls` WHERE `family`=?;', [family]);
        return rows.map((row: any) => row.url);
    }

    async getGoogleFonts(family: string): Promise<GitHubFile[]> {
        const urls = await this.getFontUrlsForFamiliy(family);
        const promises = urls.map(async (url: string) => {
            const parsedUrl = new URL(url);
            const basename = 'fonts/' + path.basename(parsedUrl.pathname);
            const fileContent = await Publisher.downloadContent(url, 'arraybuffer');
            let ghf: GitHubFile = { path: basename, content: fileContent };
            return ghf;
        });
        return await Promise.all(promises);
    }

    static async downloadContent(url: string, responseType: ResponseType = 'text'): Promise<any> {
        try {
            const response = await axios.get(url, {
                responseType: responseType
            });
            return response.data;
        } catch (error) {
            console.error(`Error downloading content from ${url}:`, error);
            return Promise.reject(error);
        }
    }

    async createYMLFile(texFilenames: string[]): Promise<string> {
        const fileContent = await Publisher.downloadContent(`https://github.com/openreadersbibles/publication-files/raw/refs/heads/main/github-actions.yml`)
        const lines = texFilenames.join("\n            ");
        const newContent = fileContent.replace(/__FILES_GO_HERE__/g, lines);
        return newContent;
    }


}