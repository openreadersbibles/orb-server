import { Request } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { VerseReference, VerseReferenceString } from "@models/VerseReference.js";
import { SeekVerseParams } from "../params.js";
import { Failure } from '@models/ReturnValue.js';

export async function seekVerse(req: Request<SeekVerseParams, VerseReferenceString>) {
    const reference = VerseReference.fromString(req.params.startingPosition);
    if (!reference) {
        return Failure(400, `Invalid verse reference: ${req.params.startingPosition}`);
    }
    return await ConnectRunDisconnect(async (adapter) => {
        const ref = await adapter.seekVerse(req.params.project_id,
            req.params.user_id,
            Number.parseInt(req.params.frequency_threshold),
            reference,
            req.params.direction as "before" | "after", /// TODO not great to assume this
            req.params.exclusivity as "me" | "anyone"); /// TODO not great to assume this
        return ref.toString();
    });
}