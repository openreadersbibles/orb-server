import logger from "../logger.js";
import { Request, Response } from 'express';
import { HollowPublicationRequest } from "../../../models/PublicationRequest.js";
import { createPublisher } from "../createPublisher.js";
import { HttpReturnValue } from "../../../models/ReturnValue.js";

export async function publish(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    // logger.info(req);
    if (req.body === undefined || req.body === null || req.body === "") {
        return res.status(400).send("No request body was provided.");
    }

    const request = req.body as HollowPublicationRequest;

    const publisher = await createPublisher(request);

    /// Check to see if any glosses are missing from the specified book
    const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
    Object.keys(checkForMissingGlossesResult).forEach(key => {
        if (checkForMissingGlossesResult[key].length > 0) {
            logger.info(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')}`);
            return res.status(400).send(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')} See the check endpoint for more information.`);
        }
    });

    /// TODO: Check for glosses that are tied for votes
    /// At this point we know that the book is ready

    const result = await publisher.publish();

    /// Disconnect from the database
    await publisher.disconnect();

    /// Return the result
    return res.status(200).json("Success!");
}