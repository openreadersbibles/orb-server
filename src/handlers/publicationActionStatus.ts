import { Request, Response } from 'express';
import { GitHubAdapter } from "../GitHubAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function publicationActionStatus(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const repo = req.params.repo;
    const commit_sha = req.params.commit_sha;
    const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
    const result = await github.getActionsForCommit('openreadersbibles', repo, commit_sha);
    // console.info(req.params);
    // console.info(result);
    return res.status(200).json(result);
}