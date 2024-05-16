const formats = require('../configs/logFormat');
const contextStorage = require('../configs/contextStorage');
const winston = require('winston');
const packageJson = require('../../package.json');

/**
 * Logger
 */
class Logger {
  /**
   * Constructor
   * @param {string|null} label Log label
   */
  constructor(label = null) {
    this._label = label;
    this.project = packageJson.name;
    this.version = packageJson.version;
  }

  /**
   * Initialize the default logger
   * @returns {void} Nothing
   */
  static initialize() {
    if (this.masterLogger) return;

    const transports = [];

    const consoleTransport = new winston.transports.Console({
      level: process.env.LOG_LEVEL ?? 'debug',
      format: formats.plain,
    });

    transports.push(consoleTransport);

    this.masterLogger = winston.createLogger({
      levels: winston.config.syslog.levels,
      format: formats.default,
      transports,
    });
  }

  /**
   * Create a new logger based on specified log label
   * @param {string} label Log label
   * @returns {Logger} Logger instance
   */
  label(label) {
    return new Logger(label);
  }

  /**
   * Format log metadata
   * @param {*} metadata Log metadata
   * @returns {*} Formatted log metadata
   * @private
   */
  formatLogMetadata(metadata) {
    const requestId = contextStorage.get('requestId') || '<--- no request --->';
    const userId = contextStorage.get('userId') || -1;
    const label = this._label ?? this.getAutomaticLabel();

    return {
      project: Logger.project,
      label: label,
      action: label,
      requestId,
      userId,
      [label]: metadata,
    };
  }

  /**
   * Get automatic logLabel
   * @return {string} Automatic logLabel
   * @private
   */
  getAutomaticLabel() {
    /*
     * Stack trace looks like this:
     * Error
     *    at Logger.getAutomaticLabel (C:\Users\user\Documents\GitHub\firebase-functions-typescript\client-api\src\helpers\Logger.ts:100:23)
     *    at Logger.formatLogMetadata (C:\Users\user\Documents\GitHub\firebase-functions-typescript\client-api\src\helpers\Logger.ts:81:22)
     *    at Logger.debug (C:\Users\user\Documents\GitHub\firebase-functions-typescript\client-api\src\helpers\Logger.ts:26:16)
     *    at ClientRepository.findById (C:\Users\user\Documents\GitHub\firebase-functions-typescript\client-api\src\repositories\ClientRepository.ts:50:13)
     *    ...
     *
     * So we split the stack trace by new line, and get the 5th line (index 4)
     */
    const [, , , , stackTrace] = String(new Error().stack).split('\n');
    const matches = stackTrace.match(/[/\\]([a-zA-Z0-9-_.]+)\.[jt]s/);

    const [, label = 'Unknown'] = matches ?? [];

    return label;
  }

  /**
   * Debug Log
   * @param {string} message Log message
   * @param {Object.<string, any>} metadata Log metadata
   * @returns {void} Nothing
   */
  debug(message, metadata = {}) {
    Logger.masterLogger.debug(message, this.formatLogMetadata(metadata));
  }

  /**
   * Info Log
   * @param {string} message Log message
   * @param {Object.<string, any>} metadata Log metadata
   * @returns {void} Nothing
   */
  info(message, metadata = {}) {
    Logger.masterLogger.info(message, this.formatLogMetadata(metadata));
  }

  /**
   * Warning Log
   * @param {string} message Log message
   * @param {Object.<string, any>} metadata Log metadata
   * @returns {void} Nothing
   */
  warning(message, metadata = {}) {
    Logger.masterLogger.warning(message, this.formatLogMetadata(metadata));
  }

  /**
   * Error Log
   * @param {string} message Log message
   * @param {Object.<string, any>} metadata Log metadata
   * @returns {void} Nothing
   */
  error(message, metadata = {}) {
    Logger.masterLogger.error(message, this.formatLogMetadata(metadata));
  }

  /**
   * Morgan logger
   * @param {string} morganMessage JSON-based morgan message
   * @returns {void} Nothing
   */
  morgan(morganMessage) {
    try {
      const { message, httpRequest = {} } = JSON.parse(morganMessage);
      const logMetadata = this.formatLogMetadata({});

      this.info(message || 'http request', { ...logMetadata, httpRequest });
    } catch (error) {
      this.error(`Failed to parse morgan log message, logging as plain text instead. Message: ${morganMessage}`, {
        error,
        message: morganMessage,
      });
    }
  }
}

Logger.initialize();

module.exports = new Logger();