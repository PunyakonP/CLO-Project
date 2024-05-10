const fs = require("fs");
const { parse } = require("csv-parse/sync");
const Logger = require('../helpers/Logger');
const moment = require('moment')
const SFTP = require('../helpers/connectSFTP')
const { HttpClient } = require('../lib')
const http = new HttpClient({
    baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.APP_ID}`,

})

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


    const pathRemoteBooking = `${process.env.SFTP_PATH}/testsftp.txt`//waiting for real path
    const pathRemoteDelivery = `${process.env.SFTP_PATH}/testsftp1.txt`//waiting for real path

    if (!pathRemoteBooking && !pathRemoteDelivery) {
        Logger.warning(`Files is not exist in directory`)
    }

    const fileRemoteBooking = await SFTP.get(pathRemoteBooking);
    const fileRemoteDelivery = await SFTP.get(pathRemoteDelivery);

    if (!fileRemoteBooking && !fileRemoteDelivery) {
        Logger.warning(`Can not read data from SFTP`)
    }

    Logger.info(`data from c365 ${fileRemoteBooking},\n${fileRemoteDelivery}`)

    const mapBooking = await mapDataForMeta(fileRemoteBooking.toString());
    const mapDelivery = await mapDataForMeta(fileRemoteDelivery.toString());

    const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;

    const indexs = 0
    // booking lead
    try {
        const responseBooking = await http.post(`/events${queryParams}`, mapBooking)
        //to do make logging
        console.log(responseBooking);
        // return responseBooking;
    }
    catch (error) {
        Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapBooking)} \nException : ${error}`)
        //to do make cashe Redis
        const recoveryData = { key: `${mapBooking.user_data.lead_id}}`, value: JSON.stringify(mapBooking) }
        await CacheData.setData(recoveryData);
    }

    // delivery lead
    try {
        const responseDelivery = await http.post(`/events${queryParams}`, mapDelivery)
        console.log(responseDelivery);
        return responseDelivery;
    } catch (error) {
        Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapDelivery)} \nException : ${error}`)
        //to do make cashe Redis
        for (i = indexs; i < mapDelivery.length; i++) {
            const checkDuplicate = CacheData.getData(mapDelivery[i].user_data.lead_id)
            if (checkDuplicate) {
                Logger.warning(`This leadi_id: ${mapDelivery[i].user_data.lead_id} is exist in cached`);
            } else {
                const recoveryData = { key: `${mapDelivery[i].user_data.lead_id}_${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`, value: JSON.stringify(mapDelivery[i]) }
                await CacheData.setData(recoveryData);
            }
        }
    }

    return true;

}

async function requestHttp() {

}

/**
 * 
 * @param {*} csvFile 
 * @param {*} eventName 
 */
async function mapDataForMeta(csvFile, eventName) {
    try {
        const records = parse((await csvFile).toString(), {
            columns: true,
            skip_empty_lines: true,
            delimiter: '|'
        });

        const reformat = records.map((record) => {
            return {
                event_name: eventName,
                event_time: moment(Date.parse(record.update_datetime)).unix(),
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
        Logger.error(`⚠ Failed to map data: ${csvFile} \nException : ${error}`)
    }

}

module.exports = readFile
