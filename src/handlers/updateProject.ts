import logger from "../logger";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter";
import { WrappedBody } from "../../../models/SavedPostRequest";
import { HttpReturnValue, returnValueConfig } from "../../../models/ReturnValue";
import { ProjectPackage } from "../../../models/database-input-output";

export async function updateProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const wrappedBody: WrappedBody = req.body;
        returnValueConfig.hash = wrappedBody.hash;
        const request = wrappedBody.body;
        return res.json(await ConnectRunDisconnect((adapter) => {
            return adapter.updateProject(userInfo.username, request as ProjectPackage);
        }));
    } catch (error) {
        logger.error(`Error in getVerse: ${error}`);
        return res.status(500).json({ error: `Internal server error: ${error}` });
    }
}