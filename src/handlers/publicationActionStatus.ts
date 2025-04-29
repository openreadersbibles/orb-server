import { Request } from 'express';
import { GitHubAdapter } from "../GitHubAdapter.js";
import { AdHocWorkflowRunsResult } from '@models/database-input-output.js';
import { PublicationActionsParams } from '../params.js';

export async function publicationActionStatus(req: Request<PublicationActionsParams, AdHocWorkflowRunsResult>) {
    const repo = req.params.repo;
    const commit_sha = req.params.commit_sha;
    const github = new GitHubAdapter();
    const result = await github.getActionsForCommit('openreadersbibles', repo, commit_sha);
    // console.info(req.params);
    // console.info(result);
    return result;
}