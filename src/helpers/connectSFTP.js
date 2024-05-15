const Client = require("ssh2-sftp-client");
const connSFTP = require("../configs/sftp");
const path = require('path')
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
  }

  /**
   * initial connect
   */
  async setup() {
    this.client = new Client();
    await this.client.connect(this.options);
    Logger.debug(
      `✅ Successfully Connected to SFTP '${this.options.host}' at: ${this.options.port}`
    );
  }

  async connect() {
    try {
      if (!this.client) {
        this.setup();
      }
      return this.client;
    } catch (err) {
      // setLogLevel("error");
      Logger.error(`Set up SFTP Error: '${err}'`);
    
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
    const checkFolderExist = await this.client.exists(path);
    return checkFolderExist;
  }

  async dowmloadFile(remotePath,fileName) {
    
    try {
      const fileDownload = await this.client.fastGet(remotePath, path.join(__dirname, '..', `/assets/${fileName}`))
      return fileDownload
    } catch (error) {
      Logger.error(error.message)
    }
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
      Logger.error(error);
    }
  }

  async where() {
    try {
      const pathNow = await this.client.cwd();
      if (!pathNow) {
        Logger.warning(`Can not get path`);
      }
      return pathNow;
    } catch (error) {
      Logger.error(error);
    }
  }

  async streamR(){
    const dd = await this.client.createReadStream()
    return dd
  } 

  async streamC() {
    const aa = await this.client.createWriteStream()
    return aa
  }
    

  async stats() {
    const point = await this.client.stat()
    if(!point){
      Logger.debug(`Can not acsociate point`)
      return point
    }
  }

  async close() {
    try {
      const disconnect = await this.client.end()
      Logger.info(disconnect);
      return disconnect;
      
    } catch (error) {
      Logger.error(`Failed to close sesion SFTP: ${error}`);
      return err
    }
  }
}

module.exports = new SFTP(connSFTP);
