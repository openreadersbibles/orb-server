import express, { Request, Response } from 'express';
import cors from 'cors';
import { publicationCheck } from './handlers/publicationCheck.js';
import { authenticateAndThenCall } from './authenticateAndThenCall.js';
import { publicationActionStatus } from './handlers/publicationActionStatus.js';
import { publish } from './handlers/publish.js';
import { updateVerse } from './handlers/updateVerse.js';
import { seekVerse } from './handlers/seekVerse.js';
import { getUserData } from './handlers/getUserData.js';
import { getProjectIdExists } from './handlers/getProjectIdExists.js';
import { updateProject } from './handlers/updateProject.js';
import { updateUser } from './handlers/updateUser.js';
import { getUserIds } from './handlers/getUserIds.js';
import { projectDescriptions } from './handlers/projectDescriptions.js';
import { joinProject } from './handlers/joinProject.js';
import { removeUser } from './handlers/removeUser.js';
import { createProject } from './handlers/createProject.js';
import { removeProject } from './handlers/removeProject.js';
import { VerseReference } from '@models/VerseReference.js';
import { WrappedBody } from '@models/WrappedBody.js';
import { GlossIdParams, NoParams, ProjectIdParams, PublicationActionsParams, SeekVerseParams, StatsParams, UserIdParams, VerseParams } from './params.js';
import { VerseResponse } from '@models/Verse.js';
import { getVerseNT } from './handlers/getVerseNT.js';
import { getVerseOT } from './handlers/getVerseOT.js';
import { AdHocPublicationResult, AdHocWorkflowRunsResult, CheckResults } from '@models/database-input-output.js';
import { HollowPublicationRequest } from '@models/PublicationRequest.js';
import { VerseReferenceJson } from '@models/VerseReferenceJson.js';
import { UpdateVerseData } from '@models/UpdateVerseData.js';
import { removeGloss } from './handlers/removeGloss.js';
import { GlossSendObject } from '@models/GlossSendObject.js';
import { updateGloss } from './handlers/updateGloss.js';
import { removePhraseGloss } from './handlers/removePhraseGloss.js';
import { updatePhraseGloss } from './handlers/updatePhraseGloss.js';
import { ProjectConfigurationRow } from '@models/ProjectConfigurationRow.js';
import { ProjectDescription } from '@models/ProjectDescription.js';
import { UserProfileRow } from '@models/UserProfileRow.js';
import { UserUpdateObject } from '@models/UserUpdateObject.js';
import { StatsSummary } from '@models/StatsSummary.js';
import { getStats } from './handlers/getStats.js';

export const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use the CORS middleware
app.use(cors());

// Handle preflight requests
app.options('*', cors());

/* User endpoints */

app.get('/user/:user_id', async (req: Request<UserIdParams, UserProfileRow>, res: Response) => {
    await authenticateAndThenCall(req, res, getUserData);
});

app.put('/user/:user_id', async (req: Request<UserIdParams, boolean, WrappedBody<UserUpdateObject>>, res: Response) => {
    await authenticateAndThenCall(req, res, updateUser);
});

app.delete('/user/:user_id', async (req: Request<UserIdParams, boolean>, res: Response) => {
    await authenticateAndThenCall(req, res, removeUser);
});

app.get('/userids', async (req: Request<NoParams, string[]>, res: Response) => {
    await authenticateAndThenCall(req, res, getUserIds);
});

/* Project endpoints */

app.get('/projectExists/:project_id', async (req: Request<ProjectIdParams, boolean>, res: Response) => {
    await authenticateAndThenCall(req, res, getProjectIdExists);
});

app.put('/project/:project_id', async (req: Request<ProjectIdParams, boolean, WrappedBody<ProjectConfigurationRow>>, res: Response) => {
    await authenticateAndThenCall(req, res, updateProject);
});

app.delete('/project/:project_id', async (req: Request<ProjectIdParams, boolean>, res: Response) => {
    await authenticateAndThenCall(req, res, removeProject);
});

app.put('/project', async (req: Request<NoParams, boolean, WrappedBody<ProjectConfigurationRow>>, res: Response) => {
    await authenticateAndThenCall(req, res, createProject);
});

app.get('/projectdescriptions', async (req: Request<NoParams, ProjectDescription[]>, res: Response) => {
    await authenticateAndThenCall(req, res, projectDescriptions);
});

app.post('/joinproject/:project_id', async (req: Request<ProjectIdParams, boolean, WrappedBody<null>>, res: Response) => {
    await authenticateAndThenCall(req, res, joinProject);
});

/* Verse endpoints */

app.get('/verse/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity', async (req: Request<SeekVerseParams, VerseReferenceJson>, res: Response) => {
    await authenticateAndThenCall(req, res, seekVerse);
});

app.get('/verse/:project_id/:reference', async (req: Request<VerseParams, VerseResponse<unknown>>, res: Response) => {
    const reference = VerseReference.fromString(req.params.reference);
    if (!reference) {
        res.status(400).json(`Invalid verse reference: ${req.params.reference}`);
        return;
    }

    let handler;
    if (reference.canon === 'NT') {
        handler = getVerseNT;
    } else if (reference.canon === 'OT') {
        handler = getVerseOT;
    } else {
        res.status(400).json('Invalid testament specified.  Must be "nt" or "ot".');
        return;
    }
    await authenticateAndThenCall(req, res, handler);
});

app.post('/verse/:project_id/:reference', async (req: Request<VerseParams, boolean, WrappedBody<UpdateVerseData>>, res: Response) => {
    await authenticateAndThenCall(req, res, updateVerse);
});

/* Gloss endpoints */

app.put('/gloss', async (req: Request<GlossIdParams, boolean, WrappedBody<GlossSendObject>>, res: Response) => {
    await authenticateAndThenCall(req, res, updateGloss);
});

app.delete('/gloss/:gloss_id', async (req: Request<GlossIdParams, boolean>, res: Response) => {
    await authenticateAndThenCall(req, res, removeGloss);
});

/* Phrase Gloss endpoints */

app.put('/phrasegloss', async (req: Request<GlossIdParams, boolean, WrappedBody<GlossSendObject>>, res: Response) => {
    await authenticateAndThenCall(req, res, updatePhraseGloss);
});

app.delete('/phrasegloss/:gloss_id', async (req: Request<GlossIdParams, boolean>, res: Response) => {
    await authenticateAndThenCall(req, res, removePhraseGloss);
});

/* Publication endpoints */

app.post('/publish', async (req: Request<NoParams, AdHocPublicationResult, WrappedBody<HollowPublicationRequest>>, res: Response) => {
    await authenticateAndThenCall(req, res, publish);
});

/// POST is funny here, but it needs to be able to send a request body
app.post('/check', async (req: Request<NoParams, CheckResults, HollowPublicationRequest>, res: Response) => {
    await authenticateAndThenCall(req, res, publicationCheck);
});

app.get('/action_status/:repo/:commit_sha', async (req: Request<PublicationActionsParams, AdHocWorkflowRunsResult>, res: Response) => {
    await authenticateAndThenCall(req, res, publicationActionStatus);
});

/* Stats endpoints */

app.get('/stats/:project_id/:canon/:book', async (req: Request<StatsParams, StatsSummary>, res: Response) => {
    await authenticateAndThenCall(req, res, getStats);
});

app.get('/stats/:project_id/:canon', async (req: Request<StatsParams, StatsSummary>, res: Response) => {
    await authenticateAndThenCall(req, res, getStats);
});
