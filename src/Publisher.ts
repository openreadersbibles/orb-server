import { HollowPublicationRequest, PublicationRequest } from '@models/PublicationRequest.js';
import { PublicationBook } from '@models/publication/PublicationBook.js';
import { BookIdentifier } from '@models/BookIdentifier.js';
import path from 'path';
import { GitHubAdapter, GitHubFile } from './GitHubAdapter.js';
import { GitHubActionYML } from './GitHubActionYML.js';
import axios, { ResponseType } from 'axios';
import { XslTransformations } from './XslTransformations.js';
import logger from "./logger.js";
import { PublicationConfiguration } from '@models/PublicationConfiguration.js';
import { PublicationHebrewWordElementRow } from '@models/publication/PublicationHebrewWordElementRow.js';
import { PublicationGreekWordElementRow } from '@models/publication/PublicationGreekWordElementRow.js';
import { AdHocPublicationResult, CheckResults } from '@models/database-input-output.js';
import { GenericDatabaseAdapter } from './GenericDatabaseAdapter.js';

/// a feature of this case is that _request is not defined until the connect method is called
export class Publisher {
    /// this is lazy, but we'll assume initialize has been called
    protected _request!: PublicationRequest;
    protected _github!: GitHubAdapter;
    protected _adapter: GenericDatabaseAdapter;

    private constructor(adapter: GenericDatabaseAdapter) {
        this._adapter = adapter;
    }

    static async createPublisher(adapter: GenericDatabaseAdapter, request: HollowPublicationRequest): Promise<Publisher> {
        /// Check to see if the required fields are present
        if (request.project_id === undefined
            || request.books === undefined
            || request.publication_configuration_id === undefined) {
            throw "Missing required fields.";
        }

        const publisher = new Publisher(adapter);

        /// get the project from the database        
        const project = await adapter.getProjectFromId(request.project_id);
        if (!project) {
            return Promise.reject(`Project not found: ${request.project_id}`);
        }

        publisher._github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '', project);

        const configuration = project.publicationConfigurations.get(request.publication_configuration_id);
        if (!configuration) {
            return Promise.reject(`Publication configuration not found: ${request.publication_configuration_id}`);
        }

        publisher._request = {
            books: request.books.map(b => BookIdentifier.fromObject(b)).filter(b => b !== undefined) as BookIdentifier[],
            project: project,
            configuration: configuration,
            nopdf: request.nopdf,
        };

        return publisher;
    }

    async checkAllFilesForMissingGlosses(): Promise<CheckResults> {
        const results: CheckResults = {};
        await Promise.all(this.request.books.map(async (bid: BookIdentifier) => {
            const mg = await this._adapter.checkForMissingGlosses(this._request.project, bid);
            if (mg.length > 0) {
                logger.error(`Missing glosses for ${bid.toString()}: ${mg.join(', ')}`);
            }
            results[bid.toString()] = mg;
        }));
        return results;
    }

    async publish(): Promise<AdHocPublicationResult> {
        /// Create the repository if it doesn't yet exist
        await this._github.setupRepository(this.request.project.repositoryName);

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
            /// Note that the publication configuration folder is not prefixed here; the YWL sets the working directory for the TeX run
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
                pb = await this._adapter.getOTBook(this.request.project.id, bid);
            } else {
                pb = await this._adapter.getNTBook(this.request.project.id, bid);
            }
            files.push({ path: this.dumpFilename(bid), content: JSON.stringify(pb.toJsonObject(), null, 2) });

            const tei = pb.toTEI(this._request);
            files.push({ path: this.teiFilename(bid), content: tei, pb: pb });

            logger.info(`Finished processing ${bid.canon} ${bid.book}. Now files has ${files.length} items.`);
        }));
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

    async getGoogleFonts(family: string): Promise<GitHubFile[]> {
        const urls = await this._adapter.getFontUrlsForFamiliy(family);
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
            .replace(/__LAYOUT_DIRECTION__/g, this.request.project.layout_direction)
            .replace(/__PROJECT_FONT__/g, this.request.configuration.publicationProjectFont);
        return cssContent;
    }

}