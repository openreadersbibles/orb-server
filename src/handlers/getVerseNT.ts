import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { GreekWordRow } from '../../../models/GreekWordRow.js';
import { VerseResponse } from '../../../models/Verse.js';
import { VerseParams } from '../params.js';
import { VerseReference } from '../../../models/VerseReference.js';
import { Failure } from '../../../models/ReturnValue.js';

export async function getVerseNT(req: Request<VerseParams, VerseResponse<GreekWordRow>>, res: Response) {
    const user_id = req.params.user_id;
    const project_id = req.params.project_id;

    const reference = VerseReference.fromString(req.params.reference);
    if (!reference) {
        return Failure(400, `Invalid verse reference: ${req.params.reference}`);
    }
    if (reference.canon != 'NT') {
        return Failure(400, `Invalid verse reference: ${req.params.reference}`);
    }

    return await ConnectRunDisconnect((adapter) => {
        return adapter.getNTVerse(project_id, user_id, reference);
    });
}