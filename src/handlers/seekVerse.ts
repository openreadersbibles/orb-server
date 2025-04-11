import { Request, Response } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { VerseReference, VerseReferenceString } from "../../../models/VerseReference.js";
import { SeekVerseParams } from "../params.js";
import { Failure } from '../../../models/ReturnValue.js';

export async function seekVerse(req: Request<SeekVerseParams, VerseReferenceString>, res: Response) {
    const reference = VerseReference.fromString(req.params.startingPosition);
    if (!reference) {
        return Failure(400, `Invalid verse reference: ${req.params.startingPosition}`);
    }
    return await ConnectRunDisconnect(async (adapter) => {
        let ref = await adapter.seekVerse(req.params.project_id,
            req.params.user_id,
            Number.parseInt(req.params.frequency_threshold),
            reference,
            req.params.direction,
            req.params.exclusivity);
        return ref.toString();
    });
}