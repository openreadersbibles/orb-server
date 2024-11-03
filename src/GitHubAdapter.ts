import axios from 'axios';

export interface GitHubFile { path: string, content: any };

export class GitHubAdapter {
    private _secret: string;
    private _owner: string = "openreadersbibles";
    private config: any;

    constructor(secret: string) {
        this._secret = secret;
        this._owner = "openreadersbibles";
        this.config = {
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${process.env['GITHUB_SECRET']}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };
    }

    async createRepositoryIfNotExists(repo: string) {
        console.log(`Checking if repository ${repo} exists...`);
        try {
            const response = await axios.get(`https://api.github.com/repos/${this._owner}/${repo}`, this.config);
            // console.log(response.data);
        } catch (error: any) {
            if (error.status === 404) {
                await this.createRepository(repo);
            } else {
                // Handle other errors
                console.error(`Error checking repository existence: ${error.message}`);
            }
        }
    }

    private async createRepository(repo: string) {
        try {
            const response = await axios.post('https://api.github.com/user/repos', {
                name: repo,
                description: "This repository has been created by the Open Readers Bibles project.",
                homepage: "https://openreadersbibles.org/",
                private: false,
                is_template: true,
                auto_init: true
            }, this.config);
        } catch (error: any) {
            console.error(`Error creating repository: ${error.message}`);
        }

        console.log(`Repository ${repo} created successfully.`);
    }


    public async addFilesToRepository(repo: string, files: GitHubFile[], branch: string = 'main'): Promise<any> {
        try {
            // Step 1: Get the SHA of the base tree
            const { data: refData } = await axios.get(`https://api.github.com/repos/${this._owner}/${repo}/git/ref/heads/${branch}`, this.config);
            const baseTreeSha = refData.object.sha;

            // console.log(baseTreeSha);

            // Step 2: Create blobs for each file
            const blobs = await Promise.all(files.map(async file => {
                console.log(`Adding file ${file.path} to repository ${repo}...`);
                const { data: blobData } = await axios.post(`https://api.github.com/repos/${this._owner}/${repo}/git/blobs`, {
                    content: Buffer.from(file.content).toString('base64'),
                    encoding: 'base64'
                }, this.config);
                return { path: file.path, sha: blobData.sha };
            }));

            console.log(blobs);

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
            return await axios.patch(`https://api.github.com/repos/${this._owner}/${repo}/git/refs/heads/${branch}`, {
                sha: commitData.sha,
                force: true // Force update to handle conflicts
            }, this.config);

            // console.log(`Files added to repository ${repo} successfully.`);
        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                console.error(`Conflict error: ${error.message}. Please ensure you are working with the latest branch state.`);
            } else {
                console.error(`Error adding files to repository: ${error.message}`);
            }
            console.error(`Stack trace: ${error.stack}`);
            return Promise.reject(error);
        }
    }

    async getActionsForCommit(owner: string, repo: string, commitSha: string) {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?head_sha=${commitSha}`;
            console.log(url);
            const response = await axios.get(url, this.config);

            if (response.status !== 200) {
                throw new Error(`Error fetching actions: ${response.statusText}`);
            }

            return response.data;
        } catch (error: any) {
            console.error(`Error fetching actions: ${error.message}`);
            return Promise.reject(error);
        }
    }

    async getRepositoryContents(owner: string, repo: string, branch: string, path: string = ''): Promise<any[]> {
        try {

            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
            const response = await axios.get(url, this.config);

            return response.data;
        } catch (error: any) {
            console.error(`Error fetching repository contents: ${error.message}`);
            return Promise.reject(error);
        }
    }

    async getLastModifiedDate(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
        try {

            const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&sha=${branch}&per_page=1`;
            const response = await axios.get(url, this.config);

            const commit = response.data[0];
            return commit.commit.committer.date;
        } catch (error: any) {
            console.error(`Error fetching last modified date: ${error.message}`);
            return Promise.reject(error);
        }
    }

    async listFilesWithLastModifiedDate(owner: string, repo: string, branch: string, path: string = '', extension: string = ''): Promise<any[]> {
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
        } catch (error: any) {
            console.error(`Error listing files with last modified date: ${error.message}`);
            return Promise.reject(error);
        }
    }
}
