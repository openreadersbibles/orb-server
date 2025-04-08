import logger from "../logger.js";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from '../../../models/SavedPostRequest.js';
import { HttpReturnValue, returnValueConfig } from '../../../models/ReturnValue.js';

export async function joinProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const wrappedBody: WrappedBody = req.body;
        returnValueConfig.hash = wrappedBody.hash;

        const project_id = req.params.project_id;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.joinProject(userInfo.username, project_id);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}