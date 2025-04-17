import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { GlossIdParams, GlossIdParamsSchema } from '../params.js';
import { Failure } from '@models/ReturnValue.js';

export async function removeGloss(req: Request<GlossIdParams, boolean>, res: Response, userInfo: CognitoUserInfoResponse) {
    const params = GlossIdParamsSchema.safeParse(req.params);
    if (params.success === false) {
        return Failure(400, `Invalid parameters: ${params.error}`);
    }
    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.deleteGloss(userInfo.username, params.data.gloss_id);
    });
}