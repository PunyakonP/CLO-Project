require('dotenv').config()
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const Client = require("ssh2-sftp-client");
const sftp = new Client();
const configSFTP = require('./src/configs/sftpConnect');

async function connectSFTP() {
    console.log(configSFTP);
    try {
        const connected = await sftp.connect(configSFTP)
        if (!connected) {
            console.log('connect failed');
            return false;
        }
        console.log('connect sucess');

        const path = process.env.SFTP_PATH
        console.log('path', path);
        const checkFolderExist = await sftp.exists(path)
        if (!checkFolderExist) {
            console.log('Folder is not exist.');
            return false;
        }
        console.log('check exist dir', checkFolderExist);

        const pathRemoteBooking = `${process.env.SFTP_PATH}/testsftp.txt`
        const fileRemoteBooking = await sftp.get(pathRemoteBooking);
        
        const pathRemoteDelivery = `${process.env.SFTP_PATH}/testsftp1.txt`
        const fileRemoteDelivery = await sftp.get(pathRemoteDelivery);
    
        await mapDataForMeta(fileRemoteBooking.toString(), 'booking');
        await mapDataForMeta(fileRemoteDelivery.toString(), 'purchase');
        return true;

    }
    catch (err) {
        console.log(err);
    }
}
connectSFTP().then(() => console.log)

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

    console.log(`Is ${eventName}: `, reformat);
}