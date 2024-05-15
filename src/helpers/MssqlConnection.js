const mssql = require('mssql');
const configDatabaseOption = require('../configs/database');
const Logger = require('./Logger');

class MssqlConnection {
  #config = null;
  #client = null;

  constructor(config) {
    this.#config = config;
  }

  async connect() {
    try {
      if (!this.#client) {
        this.#client = await mssql.connect(this.#config);
      }

      Logger.debug(`✅ Connected to database '${this.#config.database}' at ${this.#config.server}: ${this.#config.port}`)

      return this.#client;
    } catch (error) {
      Logger.error((`⚠ Cannot connect to database: ${error.stack}`))
      throw new Error('Cannot connect to database');
    }
  }

  async executeQuery(queryString, params) {
    if (!this.#client) {
      await this.connect();
    }

    const preparedStatement = new mssql.PreparedStatement();

    try {
      params.forEach(param => {
        if (param.type && param.name) preparedStatement.input(param.name, param.type);
      });
      Logger.info(`Query string: ${queryString}`)
      await preparedStatement.prepare(queryString);

      const values = params.reduce((acc, { name, value }) => {
        if (name && value !== undefined) acc[name] = value;
        return acc;
      }, {});

      const result = await preparedStatement.execute(values);
      await preparedStatement.unprepare();

      return result;
    } catch (error) {
      throw error;
    } finally {
      if (preparedStatement.prepared) {
        preparedStatement.unprepare(error => {
          if (error) Logger.error(`⚠ Failed to in unpreparing: ${error.stack}`);
        });
      }
    }
  }

  async close() {
    if (this.#client) {
      await this.#client.close();
    }

    Logger.error('❌ Database connection closed')
  }
}

module.exports = new MssqlConnection(configDatabaseOption);