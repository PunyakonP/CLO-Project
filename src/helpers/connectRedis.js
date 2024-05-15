const connRedis = require("../configs/redis");
const redis = require("redis");
const joi = require("joi");
const { runValidation } = require("../helpers/runValidation");
const { setLogLevel, AzureLogger } = require("@azure/logger");
const Logger = require("../helpers/Logger");

/**
 * Redis cache data
 */
class CacheData {
  constructor(options) {
    this.options = options;
    this.setup();
  }

  async setup() {
    // const redis = new Client();
    this.client = await redis.createClient(this.options);
    this.connect();
  }

  async connect() {
    try {
      if (!this.client) {
        this.setup();
      }

      await this.client.connect();

      const pong = await this.client.ping();

      if (pong !== "PONG") {
        Logger.debug(pong);
      }
      Logger.info(`Connect REDIS: ${this.client.isOpen}`);

      this.client.on('connect', function () {
        console.log('Connected to Redis');
      });
  
      this.client.on('error', function (error) {
        console.error('Redis error:', error);
      });

      this.client.on('end', function () {
        console.log('Connection to Redis ended unexpectedly');
        // Attempt automatic reconnection after a delay
        setTimeout(connectToRedis, 3000); // Retry connection after 5 seconds
      });

      return this.client;
    } catch (error) {
      //   setLogLevel("error");
      //   AzureLogger.log = (...error) => {
      // };
      Logger.error(error);
    }
  }

  /**
   * set data to redis from recovery
   * @param {*} data
   * @returns
   */
  async setData(key, field, value) {
    const result = await runValidation(
      { key, field, value },
      joi.object({
        key: joi.string().required(),
        field: joi.string().required(),
        value: joi.any(),
      })
    );
    try {
      const response = await this.client.hSet(
        result.key,
        result.field,
        result.value
      );
      if (+response) {
        Logger.warning("Failed to insert data");
      }

      return response;
    } catch (error) {
      Logger.error(error);
    }
  }


  /**
   *
   * @param {*} data
   * @returns
   */
  async getData(key, field) {
    const result = await runValidation(
      { key, field },
      joi.object({
        key: joi.string().required(),
        field: joi.string().required(),
      })
    );

    try {
      const response = await this.client.hGet(result.key, result.field);
      if (!response) {
        // Logger.error("Failed to get data Or data is not exist.");
        return response;
      }
      return response;
    } catch (error) {
      Logger.error(error);
    }
  }

  /**
   *
   * @param {string} key
   * @returns
   */
  async getAll(key) {
    const result = await runValidation(
      { key },
      joi.object({
        key: joi.string().required(),
      })
    );

    try {
      const response = await this.client.hGetAll(result.key);
      if (Object.keys(response).length === 0) {
        Logger.error("Can not get data.");
        return null;
      }
      return response;
    } catch (error) {
      Logger.error(error);
    }
  }

  /**
   *
   * @param {*} data
   * @returns
   */
  async cleanData(key, field) {
    const result = await runValidation(
      { key, field },
      joi.object({
        key: joi.string().required(),
        field: joi.string().required(),
      })
    );

    try {
      const response = await this.client.hDel(result.key, result.field);
      if (response !== "0") {
        Logger.warning(`Can not clean data: ${result.field}`);
        return response;
      }
      return response;
    } catch (error) {
      Logger.error(error);
    }
  }
}

module.exports = new CacheData(connRedis);
