const configRedis = {
    'url': `${process.env.BASE_URL_PROTOCAL}${process.env.AZURE_CACHE_FOR_REDIS_HOST_NAME}:${process.env.AZURE_CACHE_FOR_REDIS_PORT}`,
    'password': process.env.AZURE_CACHE_FOR_REDIS_ACCESS_KEY,
}

module.exports = configRedis