import logger from "../logger";
import { Request, Response } from 'express';
import { GitHubAdapter } from "../GitHubAdapter";
import { HttpReturnValue } from "../../../models/ReturnValue";

export async function publicationActionStatus(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const repo = req.params.repo;
        const commit_sha = req.params.commit_sha;
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const result = await github.getActionsForCommit('openreadersbibles', repo, commit_sha);
        // console.info(req.params);
        // console.info(result);
        return res.status(200).json(result);
    } catch (error) {
        logger.error(error);
        return res.status(500).json(error);
    }
}