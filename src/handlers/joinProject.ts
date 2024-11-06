import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";
import { WrappedBody } from '../../../models/SavedPostRequest';
import { returnValueConfig } from '../../../models/ReturnValue';

export async function joinProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
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