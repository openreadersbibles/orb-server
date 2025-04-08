import logger from "../logger.js";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { WrappedBody } from '../../../models/SavedPostRequest.js';
import { HttpReturnValue, returnValueConfig } from '../../../models/ReturnValue.js';
import { UpdateVerseData } from "../../../models/database-input-output.js";

export async function updateVerse(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    const wrappedBody: WrappedBody = req.body;
    returnValueConfig.hash = wrappedBody.hash;
    const request = wrappedBody.body as UpdateVerseData;
    const user_id = userInfo.username;
    const project_id = req.params.project_id;
    const reference = req.params.reference;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.updateVerse(user_id, request, project_id, reference)
    }));
}