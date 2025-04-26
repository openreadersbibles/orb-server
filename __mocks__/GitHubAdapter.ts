/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class GitHubAdapter {
    private _secret: string;
    private _owner: string = "openreadersbibles";

    constructor(secret: string, project?: any) {
        this._secret = secret;
    }

    async setupRepository(repo: string): Promise<void> {
        console.log(`Mock: Setting up repository ${repo}`);
    }

    async createGitHubPages(repo: string): Promise<void> {
        console.log(`Mock: Creating GitHub Pages for repository ${repo}`);
    }

    async repositoryExists(repo: string): Promise<boolean> {
        console.log(`Mock: Checking if repository ${repo} exists`);
        return true; // Simulate that the repository exists
    }

    async isPagesEnabled(repo: string): Promise<boolean> {
        console.log(`Mock: Checking if GitHub Pages is enabled for repository ${repo}`);
        return true; // Simulate that GitHub Pages is enabled
    }

    async createRepository(repo: string): Promise<void> {
        console.log(`Mock: Creating repository ${repo}`);
    }

    async addFilesToRepository(repo: string, files: any[], branch: string = 'main'): Promise<any> {
        console.log(`Mock: Adding files to repository ${repo} on branch ${branch}`);
        return { success: true }; // Simulate a successful operation
    }

    async getActionsForCommit(owner: string, repo: string, commitSha: string): Promise<any> {
        console.log(`Mock: Fetching actions for commit ${commitSha} in repository ${repo}`);
        return { runs: [] }; // Simulate no actions found
    }

    async getRepositoryContents(owner: string, repo: string, branch: string, path: string = ''): Promise<any[]> {
        console.log(`Mock: Fetching repository contents for ${repo} on branch ${branch}`);
        return [
            { type: 'file', name: 'file1.txt', path: `${path}/file1.txt` },
            { type: 'file', name: 'file2.txt', path: `${path}/file2.txt` },
        ]; // Simulate some files in the repository
    }

    async getLastModifiedDate(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
        console.log(`Mock: Fetching last modified date for ${filePath} in repository ${repo}`);
        return new Date().toISOString(); // Simulate the current date as the last modified date
    }

    async listFilesWithLastModifiedDate(owner: string, repo: string, branch: string, path: string = '', extension: string = ''): Promise<any[]> {
        console.log(`Mock: Listing files with last modified date for ${repo} on branch ${branch}`);
        return [
            { name: `file1${extension}`, path: `${path}/file1${extension}`, lastModifiedDate: new Date().toISOString() },
            { name: `file2${extension}`, path: `${path}/file2${extension}`, lastModifiedDate: new Date().toISOString() },
        ]; // Simulate some files with last modified dates
    }
}