import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";

export async function getVerse(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        const user_id = req.params.user_id;
        const project_id = req.params.project_id;
        const reference = req.params.reference;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.getVerse(project_id, user_id, reference);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}