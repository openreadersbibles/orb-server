import axios, { AxiosRequestConfig } from 'axios';
import { PublicationBook } from '@models/publication/PublicationBook.js';
import { PublicationGreekWordElementRow } from '@models/publication/PublicationGreekWordElementRow.js';
import { PublicationHebrewWordElementRow } from '@models/publication/PublicationHebrewWordElementRow.js';
import { ProjectConfiguration } from '@models/ProjectConfiguration.js';
import { AdHocPublicationResult, AdHocWorkflowRunsResult } from '@models/database-input-output.js';

export interface GitHubFile { path: string, content: string, pb?: PublicationBook<PublicationGreekWordElementRow | PublicationHebrewWordElementRow> };

export class GitHubAdapter {
    private _secret: string;
    private _owner: string = "openreadersbibles";
    private config: AxiosRequestConfig;
    private _project: ProjectConfiguration | undefined;

    /// making the second argument optional is not awesome, but it allows the class
    /// to be used in instances where the full project is not available
    constructor(secret: string, project?: ProjectConfiguration) {
        this._secret = secret;
        this._owner = "openreadersbibles";
        this.config = {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${process.env['GITHUB_SECRET']}`,
                'X-GitHub-Api-Version': '2022-11-28'
                , timeout: 10000
            } // 10 seconds timeout
        };
        this._project = project;
    }

    async setupRepository(repo: string) {
        console.info(`Checking if repository ${repo} exists...`);
        const exists = await this.repositoryExists(repo);
        if (exists) {
            console.info(`Repository ${repo} already exists.`);
        } else {
            console.info(`Repository ${repo} does not exist. Creating...`);
            await this.createRepository(repo);
        }

        /// Create the GitHub pages if it doesn't yet exist
        /// Although GitHub Pages can be set up with a GitHub Action,
        /// it requires a permissions approach that I can't figure out
        /// right now. Since this works, we'll stay with doing it this way.
        await this.createGitHubPages(repo);
    }

    async createGitHubPages(repo: string) {
        try {
            console.log(`Checking if GitHub Pages is enabled for repository ${repo}...`);
            const usesPages = await this.isPagesEnabled(repo);
            if (usesPages) {
                console.info(`GitHub Pages is already enabled for repository ${repo}.`);
            } else {
                console.info(`GitHub Pages is not enabled for repository ${repo}. Creating...`);
            }
            if (!usesPages) {
                /// https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28#create-a-github-pages-site
                console.log(`https://api.github.com/repos/${this._owner}/${repo}/pages`);
                await axios.post(`https://api.github.com/repos/${this._owner}/${repo}/pages`, {
                    build_type: 'workflow',
                    source: {
                        branch: 'gh-pages',
                        path: '/'
                    }
                }, this.config);
            }
        } catch (error) {
            console.error(`Error setting up GitHub Pages: ${error}`);
        }
    }

    private async repositoryExists(repo: string): Promise<boolean> {
        try {
            await axios.get(`https://api.github.com/repos/${this._owner}/${repo}`, this.config);
            /// if data is returned, it exists
            return true;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.status === 404) {
                    return false;
                } else {
                    // Handle other errors
                    console.error(`Error checking repository existence: ${error.message}`);
                }
            }
            return false;
        }
    }

    private async isPagesEnabled(repo: string): Promise<boolean> {
        try {
            /// https://docs.github.com/en/rest/pages/pages?apiVersion=2022-11-28
            const result = await axios.get(`https://api.github.com/repos/${this._owner}/${repo}/pages`, this.config);
            /// if data is returned, it exists
            return result.status === 200;
        } catch {
            /// it returns 404 if it doesn't exist
            return false;
        }
    }

    private async createRepository(repo: string) {
        if (this._project === undefined) {
            throw Error("Project is undefined. Cannot create repository.");
        }
        try {
            /// https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
            return await axios.post('https://api.github.com/user/repos', {
                name: repo,
                description: `This repository contains publication files for the “${this._project?.title}” Open Readers Bibles project.`,
                homepage: this._project?.publicationUrl,
                private: false,
                is_template: true,
                auto_init: true
            }, this.config);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error creating repository: ${error.message}`);
            }
        }

        console.info(`Repository ${repo} created successfully.`);
    }


    public async addFilesToRepository(repo: string, files: GitHubFile[], branch: string = 'main'): Promise<AdHocPublicationResult> {
        try {
            // Step 1: Get the SHA of the base tree
            const { data: refData } = await axios.get(`https://api.github.com/repos/${this._owner}/${repo}/git/ref/heads/${branch}`, this.config);
            const baseTreeSha = refData.object.sha;

            // Step 2: Create blobs for each file
            const blobs = await Promise.all(files.map(async file => {
                console.info(`Adding file ${file.path} to repository ${repo}...`);
                const { data: blobData } = await axios.post(`https://api.github.com/repos/${this._owner}/${repo}/git/blobs`, {
                    content: Buffer.from(file.content).toString('base64'),
                    encoding: 'base64'
                }, this.config);
                return { path: file.path, sha: blobData.sha };
            }));

            // Step 3: Create a new tree with all blobs
            const { data: treeData } = await axios.post(`https://api.github.com/repos/${this._owner}/${repo}/git/trees`, {
                base_tree: baseTreeSha,
                tree: blobs.map(blob => ({
                    path: blob.path,
                    mode: '100644',
                    type: 'blob',
                    sha: blob.sha
                }))
            }, this.config);

            // Step 4: Create a new commit
            const { data: commitData } = await axios.post(`https://api.github.com/repos/${this._owner}/${repo}/git/commits`, {
                message: `Add multiple files`,
                tree: treeData.sha,
                parents: [baseTreeSha]
            }, this.config);

            // Step 5: Update the reference
            const result = await axios.patch(`https://api.github.com/repos/${this._owner}/${repo}/git/refs/heads/${branch}`, {
                sha: commitData.sha,
                force: true // Force update to handle conflicts
            }, this.config);

            console.log(`Files added successfully to repository ${repo}.`);

            return result.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 409) {
                    console.error(`Conflict error: ${error.message}. Please ensure you are working with the latest branch state.`);
                } else {
                    console.error(`Error adding files to repository: ${error.message}`);
                    console.trace();
                }
                console.error(`Stack trace: ${error.stack}`);
            }
            return Promise.reject(error);
        }
    }

    async getActionsForCommit(owner: string, repo: string, commitSha: string): Promise<AdHocWorkflowRunsResult> {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?head_sha=${commitSha}`;
            const response = await axios.get(url, this.config);

            if (response.status !== 200) {
                throw new Error(`Error fetching actions: ${response.statusText}`);
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error fetching actions: ${error.message}`);
            }
            return Promise.reject(error);
        }
    }

    async getRepositoryContents(owner: string, repo: string, branch: string, path: string = ''): Promise<{ type: string, name: string, path: string }[]> {
        try {

            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
            const response = await axios.get(url, this.config);

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error fetching repository contents: ${error.message}`);
            }
            return Promise.reject(error);
        }
    }

    async getLastModifiedDate(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
        try {

            const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&sha=${branch}&per_page=1`;
            const response = await axios.get(url, this.config);

            const commit = response.data[0];
            return commit.commit.committer.date;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error fetching last modified date: ${error.message}`);
            }
            return Promise.reject(error);
        }
    }

    async listFilesWithLastModifiedDate(owner: string, repo: string, branch: string, path: string = '', extension: string = ''): Promise<{ name: string, path: string, lastModifiedDate: string }[]> {
        try {
            const files = await this.getRepositoryContents(owner, repo, branch, path);
            const result = [];

            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith(extension)) {
                    const lastModifiedDate = await this.getLastModifiedDate(owner, repo, branch, file.path);
                    result.push({
                        name: file.name,
                        path: file.path,
                        lastModifiedDate
                    });
                }
            }

            return result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error listing files with last modified date: ${error.message}`);
            }
            return Promise.reject(error);
        }
    }
}
