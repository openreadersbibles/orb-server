import logger from "../logger";
import { SuccessValue, FailureValue } from "../ReturnValue";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';
import { HollowPublicationRequest } from "../../../models/PublicationRequest";
import { createPublisher } from "../createPublisher";

export async function publish(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
    try {
        logger.info(req);
        if (req.body === undefined || req.body === null || req.body === "") {
            return res.json(FailureValue("No request body was provided."));
        }

        const request = req.body as HollowPublicationRequest;
        logger.info(request);

        const publisher = await createPublisher(request);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
        Object.keys(checkForMissingGlossesResult).forEach(key => {
            if (checkForMissingGlossesResult[key].length > 0) {
                logger.info(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')}`);
                return res.json(FailureValue(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')} See the check endpoint for more information.`));
            }
        });

        /// TODO: Check for glosses that are tied for votes
        /// At this point we know that the book is ready

        const result = await publisher.publish();
        logger.info(result.data);

        /// Disconnect from the database
        await publisher.disconnect();

        /// Return the result
        return res.json(SuccessValue(result.data));
    } catch (error) {
        // logger.info("Success", SuccessValue("success message"));
        // logger.info("Failure", FailureValue("failure message"));

        logger.info("Catching error in publish handler");
        logger.error(error);
        if (error === undefined || error === null || error === "") {
            return res.status(500).json(FailureValue("Indistinct error."));
        } else {
            return res.status(500).json(FailureValue(error));
        }
    }
}