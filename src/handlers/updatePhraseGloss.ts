import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { GlossIdParams } from '../params.js';
import { Failure } from '@models/ReturnValue.js';
import { GlossSendObject, GlossSendObjectSchema } from '@models/GlossSendObject.js';
import { WrappedBody, WrappedBodySchema } from '@models/WrappedBody.js';
import { AnnotationJsonObjectSchema } from '@models/AnnotationJsonObject.js';

export async function updatePhraseGloss(req: Request<GlossIdParams, boolean, WrappedBody<GlossSendObject>>, res: Response, userInfo: CognitoUserInfoResponse) {
    const wrappedBody = WrappedBodySchema.safeParse(req.body);
    if (wrappedBody.success === false) {
        const msg = `Invalid request body: ${wrappedBody.error}`;
        console.error(msg);
        return Failure(400, msg);
    }
    const body = wrappedBody.data.body;
    const gso = GlossSendObjectSchema.safeParse(body);
    if (gso.success === false) {
        const msg = `Invalid request body: ${gso.error}`;
        console.error(msg);
        return Failure(400, msg);
    }
    /// this is a check of the logical constraint that a phrasal
    /// gloss always has to be a markdown gloss.
    const a = AnnotationJsonObjectSchema.safeParse(gso.data.annotationObject);
    if (a.success === false) {
        console.error(gso.data.annotationObject);
        const msg = `Invalid request body: ${a.error}`;
        console.error(msg);
        return Failure(400, msg);
    }

    return await ConnectRunDisconnect<boolean>((adapter) => {
        return adapter.updatePhraseGloss(userInfo.username, gso.data);
    });
}