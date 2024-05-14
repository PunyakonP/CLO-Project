const connRedis = require('../configs/redis')
const redis = require('redis')
const { setLogLevel, AzureLogger } = require('@azure/logger')

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

            const pong = await this.client.ping()

            if (pong !== 'PONG') {
                return pong;
            }
            console.log(`Connect REDIS: ${this.client.isOpen}`);
            return this.client

        } catch (error) {
            setLogLevel('error');
            AzureLogger.log = (...error) => {
                console.log(error);
            };
        }
    }

    async reconnect() {
        redis.createClient({
            'socket': {
                reconnectStrategy: retries => Math.min(retries * 50, 1000)
            }
        });
    }
/**
 * set data to redis from recovery
 * @param {*} data 
 * @returns 
 */
    async setData(data) {

        if (!data) {
            console.log('Data is not exist.');
            return false;
        }

        try {
            const { key, value } = data;
            const response = await this.client.set(key, value)

            if (response !== 'OK') {
                console.log('Data can not insert.');
                return response;
            }

            return response;

        } catch (error) {
            console.log(error)
        }
    }

    async getData(key) {

        if (!key) {
            console.log('key is not exist.');
            return false;
        }

        try {
            const response = await this.client.get(key)

            if (!response) {
                console.log('Can not get data.');
                return response;
            }
            return response;

        } catch (error) {
            console.log(error)
        }
    }

    async cleanData() {

        try {

            const response = await this.client.flushDb()

            if (response !== 'OK') {
                console.log('Can not clean data.');
                return response;

            }
            return response;

        } catch (error) {
            console.log(error)
        }
    }

}

module.exports = new CacheData(connRedis)