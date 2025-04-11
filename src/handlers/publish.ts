import logger from "../logger.js";
import { Request, Response } from 'express';
import { HollowPublicationRequest } from "../../../models/PublicationRequest.js";
import { AdHocPublicationResult } from "../../../models/database-input-output.js";
import { WrappedBody } from "../../../models/SavedPostRequest.js";
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { Publisher } from "../Publisher.js";
import { NoParams } from "../params.js";
import { Failure } from "../../../models/ReturnValue.js";

export async function publish(req: Request<NoParams, AdHocPublicationResult, WrappedBody<HollowPublicationRequest>>, res: Response) {
    return await ConnectRunDisconnect(async (adapter) => {
        const publisher = await Publisher.createPublisher(adapter, req.body.body);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
        Object.keys(checkForMissingGlossesResult).forEach(key => {
            if (checkForMissingGlossesResult[key].length > 0) {
                logger.info(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')}`);
                return Failure(400, `Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')} See the check endpoint for more information.`);
            }
        });

        /// TODO: Check for glosses that are tied for votes
        /// At this point we know that the book is ready

        return await publisher.publish();
    });
}