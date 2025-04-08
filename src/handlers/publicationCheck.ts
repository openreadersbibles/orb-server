import { HollowPublicationRequest } from "../../../models/PublicationRequest.js";
import { createPublisher } from "../createPublisher.js";
import logger from "../logger.js";
import { Request, Response } from 'express';
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function publicationCheck(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
        const request = req.body as HollowPublicationRequest;

        const publisher = await createPublisher(request);

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

        /// Disconnect from the database
        await publisher.disconnect();

        /// Return the result
        return res.status(200).json(checkForMissingGlossesResult);
    } catch (error) {
        logger.error(error);
        return res.status(500).json(error);
    }
}