const MssqlConnection = require('../helpers/MssqlConnection');
const moment = require('moment')
const Logger = require('../helpers/Logger');
const CacheData = require('../helpers/connectRedis')
const axios = require('axios')
const { HttpClient } = require('../lib');
const http = new HttpClient({
    baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.APP_ID}`
})
// const httpV2 = axios.create({
//     baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.APP_ID}`
// })
/**
 * get data
 * @returns {Promise}
 */
async function getQuerifiedLead() {
    let startDate = moment().subtract(1, 'days').format(`YYYY-MM-DD 00:00:00.000`);
    let endDate = moment().subtract(1, 'days').format(`YYYY-MM-DD 23:59:59.999`);
    const result = await MssqlConnection.executeQuery(`SELECT Lead_id, SendDate
      FROM TempTarget
      WHERE SendDate between '2024-04-30 00:00:00.000' and '2024-04-30 23:59:59.999'
      order by ID desc`, [
        { String }
    ])

    if (!result || result.recordset.length <= 0) {
        Logger.debug(`This date: ${new Date().toLocaleDateString()} don't have data. Result: ${result.recordset.length}`)
        return;
    }
    Logger.info(`QuerifiedLead count: ${result.recordset.length}`)
    const mapQuelifiedLead = await mapDataForMeta('qualified', result.recordset);
    // console.log('timestamp', mapQuelifiedLead.length);

    let responseBooking = [
        {
            "event_name": "qualified",
            "event_time": 1714459338,
            "action_source": "system_generated",
            "user_data": {
                "lead_id": "1"
            },
            "custom_data": {
                "event_source": "crm",
                "lead_event_source": "toyota crm"
            }
        },
        {
            "event_name": "qualified",
            "event_time": 1714459338,
            "action_source": "system_generated",
            "user_data": {
                "lead_id": "985686259580664"
            },
            "custom_data": {
                "event_source": "crm",
                "lead_event_source": "toyota crm"
            }
        }, {
            "event_name": "qualified",
            "event_time": 1714459338,
            "action_source": "system_generated",
            "user_data": {
                "lead_id": "985686259580664"
            },
            "custom_data": {
                "event_source": "crm",
                "lead_event_source": "toyota crm"
            }
        }
    ]
    let indexs = 0
    try {
        // console.log('testttt', responseBooking.length);
        for (i = 0; i < responseBooking.length; i++) {
            indexs = i

            // console.log('test', responseBooking[i]);
            await http.post(`/events${queryParams}`, {
                "data": [
                    responseBooking[i]
                ]
            })
            //to do make logging
            Logger.info(`Send request Quelified lead(${responseBooking[i].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        }
        Logger.debug('All request is success')
        // console.log('qwwqwq', responseBooking);
        return true;
    }
    catch (error) {
        // console.log('err', error);
        Logger.error(`⚠ Failed to request data`)
        //to do make cashe Redis
        for (i = indexs; i < responseBooking.length; i++) {
            const checkDuplicate = CacheData.getData(responseBooking[i].user_data.lead_id)
            if (checkDuplicate) {
                Logger.warning(`This leadi_id: ${responseBooking[i].user_data.lead_id} is exist in cached`);
            } else {
                const recoveryData = { key: `${responseBooking[i].user_data.lead_id}`, value: JSON.stringify(responseBooking[i]) }
                await CacheData.setData(recoveryData);
            }
        }
        Logger.info(`Saved cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        throw error
    }
}
/**
 * request Data per lead
 * @param {} data 
 * @returns 
 */
async function multiRequestHttp(data) {
    const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`
    let indexs = 0
    try {
        for (i = 0; i < data.length; i++) {
            indexs = i

            await http.post(`/events${queryParams}`, {
                "data": [
                    data[i]
                ]
            })
            //to do make logging
            Logger.info(`Send request ${data[i].event_name} lead(${data[i].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        }
        Logger.debug('All request is success')
        return true;
    }
    catch (error) {
        // console.log('err', error);
        Logger.error(`⚠ Failed to request data`)
        //to do make cashe Redis
        for (i = indexs; i < data.length; i++) {
            const checkDuplicate = CacheData.getData(data[i].user_data.lead_id)
            if (checkDuplicate) {
                Logger.warning(`This leadi_id: ${data[i].user_data.lead_id} is exist in cached`);
            } else {
                const recoveryData = { key: `${data[i].user_data.lead_id}`, value: JSON.stringify(data[i]) }
                await CacheData.setData(recoveryData);
            }
        }
        Logger.info(`Saved cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        throw error
    }
}

async function getRawLead(data) {
    if (!data) {
        Logger.warning(`The parameter data is required`);
        return;
    }
    const mapRawLead = await mapDataForMeta('initial_lead', data);
    const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`
    try {
        const responseRawLead = await http.post(`/events${queryParams}`, { data: mapRawLead })
        //to do make logging
        Logger.info(`Send request at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`)
        return responseRawLead;
    }
    catch (error) {
        Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapRawLead)} \nException : ${error}`)
        //to do make cashe Redis
        const checkDuplicate = CacheData.getData(mapRawLead.user_data.lead_id)
        if (checkDuplicate === 'OK') {
            Logger.warning(`This leadi_id: ${mapRawLead.user_data.lead_id} is exist in cached`);
            return;
        }
        const recoveryData = { key: `${mapRawLead.user_data.lead_id}`, value: JSON.stringify(mapRawLead) }
        await CacheData.setData(recoveryData);
    }
}
/**
 * map data to meta template
 * @param {string} eventName 
 * @param {*} data 
 */
async function mapDataForMeta(eventName, data) {
    try {
        const reformat = data.map((record) => {
            return {
                event_name: eventName,
                event_time: moment(record.SendDate).unix(),
                action_source: 'system_generated',
                user_data: {
                    lead_id: record.Lead_id,
                },
                custom_data: {
                    event_source: "crm",
                    lead_event_source: "toyota crm"

                }

            }
        });

        Logger.info(`Result =>>  ${eventName}`, reformat);
        return reformat;

    } catch (error) {
        Logger.error(`⚠ Failed to map data: ${data} \nException : ${error}`)
    }

}

module.exports = { getQuerifiedLead, getRawLead }