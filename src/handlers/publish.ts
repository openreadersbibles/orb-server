import logger from "../logger";
import { Request, Response } from 'express';
import { HollowPublicationRequest } from "../../../models/PublicationRequest";
import { createPublisher } from "../createPublisher";
import { HttpReturnValue } from "../../../models/ReturnValue";

export async function publish(req: Request, res: Response): Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>> {
    try {
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
    } catch (error) {
        // logger.info("Success", SuccessValue("success message"));
        // logger.info("Failure", FailureValue("failure message"));

        console.error(error);
        console.trace();

        logger.info("Catching error in publish handler");
        // Log the error stack trace if available
        if (error instanceof Error) {
            logger.error(`Error: ${error.message}`);
            logger.error(`Stack Trace: ${error.stack}`);
        } else {
            logger.error(`Error: ${JSON.stringify(error)}`);
        }
        if (error === undefined || error === null || error === "") {
            return res.status(500).send("Indistinct error.");
        } else {
            return res.status(500).json(error);
        }
    }
}