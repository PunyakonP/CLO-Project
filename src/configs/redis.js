const configRedis = {
    'url': `${process.env.BASE_URL_PROTOCAL}${process.env.AZURE_CACHE_FOR_REDIS_HOST_NAME}:${process.env.AZURE_CACHE_FOR_REDIS_PORT}`,
    'password': process.env.AZURE_CACHE_FOR_REDIS_ACCESS_KEY,
    'socket': {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
    'pingInterval': 10000,
}

module.exports = configRedis