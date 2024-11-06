import { HollowPublicationRequest } from "../../../models/PublicationRequest";
import { createPublisher } from "../createPublisher";
import logger from "../logger";
import { SuccessValue, FailureValue } from "../ReturnValue";
import { Request, Response } from 'express';
import { CognitoUserInfoResponse } from '../../../models/TimedOauthCredentials';

export async function publicationCheck(req: Request, res: Response, userInfo: CognitoUserInfoResponse): Promise<Response<any, Record<string, any>>> {
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
        return res.json(SuccessValue(checkForMissingGlossesResult));
    } catch (error) {
        logger.error(error);
        return res.status(500).json(FailureValue(error));
    }
}