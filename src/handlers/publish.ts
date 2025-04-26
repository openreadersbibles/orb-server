import { Request } from 'express';
import { HollowPublicationRequest, HollowPublicationRequestSchema } from "@models/PublicationRequest.js";
import { AdHocPublicationResult } from "@models/database-input-output.js";
import { WrappedBody, WrappedBodySchema } from "@models/WrappedBody.js";
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { Publisher } from "../Publisher.js";
import { NoParams } from "../params.js";
import { Failure } from "@models/ReturnValue.js";

export async function publish(req: Request<NoParams, AdHocPublicationResult, WrappedBody<HollowPublicationRequest>>) {
    return await ConnectRunDisconnect(async (adapter) => {
        const wrappedBody = WrappedBodySchema.safeParse(req.body);
        if (wrappedBody.success === false) {
            // console.error(`Invalid request body: ${wrappedBody.error}`);
            // console.error("Request body", req.body);
            return Failure(400, `Invalid request body: ${wrappedBody.error}`);
        }
        const body = wrappedBody.data.body;
        const parseResult = HollowPublicationRequestSchema.safeParse(body);
        if (!parseResult.success) {
            // console.error("Invalid request data", parseResult.error);
            // console.error("Request body", req.body);
            return Failure(400, `Invalid request data:  ${parseResult.error}`);
        }

        const publisher = await Publisher.createPublisher(adapter, req.body.body);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
        for (const key in checkForMissingGlossesResult) {
            if (checkForMissingGlossesResult[key].length > 0) {
                // logger.info(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')}`);
                return Failure(400, `Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')} See the check endpoint for more information.`);
            }
        }

        /// TODO: Check for glosses that are tied for votes
        /// At this point we know that the book is ready

        return await publisher.publish();

    });
}