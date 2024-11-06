import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";

export async function projectDescriptions(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.getProjectDescriptions();
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}