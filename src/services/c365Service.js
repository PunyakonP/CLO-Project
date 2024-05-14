const fs = require("fs");
const { parse } = require("csv-parse/sync");
const Logger = require('../helpers/Logger');
const moment = require('moment')
const SFTP = require('../helpers/connectSFTP')
const CacheData = require('../helpers/connectRedis')
const axios = require('axios')

const { HttpClient } = require('../lib');
const { func } = require("joi");
const http = new HttpClient({
    baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.PIXEL_ID}`,

})
// axios.create
/**
 * read file data (.txt) on SFTP server
 * @returns 
 */
async function readFile() {
    Logger.debug(`Start connecting SFTP`)
    await SFTP.connect();
    Logger.debug(`Connected SFTP successful`)

    // todo waiting path from tdem
    const pathDir = process.env.SFTP_PATH
    const checkFolderExist = await SFTP.exist(pathDir)
    if (!checkFolderExist) {
        Logger.warning(`Directory is not exist ${pathDir}`)
        return false;
    }
    await bookingLead();
    await deliveryLead();
    
    await SFTP.close();
    return;
}
async function bookingLead() {
    const dataListBooking = await SFTP.getlsit(`${process.env.SFTP_PATH}/trans_clo_booking_lead/`);
    console.log('list data: ', dataListBooking);

    // const getFileDate = {...dataListBooking};
    // const dataDate = {...dataListDelivery};

    const pathRemoteBooking = `${process.env.SFTP_PATH}/trans_clo_booking_lead/${dataListBooking[0].name}`//waiting for real path

    if (!pathRemoteBooking) {
        Logger.warning(`Files is not exist in directory`)
    }

    const fileRemoteBooking = await SFTP.get(pathRemoteBooking);

    if (!fileRemoteBooking) {
        Logger.warning(`Can not read data from SFTP`)
    }

    Logger.info(`data from c365 ${fileRemoteBooking}`)

    const mapBooking = await mapDataForMetaBooking(fileRemoteBooking.toString(), 'booking');
    console.log('1111111111111111', mapBooking);
    const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;

    const url = 'https://graph.facebook.com/v19.0/1618011605605581/events?access_token=EAAMgDW042TwBO5tXy7hazTZAWIBIApZCGRd1bfDFh6wE9ZBVGmqlCK3AKMrMPm9b1t8XdxwZBlyIqVwkE8CklgXUVlHF1N2Mnrmkn10Y60TgSBQtaWkEETfqvsX0SLwyuBZAb5jAk5eFDBMZA4yTDiityZAuhVowNIuXXhJPZCbXH9SbfcSoYx7blUgAxOuKEHiprwZDZD'

    let indexs = 0
    // booking lead
    try {
        for (i = 0; i < mapBooking.length; i++) {
            indexs = i
            await axios.post(url, {
                "data": [
                    {
                        "event_name": "booking",
                        "event_time": mapBooking[i].event_time,
                        "action_source": "system_generated",
                        "user_data": {
                            "lead_id": mapBooking[i].user_data.lead_id
                        },
                        "custom_data": {
                            "event_source": "crm",
                            "lead_event_source": "toyota crm"
                        }
                    }
                ]
            })

            //to do make logging
            Logger.info(`Send request ${mapBooking[i].event_name} lead(${mapBooking[i].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        }
        Logger.debug('All request booking Lead is success')
        // return true;
        // const responseBooking = await http.post(`/events${queryParams}`, mapBooking)
        // //to do make logging
        // console.log(responseBooking);
        // return responseBooking;
    }
    catch (error) {
        Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapBooking[0])} \nException : ${error.response.data}`)
        //to do make cashe Redis
        // for (i = 0; i < mapBooking.length; i++) {

        //     const checkDuplicate = CacheData.getData(mapBooking[i].user_data.lead_id)
        //     if (checkDuplicate) {
        //         Logger.warning(`This leadi_id: ${mapBooking[i].user_data.lead_id} is exist in cached`);
        //     } else {
        //         const recoveryData = { key: `${mapBooking[i].user_data.lead_id}`, value: JSON.stringify(mapBooking[i]) }
        //         await CacheData.setData(recoveryData);
        //     }
        // }
        Logger.info(`Saved cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `);
        throw error
    }



    return true;

}

// delivery lead
async function deliveryLead() {
    Logger.info('start send delivery lead')
    try {
        const dataListDelivery = await SFTP.getlsit(`${process.env.SFTP_PATH}/trans_clo_delivered_lead/`);
        const pathRemoteDelivery = `${process.env.SFTP_PATH}/trans_clo_delivered_lead/${dataListDelivery[0].name}`//waiting for real path
        const fileRemoteDelivery = await SFTP.get(pathRemoteDelivery);
        const mapDelivery = await mapDataForMetaDelivery(fileRemoteDelivery.toString(), 'purchase');

        const responseDelivery = await axios.post(url, {
            "data": [
                {
                    "event_name": "booking",
                    "event_time": mapDelivery[0].event_time,
                    "action_source": "system_generated",
                    "user_data": {
                        "lead_id": mapDelivery[0].user_data.lead_id
                    },
                    "custom_data": {
                        "event_source": "crm",
                        "lead_event_source": "toyota crm"
                    }
                }
            ]
        })
        console.log(responseDelivery.response);
        // return responseDelivery;
    } catch (error) {
        Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapDelivery[0])} \nException : ${error.response.data}`)
        //to do make cashe Redis
        // for (i = indexs; i < mapDelivery.length; i++) {
        //     const checkDuplicate = CacheData.getData(mapDelivery[i].user_data.lead_id)
        //     if (checkDuplicate) {
        //         Logger.warning(`This leadi_id: ${mapDelivery[i].user_data.lead_id} is exist in cached`);
        //     } else {
        //         const recoveryData = { key: `${mapDelivery[i].user_data.lead_id}_${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`, value: JSON.stringify(mapDelivery[i]) }
        //         await CacheData.setData(recoveryData);
        //     }
        // }
        throw error
    }
}

// async function requestHttp() {

// }

/**
 * 
 * @param {*} csvFile 
 * @param {*} eventName 
 */
async function mapDataForMetaBooking(csvFile, eventName) {
    try {
        const records = parse((await csvFile).toString(), {
            columns: true,
            skip_empty_lines: true,
            delimiter: '|'
        });

        const reformat = records.map((record) => {
            return {
                event_name: eventName,
                event_time: moment(Date.parse(record.booking_date)).unix(),
                action_source: 'system_generated',
                user_data: {
                    lead_id: record.leadgen_id,
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
        Logger.error(`⚠ Failed to map data: ${csvFile} \nException : ${error.response.data}`)
    }

}

async function mapDataForMetaDelivery(csvFile, eventName) {
    try {
        const records = parse((await csvFile).toString(), {
            columns: true,
            skip_empty_lines: true,
            delimiter: '|'
        });

        // const mapEventTime = Object.keys(records[0])[1];
        // console.log('col name', mapEventTime);
        const reformat = records.map((record) => {
            return {
                event_name: eventName,
                event_time: moment(Date.parse(record.delivery_date)).unix(),
                action_source: 'system_generated',
                user_data: {
                    lead_id: record.leadgen_id,
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
        Logger.error(`⚠ Failed to map data: ${csvFile} \nException : ${error.response.data}`)
    }

}

module.exports = readFile
