import { Request } from 'express';
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { VerseReference } from "@models/VerseReference.js";
import { SeekVerseParams } from "../params.js";
import { Failure } from '@models/ReturnValue.js';
import { VerseReferenceJson } from '@models/VerseReferenceJson.js';

export async function seekVerse(req: Request<SeekVerseParams, VerseReferenceJson>) {
    const reference = VerseReference.fromString(req.params.startingPosition);
    if (!reference) {
        return Failure(400, `Invalid verse reference: ${req.params.startingPosition}`);
    }
    return await ConnectRunDisconnect<VerseReferenceJson>(async (adapter) => {
        const ref = await adapter.seekVerse(req.params.project_id,
            req.params.user_id,
            Number.parseInt(req.params.frequency_threshold),
            reference,
            req.params.direction as "before" | "after", /// TODO not great to assume this
            req.params.exclusivity as "me" | "anyone"); /// TODO not great to assume this
        return ref.toJson();
    });
}