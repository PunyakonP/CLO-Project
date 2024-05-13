const Client = require("ssh2-sftp-client");
const connSFTP = require("../configs/sftp");
const { setLogLevel, AzureLogger } = require("@azure/logger");
const Logger = require("./Logger");

/**
 * SFTP client
 */
class SFTP {
  /**
   * Constructor
   * @param {} options //
   */
  constructor(options) {
    this.options = options;
    this.setup();
  }

  /**
   * initial connect
   */
  async setup() {
    this.client = new Client();
    await this.client.connect(this.options);
    Logger.debug(
      `✅ Set up to SFTP '${this.options.host}' at: ${this.options.port}`
    );
  }

  async connect() {
    try {
      if (!this.client) {
        this.setup();
      }
      return this.client;
    } catch (err) {
      setLogLevel("error");
      Logger.error(
        `Set up SFTP Error: '${err}'`
      );
      // if (error == "Error: lstat: lstat: No SFTP connection available") {
      //   this.setup();
      // }
    }
  }

  async getlsit(path) {
    return await this.client.list(path);
  }

  async current() {
    return await this.client.cwd();
  }

  async exist(path) {
    // todo waiting path from tdem
    const checkFolderExist = await this.client.exists(
      "/clo_sftp/trans_data_clo"
    );

    return checkFolderExist;
  }
  /**
   *
   * @param {string} fileName
   * @returns {Promise}
   */
  async get(fileName) {
    try {
      const result = await this.client.get(fileName);

      if (!result) {
        return null;
      }

      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async close() {
    try {
      const disconnect = await this.client.end();
      Logger.info(disconnect);
    } catch (error) {
      Logger.error(`Failed to close sesion SFTP: ${error}`);
    }
  }
}

module.exports = new SFTP(connSFTP);
