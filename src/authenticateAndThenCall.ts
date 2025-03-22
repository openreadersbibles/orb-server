import { COGNITO } from '../cognito';
import axios from 'axios';
import { CognitoUserInfoResponse } from '../../models/TimedOauthCredentials';
import { Request, Response } from 'express';
import { FailureValue } from './ReturnValue';

export type ApiCallHandler = (req: Request, res: Response, userInfo: CognitoUserInfoResponse) => Promise<Response<any, Record<string, any>>>;

export const authenticateAndThenCall = async (req: Request, res: Response, next: ApiCallHandler) => {
    const token = req.headers['authorization'];
    if (!token) {
        console.error(req.headers);
        return res.status(401).json(FailureValue({ error: 'No authorization header' }));
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
        next(req, res, userInfo);
    } catch (error) {
        return res.status(401).json(FailureValue({ error: 'Invalid token' }));
    }
};
