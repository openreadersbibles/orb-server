import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";
import { WrappedBody } from '../../../models/SavedPostRequest';
import { returnValueConfig } from '../../../models/ReturnValue';

export async function updateVerse(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        const wrappedBody: WrappedBody = req.body;
        returnValueConfig.hash = wrappedBody.hash;
        const request = wrappedBody.body;
        const user_id = userInfo.username;
        const project_id = req.params.project_id;
        const reference = req.params.reference;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.updateVerse(user_id, request, project_id, reference)
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}