import logger from "../logger.js";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "../../../models/SavedPostRequest.js";
import { HttpReturnValue, returnValueConfig } from "../../../models/ReturnValue.js";
import { ProjectPackage } from "../../../models/database-input-output.js";

export async function updateProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const wrappedBody: WrappedBody = req.body;
    returnValueConfig.hash = wrappedBody.hash;
    const request = wrappedBody.body;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.updateProject(userInfo.username, request as ProjectPackage);
    }));
}