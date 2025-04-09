import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function removeProject(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    if (userInfo.username !== "orbadmin") {
        return res.status(403).json({ error: `User is not authorized to remove projects` });
    }
    const project_id = req.params.project_id;
    return res.json(await ConnectRunDisconnect((adapter) => {
        return adapter.removeProject(project_id);
    }));
}