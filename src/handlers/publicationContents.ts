import logger from "../logger";
import { Request, Response } from 'express';
import { GitHubAdapter } from "../GitHubAdapter";
import { ProjectConfiguration } from "../../../models/ProjectConfiguration";
import { HttpReturnValue } from "../../../models/ReturnValue";

export async function publicationContents(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const project_id = req.params.project_id;
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const repo = ProjectConfiguration.getRepositoryName(project_id);
        const result = await github.listFilesWithLastModifiedDate('openreadersbibles', repo, 'gh-pages', '', '.pdf');
        /// 2025-04-07: I haven't test this yet, and I'm not confident.
        return res.status(200).json(result);
    } catch (error) {
        logger.error(error);
        return res.status(500).json(error);
    }
}