import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from "../../../models/SavedPostRequest.js";
import { HttpReturnValue, returnValueConfig } from "../../../models/ReturnValue.js";
import { ProjectConfigurationRow } from "../../../models/ProjectConfiguration.js";

export async function createProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const wrappedBody: WrappedBody = req.body;
    returnValueConfig.hash = wrappedBody.hash;
    const request = wrappedBody.body;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.createProject(userInfo.username, request as ProjectConfigurationRow);
    }));
}