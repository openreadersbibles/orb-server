import logger from "../logger";
import { SuccessValue, FailureValue } from "../ReturnValue";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { GitHubAdapter } from "../GitHubAdapter";
import { ProjectConfiguration } from "../../../models/ProjectConfiguration";

export async function publicationContents(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        const project_id = req.params.project_id;
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const repo = ProjectConfiguration.getRepositoryName(project_id);
        const result = await github.listFilesWithLastModifiedDate('openreadersbibles', repo, 'gh-pages', '', '.pdf');
        return res.json(SuccessValue(result));
    } catch (error) {
        logger.error(error);
        return res.status(500).json(FailureValue(error));
    }
}