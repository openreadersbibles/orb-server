import express, { Request, Response } from 'express';
import cors from 'cors';
import { publicationCheck } from './handlers/publicationCheck.js';
import { authenticateAndThenCall } from './authenticateAndThenCall.js';
import { publicationActionStatus } from './handlers/publicationActionStatus.js';
import { publish } from './handlers/publish.js';
import { getVerse } from './handlers/getVerse.js';
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

export const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Use the CORS middleware
app.use(cors());

// Handle preflight requests
app.options('*', cors());

/* User endpoints */

app.get('/user/:user_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, getUserData);
});

app.put('/user/:user_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateUser);
});

app.delete('/user/:user_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, removeUser);
});

app.get('/userids', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, getUserIds);
});



app.get('/getverse/:user_id/:project_id/:reference', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, getVerse);
});

app.post('/updateverse/:user_id/:project_id/:reference', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateVerse);
});

app.get('/seekVerse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, seekVerse);
});

app.get('/projectExists/:project_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, getProjectIdExists);
});

app.post('/updateproject', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateProject);
});

app.get('/projectdescriptions', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, projectDescriptions);
});

app.post('/joinproject/:project_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, joinProject);
});

app.post('/publish', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, publish);
});

app.post('/check', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, publicationCheck);
});

app.get('/action_status/:repo/:commit_sha', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, publicationActionStatus);
});
