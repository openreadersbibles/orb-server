export interface HttpReturnValue {
    statusCode: number;
    body: string;
    headers?: any;
}

interface ReturnValue {
    operation_status: 'success' | 'failure';
    payload: any;
}

function Value(status: 'success' | 'failure', payload: any): HttpReturnValue {
    let statusCode = status === 'success' ? 200 : 500;
    return {
        statusCode: statusCode,
        body: JSON.stringify({
            operation_status: status,
            payload: payload
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        }
    }
}

export function SuccessValue(payload: any): HttpReturnValue {
    return Value('success', payload);
}

export function FailureValue(payload: any): HttpReturnValue {
    return Value('failure', payload);
}


export function LambdaProxyValue(payload: any) {
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(SuccessValue(payload))
    }
}
