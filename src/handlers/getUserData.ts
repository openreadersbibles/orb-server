import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";

/// This function has a special behavior that, if the user is not found in the database
/// (and if the user_id) has been specified, then it will insert it into the database
/// and return the user object. 
export async function getUserData(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.getUserData(userInfo.username);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}