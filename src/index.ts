// import { VerseReference } from "@models/VerseReference.js";
// console.log(VerseReference.fromString("1Cor 13:4"));

import { app } from "./server.js";
const port = process.env.API_PORT || 3000; // HTTPS port
import logger from './logger.js';

// Start the server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});
