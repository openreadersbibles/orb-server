import { COGNITO } from '../cognito.js';
import axios from 'axios';
import { CognitoUserInfoResponse } from '../../models/TimedOauthCredentials.js';
import { Request, Response } from 'express';
import { HttpReturnValue } from '../../models/ReturnValue.js';

export type ApiCallHandler = (req: Request, res: Response, userInfo: CognitoUserInfoResponse) => Promise<Response<HttpReturnValue, Record<string, HttpReturnValue>>>;

export const authenticateAndThenCall = async (req: Request, res: Response, next: ApiCallHandler) => {
    const token = req.headers['authorization'] || "";
    if (!token) {
        return res.status(401).send('No authorization header');
    }

    try {
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await axios.get(`${COGNITO.auth_url}/oauth2/userInfo`, { headers });
        if (response.data.error && response.data.error === 'invalid_token') {
            console.error(response.data);
            throw new Error('Invalid token');
        } else if (response.data.error) {
            throw new Error(response.data.error);
        }
        const userInfo = response.data as CognitoUserInfoResponse;
        /// here is where the function is actually called:
        next(req, res, userInfo);
    } catch {
        return res.status(401).send('Invalid token');
    }
};
