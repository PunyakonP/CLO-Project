const fs = require("fs");
const { parse } = require("csv-parse/sync");
const SFTP = require('../helpers/connectSFTP')

/**
 * 
 * @returns 
 */
async function readFile() {

    await SFTP.connect();
    
    // todo waiting path from tdem
    const checkFolderExist = await SFTP.exist(process.env.SFTP_PATH)
    if(!checkFolderExist) {
        return false;
    }

    const pathRemoteBooking = `${process.env.SFTP_PATH}/testsftp.txt`
    const fileRemoteBooking = await SFTP.readFile(pathRemoteBooking);
    
    const pathRemoteDelivery = `${process.env.SFTP_PATH}/testsftp1.txt`
    const fileRemoteDelivery = await SFTP.readFile(pathRemoteDelivery);

    const mapBooking = await mapDataForMeta(fileRemoteBooking.toString());
    const mapDelivery = await mapDataForMeta(fileRemoteDelivery.toString());
    // const csvFilePath = path.join(
    //     "/Users/mc-pro-2020-007/Downloads/",
    //     "message\ \(1\).csv"
    // );

    // const csvContent = fs.readFileSync(csvFilePath, "utf8");

   return;

}

/**
 * 
 * @param {*} csvFile 
 * @param {*} eventName 
 */
async function mapDataForMeta(csvFile, eventName) {
    const records = parse((await csvFile).toString(), {
        columns: true,
        skip_empty_lines: true,
        delimiter: '|'
    });


    const reformat = records.map((record) => {
        return {
            event_name: eventName,
            event_time: record.update_datetime,
            action_source: 'system_generated',
            user_data:{
                leadgen_id: record.leadgen_id,
            },
            custom_data: {
                event_source: "crm",
                lead_event_source: "toyota crm"

            }
        }
    });

    console.log(reformat);
}

module.exports = readFile
