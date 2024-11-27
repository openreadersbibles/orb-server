import express, { Request, Response } from 'express';
import cors from 'cors';
import logger from './logger';
import { publicationCheck } from './handlers/publicationCheck';
import { authenticateAndThenCall } from './authenticateAndThenCall';
import { publicationActionStatus } from './handlers/publicationActionStatus';
import { publish } from './handlers/publish';
import { publicationContents } from './handlers/publicationContents';
import { getVerse } from './handlers/getVerse';
import { updateVerse } from './handlers/updateVerse';
import { seekVerse } from './handlers/seekVerse';
import { getUserData } from './handlers/getUserData';
import { getProjectIdExists } from './handlers/getProjectIdExists';
import { updateProject } from './handlers/updateProject';
import { updateUser } from './handlers/updateUser';
import { getUserIds } from './handlers/getUserIds';
import { projectDescriptions } from './handlers/projectDescriptions';
import { joinProject } from './handlers/joinProject';

const app = express();
const port = process.env.API_PORT || 3000; // HTTPS port

// Middleware to parse JSON bodies
app.use(express.json());

// Use the CORS middleware
app.use(cors());

// Handle preflight requests
app.options('*', cors());

app.get('/getverse/:user_id/:project_id/:reference', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, getVerse);
});

app.post('/updateverse/:user_id/:project_id/:reference', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateVerse);
});

app.get('/seekVerse/:user_id/:project_id/:frequency_threshold/:startingPosition/:direction/:exclusivity', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, seekVerse);
});

app.get('/user/:user_id', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, getUserData);
});

app.get('/projectExists/:project_id', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, getProjectIdExists);
});

app.post('/updateproject', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateProject);
});

app.post('/updateuser', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, updateUser);
});

app.get('/userids', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, getUserIds);
});

app.get('/projectdescriptions', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, projectDescriptions);
});

app.post('/joinproject/:project_id', async (req: Request, res: Response) => {
    await authenticateAndThenCall(req, res, joinProject);
});

app.get('/publication_contents/:project_id', async (req: any, res: any) => {
    await authenticateAndThenCall(req, res, publicationContents);
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

// Start the server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});