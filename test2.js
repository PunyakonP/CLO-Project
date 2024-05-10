const redis = require("redis");
require('dotenv').config();

// Environment variables for cache
const cacheHostName = process.env.AZURE_CACHE_FOR_REDIS_HOST_NAME;
const cachePassword = process.env.AZURE_CACHE_FOR_REDIS_ACCESS_KEY;

if (!cacheHostName) throw Error("AZURE_CACHE_FOR_REDIS_HOST_NAME is empty")
if (!cachePassword) throw Error("AZURE_CACHE_FOR_REDIS_ACCESS_KEY is empty")

const configRedis = {
    'url': `${process.env.BASE_URL_PROTOCAL}${process.env.AZURE_CACHE_FOR_REDIS_HOST_NAME}:${process.env.AZURE_CACHE_FOR_REDIS_PORT}`,
    'password': process.env.AZURE_CACHE_FOR_REDIS_ACCESS_KEY,
}

async function testCache() {

    console.log('red', configRedis);
    // Connection configuration
    const cacheConnection = redis.createClient(
        // rediss for TLS
        configRedis
    );

    const jsonData = {
        "data": [
            {
                "event_name": "qualified",
                "event_time": new Date().toISOString(),
                "action_source": "system_generated",
                "user_data": {
                    "lead_id": '2154196854321'
                },
                "custom_data": {
                    "event_source": "crm",
                    "lead_event_source": "toyota crm"
                }
            }
        ]
    };

    // Connect to Redis
    await cacheConnection.connect();

    // PING command
    console.log("\nCache command: PING");
    console.log("Cache response : " + await cacheConnection.ping());

    console.log(`${jsonData.data[0].event_name}${new Date().toDateString()}`, JSON.stringify(jsonData));
    // GET
    const get1 = await cacheConnection.get(`${jsonData.data[0].event_name}${new Date().toDateString()}`)
    console.log("\nCache command: GET Message");
    console.log("Cache response : " + get1);

    // SET
    const insert = await cacheConnection.set(`${jsonData.data[0].event_name}${new Date().toDateString()}`, JSON.stringify(jsonData))
    console.log("\nCache command: SET Message");
    console.log("Cache response : " + insert);

    // GET again
    const res = await cacheConnection.get(`${jsonData.data[0].event_name}${new Date().toDateString()}`)
    if (res !== 'OK') {
        console.log(res, 'err');
    }
    console.log("\nCache command: clean Message");
    console.log("Cache response : " + res);

    // Client list, useful to see if connection list is growing...
    // console.log("\nCache command: CLIENT LIST");
    // console.log("Cache response : " + await cacheConnection.sendCommand(["CLIENT", "LIST"]));

    // Disconnect
    cacheConnection.disconnect()

    return "Done"
}

testCache().then((result) => console.log(result)).catch(ex => console.log(ex));