import { COGNITO } from '../cognito.js';
import axios from 'axios';
import { CognitoUserInfoResponse } from '../../models/TimedOauthCredentials.js';
import { Request, Response } from 'express';
import { HttpReturnValue } from '../../models/ReturnValue.js';
import logger from './logger.js';

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
            return res.status(401).send('Invalid token');
        } else if (response.data.error) {
            throw new Error(response.data.error);
        }
        const userInfo = response.data as CognitoUserInfoResponse;
        /// here is where the function is actually called:
        try {
            return await next(req, res, userInfo);
        } catch (error: any) {
            /// if a promise is rejected in the database adapter, it will throw an error
            /// and we need to catch it here, and pass the return value back
            if (error.statusCode && error.body) {
                return res.status(error.statusCode).json({ error: error.body });
            } else {
                /// this is an unhandled exception, and we need to log it and return a 500 error
                logger.error(`Error in authenticateAndThenCall: ${error}`);
                return res.status(500).json({ error: `Internal server error: ${error}` });
            }
        }
    } catch {
        return res.status(401).send('Invalid token');
    }
};
