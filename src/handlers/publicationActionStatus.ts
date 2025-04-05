import logger from "../logger";
import { SuccessValue, FailureValue } from "../ReturnValue";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { GitHubAdapter } from "../GitHubAdapter";

export async function publicationActionStatus(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        const repo = req.params.repo;
        const commit_sha = req.params.commit_sha;
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const result = await github.getActionsForCommit('openreadersbibles', repo, commit_sha);
        // console.info(req.params);
        // console.info(result);
        return res.json(SuccessValue(result));
    } catch (error) {
        logger.error(error);
        return res.status(500).json(FailureValue(error));
    }
}