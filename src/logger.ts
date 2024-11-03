// logger.ts
import { createLogger, format, transports } from 'winston';
import path from 'path';

// Custom format to include file name and line number
const customFormat = format((info) => {
    const stack = new Error().stack?.split('\n');
    if (stack && stack.length > 2) {
        const stackLine = stack[2].trim();
        const match = stackLine.match(/\((.*):(\d+):(\d+)\)/);
        if (match) {
            const filePath = match[1];
            const lineNumber = match[2];
            const fileName = path.basename(filePath);
            info.message = `${fileName}:${lineNumber} - ${info.message}`;
        }
    }
    return info;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        customFormat(),
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
    ]
});

export default logger;