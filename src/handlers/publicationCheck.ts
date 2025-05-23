import { Request } from 'express';
import { CheckResults } from "@models/database-input-output.js";
import { ConnectRunDisconnect } from "../GetDatabaseAdapter.js";
import { Publisher } from "../Publisher.js";
import { HollowPublicationRequest, HollowPublicationRequestSchema } from '@models/PublicationRequest.js';
import { NoParams } from '../params.js';
import { Failure } from '@models/ReturnValue.js';

export async function publicationCheck(req: Request<NoParams, CheckResults, HollowPublicationRequest>) {
    return await ConnectRunDisconnect(async (adapter) => {
        const parseResult = HollowPublicationRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            console.error("Invalid request data", parseResult.error.format());
            return Failure(400, `Invalid request data:  ${parseResult.error}`);
        }

        const publisher = await Publisher.createPublisher(adapter, parseResult.data);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();

        // if (checkForMissingGlossesResult.length > 0) {
        //     logger.info(`There were ${checkForMissingGlossesResult.length} missing glosses.`);
        //     if (checkForMissingGlossesResult.length <= 10) {
        //         return LambdaProxyValue(`There were ${checkForMissingGlossesResult.length} missing glosses. They are: ${checkForMissingGlossesResult.join(', ')}.`);
        //     } else {
        //         return LambdaProxyValue(`There were ${checkForMissingGlossesResult.length} missing glosses. The first ten are: ${checkForMissingGlossesResult.slice(0, 10).join(', ')}.`);
        //     }
        // }

        return checkForMissingGlossesResult;

    });
}