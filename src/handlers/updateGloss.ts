import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { GlossIdParams, GlossIdParamsSchema } from '../params.js';
import { Failure } from '@models/ReturnValue.js';
import { GlossSendObject, GlossSendObjectSchema } from '@models/GlossSendObject.js';
import { WrappedBody, WrappedBodySchema } from '@models/WrappedBody.js';

export async function updateGloss(req: Request<GlossIdParams, boolean, WrappedBody<GlossSendObject>>, res: Response, userInfo: CognitoUserInfoResponse) {
    const params = GlossIdParamsSchema.safeParse(req.params);
    if (params.success === false) {
        console.log(`Invalid parameters: ${params.error}`);
        return Failure(400, `Invalid parameters: ${params.error}`);
    }
    const wrappedBody = WrappedBodySchema.safeParse(req.body);
    if (wrappedBody.success === false) {
        console.log(`Invalid request body: ${wrappedBody.error}`);
        return Failure(400, `Invalid request body: ${wrappedBody.error}`);
    }
    const body = wrappedBody.data.body;
    const gso = GlossSendObjectSchema.safeParse(body);
    if (gso.success === false) {
        return Failure(400, `Invalid request body: ${gso.error}`);
    }

    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.updateGloss(userInfo.username, gso.data);
    });
}