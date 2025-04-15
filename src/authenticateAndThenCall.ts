import { CognitoUserInfoResponse } from '@models/TimedOauthCredentials.js';
import { Request, Response } from 'express';
import { ParamsDictionary } from "express-serve-static-core";
import { authenticate } from './authenticate.js';

export type ApiCallHandler<ParamType extends ParamsDictionary, ResultType, RequestType> =
    (req: Request<ParamType, ResultType, RequestType>,
        res: Response,
        userInfo: CognitoUserInfoResponse) => Promise<ResultType>;

export async function authenticateAndThenCall
    <ParamType extends ParamsDictionary, ResultType, RequestType>
    (req: Request<ParamType, ResultType, RequestType>,
        res: Response,
        next: ApiCallHandler<ParamType, ResultType, RequestType>) {
    const token = req.headers['authorization'] || "";
    if (!token) {
        return res.status(401).json('No authorization header');
    }

    try {
        const userInfo = await authenticate(token);

        /// here is where the function is actually called:
        try {
            const result = await next(req, res, userInfo);
            /// if I don't convert it to JSON myself, it produces JSON with single quotes (?)
            return res.json(JSON.stringify(result, null, 2));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            /// if a promise is rejected in the database adapter, it will throw an error
            /// and we need to catch it here, and pass the suggested return value back
            if (error?.statusCode && error?.body) {
                return res.status(error.statusCode).json(error.body);
            } else {
                /// this is an unhandled exception, and we need to log it and return a 500 error
                console.error(error);
                console.trace();
                return res.status(500).json(`Internal server error`);
            }
        }
    } catch {
        return res.status(401).json("Invalid token");
    }
};
