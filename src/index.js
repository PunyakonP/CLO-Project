require('dotenv').config();
const Logger = require('./helpers/Logger');
const MssqlConnection = require('./helpers/MssqlConnection');


(async () => {
  try {
    await MssqlConnection.connect();
  } catch (error) {
    process.exit(1);
  }
})();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require('./configs/morgan');
const router = require('./routes');
const healthCheck = require('./routes/root');
const errorHandler = require('./middlewares/errorHandler');
const contextStorage = require('./configs/contextStorage');
const requestIdGenerator = require('./helpers/requestIdGenerator');

const API_PREFIX = process.env.API_PREFIX || '/api';
const ENV = process.env.NODE_ENV || 'development';
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;


const app = express();

/**
 *  First, set HTTP context for logging
 */
app.use((req, res, next) => {
  contextStorage.runAndReturn(() => {
    contextStorage.set('requestId', requestIdGenerator());
    next();
  });
});

/**
 * Then, log request info
 */
app.use(morgan);

/**
 * Security Settings
 */
app.use(helmet())
app.use(cors({
  origin: process.env.WHITELIST_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
}));

/**
 * Then process body
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());

app.use('/', healthCheck);
app.use(API_PREFIX, router);

/**
 * Error handling
 */
app.use(errorHandler);

app.listen(PORT, () => {
  Logger.debug(`✅ App is running at http://${HOST}:${PORT}/ in ${ENV} mode`, { HOST, PORT, ENV });
})
