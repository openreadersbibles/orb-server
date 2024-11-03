// import express from 'express';
// import { Request, Response } from 'express-serve-static-core';
import express, { Request, Response } from 'express';
import { GitHubAdapter } from './GitHubAdapter';
import { ProjectConfiguration } from '../../models/ProjectConfiguration';
import { FailureValue, SuccessValue } from './ReturnValue';

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
        console.log(result);
        return res.json(SuccessValue(result));
    } catch (error) {
        console.error(error);
        return res.status(500).json(FailureValue(error));
    }
});

// Define a route to add a new user
app.post('/users', async (req: Request<{}, {}, PostRequestBody>, res: Response) => {
    // let conn;
    try {
        console.log(req.body);
        res.status(201).send('User added successfully');
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Error adding user');
    } finally {
        // if (conn) conn.release();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});