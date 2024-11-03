// import express from 'express';
// import { Request, Response } from 'express-serve-static-core';
import express, { Request, Response } from 'express';
import { GitHubAdapter } from './GitHubAdapter';
import { ProjectConfiguration } from '../../models/ProjectConfiguration';
import { FailureValue, SuccessValue } from './ReturnValue';
import { createPublisher } from './createPublisher';
import { HollowPublicationRequest } from '../../models/PublicationRequest';
import logger from './logger';

const app = express();
const port = 3000; // HTTPS port

// Middleware to parse JSON bodies
app.use(express.json());

// Define an interface for the request body
interface PostRequestBody {
    title: string;
    content: string;
}

app.get('/publication_contents/:project_id', async (req: any, res: any) => {
    try {
        const project_id = decodeURIComponent(req.params.project_id);
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const repo = ProjectConfiguration.getRepositoryName(project_id);
        const result = await github.listFilesWithLastModifiedDate('openreadersbibles', repo, 'gh-pages', '', '.pdf');
        logger.info(result);
        return res.json(SuccessValue(result));
    } catch (error) {
        logger.error(error);
        return res.status(500).json(FailureValue(error));
    }
});


app.post('/publish', async (req: any, res: any) => {
    try {
        logger.info(req);
        if (req.body === undefined || req.body === null || req.body === "") {
            return FailureValue("No request body was provided.");
        }

        const request = req.body as HollowPublicationRequest;
        logger.info(request);

        const publisher = await createPublisher(request);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
        Object.keys(checkForMissingGlossesResult).forEach(key => {
            if (checkForMissingGlossesResult[key].length > 0) {
                logger.info(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')}`);
                return FailureValue(`Missing glosses for ${key}: ${checkForMissingGlossesResult[key].join(', ')} See the check endpoint for more information.`);
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
});


app.post('/check', async (req: any, res: any) => {
    try {
        const request = req.body as HollowPublicationRequest;
        logger.info(JSON.stringify(request, null, 2));

        const publisher = await createPublisher(request);

        /// Check to see if any glosses are missing from the specified book
        const checkForMissingGlossesResult = await publisher.checkAllFilesForMissingGlosses();
        logger.info(checkForMissingGlossesResult);
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
});


app.get('/action_status/:repo/:commit_sha', async (req: any, res: any) => {
    try {
        const repo = decodeURIComponent(req.pathParameters.repo);
        const commit_sha = decodeURIComponent(req.pathParameters.commit_sha);
        const github = new GitHubAdapter(process.env['GITHUB_SECRET'] || '');
        const result = await github.getActionsForCommit('openreadersbibles', repo, commit_sha);
        logger.info(result);
        return res.json(SuccessValue(result));
    } catch (error) {
        logger.error(error);
        return res.status(500).json(FailureValue(error));
    }
});



// Start the server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});