import * as fs from 'fs';
import * as path from 'path';

export class GitHubActionYML {
    static filename = 'github-actions.yml';
    static ymlFilePath = '.github/workflows/' + this.filename;

    static async createYMLFile(texFilenames: string[]): Promise<string> {
        const filePath = path.join(__dirname, this.filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = texFilenames.join("\n            ");
        const newContent = fileContent.replace(/__FILES_GO_HERE__/g, lines);
        return newContent;
    }

}