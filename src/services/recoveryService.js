const fs = require("fs");
const { parse } = require("csv-parse/sync");
const Logger = require("../helpers/Logger");
const moment = require("moment");
moment.defaultFormat = moment.ISO_8601
const SFTP = require("../helpers/connectSFTP");
const CacheData = require("../helpers/connectRedis");
const axios = require("axios");
// const { HttpClient } = require("../lib");
const http = axios.create({
  baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.PIXEL_ID}`,
});

async function recoveryBooking() {
  const countRecovery = await countGetFile();
  const result = {
    message: "",
    notFound: [],
    dataIsEmtry: [],
    response: {
      success: [],
      failed: []
    }
  }
  Logger.info(`Date is diff: ${countRecovery}`);

  let success = 0;
  let failed = 0;

  for (i = 0; i < countRecovery; i++) {

    const dataListBooking = await findAllBooking();
    const dateSub = await getDateSubtract();
    const lastTransfer = await historyTransfer({
      key: "C365_HistoryBooking",
      field: "",
      fieldDel: "",
      value: "",
      type: "lasted",
    });
    const checkDate = convertDateFileName(lastTransfer, dateSub);

    const bookingFindName = findMatchingBooking(dataListBooking, checkDate);
    Logger.info(`file booking time:${i} ${bookingFindName}`)
    if (!bookingFindName) {
      const value = `Lead not found in SFTP at ${dataListBooking} ${getCurrentTimestamp()}`
      Logger.warning(value);
      result.notFound.push(value)
      return result;
    }

    const fileContent = await findBookFile(bookingFindName);
    if (!fileContent) {
      Logger.warning("Unable to read data from SFTP");
      return false;
    }

    const mappedBookings = await mapDataForMetaBooking(fileContent, "booking");
    if (!mappedBookings || mappedBookings.length <= 0) {
      const value = `This booking: ${bookingFindName} is emtry data at: ${moment().format(
        "DD-MM-YYYY HH:mm:ss"
      )}`;
      await saveTransferRecord(bookingFindName, lastTransfer, value);
      Logger.info(`Create a new history: ${bookingFindName} with emtry data`);
      result.dataIsEmtry.push(value)
    }
    else {
      for (j = 0; j < mappedBookings.length; j++) {
        const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
        const url = `/events${queryParams}`;

        const response = await http
          .post(url, { data: [mappedBookings[j]] })
          .catch((error) => {
            return error;
          });

        if (response.status == 200) {
          success++;
          //to do make logging
          result.response.success.push(mappedBookings[j])
          Logger.info(
            `Send request ${mappedBookings[j].event_name} lead(${mappedBookings[j].user_data.lead_id
            }) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `
          );
        } else {
          failed++;
          result.response.failed.push(mappedBookings[j])
          result.response.failed.push({ ...mappedBookings[i], facebookMessage: response.response?.data?.error });
          Logger.error(
            `⚠ Failed to request data: ${JSON.stringify(
              mappedBookings[j]
            )} \nException : ${JSON.stringify(response.response?.data?.error)}`
          );
        }
      }
    }
    
    const messageLog = `All request booking Lead is success => ${success}, is failed => ${failed}`;
    await saveTransferRecord(bookingFindName, lastTransfer, messageLog);
    result.message = messageLog
    Logger.debug(messageLog);
  }

  return result;
}

async function countGetFile() {

  const lastTransfer = await historyTransfer({
    key: "C365_HistoryBooking",
    field: "",
    fieldDel: "",
    value: "",
    type: "lasted",
  });
  const subtractDete = getDateSubtract(process.env.DATETIME_LEAD, 1);
  const checkDate = determineCheckDate(lastTransfer, subtractDete);
  // const nextDate = moment(checkDate).add(1, "days").format("DDMMYYYY");
  const currentDate = await getCurrentTimestamp(process.env.DATETIME_LEAD);
  const countRecovery = await differentDate(checkDate, currentDate);
 
  return countRecovery;
}

function findCreateDateBooking(dataList) {
  let regex = /\d{8}(?=\d{6}_\d{8}\.txt)/;
  const checkDate = moment().format('YYYYMMDD')

  const listMatch = []

  for (const booking of dataList) {
    const match = booking.name.match(regex);
    if (match && match[1] == checkDate) {
      Logger.info(`Found booking: ${booking.name}`);
      listMatch.push(booking.name);
    }
  }
  return listMatch;
}

function findMatchingBooking(dataList, checkDate) {
  const regex = /_(\d{8})\.txt$/;

  for (const booking of dataList) {
    const match = booking.name.match(regex);
    if (match && match[1] == checkDate) {
      Logger.info(`Found booking: ${booking.name}`);
      return booking.name;
    }
  }

  return null;
}

async function saveTransferRecord(fildName, lastTransfer, value) {
  const newRecord = {
    key: "C365_HistoryBooking",
    field: fildName.toString(),
    fieldDel: Object.keys(lastTransfer).join(''),
    value,
    type: "new",
  };
  await historyTransfer(newRecord);
}

async function findBookFile(fileName) {
  const remotePath = `${process.env.SFTP_PATH}/trans_clo_booking_lead/${fileName}`;
  const fileContent = await SFTP.get(remotePath);
  return fileContent ? fileContent : null;
}

function convertDateFileName(lastTransfer, fallbackDate) {
  if (!lastTransfer) {
    Logger.info("No previous transfer found. Defaulting to fallback date.");
    return fallbackDate;
  }

  const transferDateMatch = Object.keys(lastTransfer)
    .toString()
    .match(/_(\d{8})\.txt$/);
  if (!transferDateMatch) return fallbackDate;

  const [day, month, year] = parseTransferDate(transferDateMatch[1]);
  const lastTransferDate = new Date(year, month - 1, day);
  const nextDate = moment(lastTransferDate).add(1, "days").format("DDMMYYYY");

  return nextDate;
}

async function findAllBooking() {
  const path = `${process.env.SFTP_PATH}/trans_clo_booking_lead/`;
  const dataListBooking = await SFTP.getlsit(path);
  Logger.info(`list data: ${JSON.stringify(dataListBooking, null, 2)}`);
  return dataListBooking;
}

async function historyTransfer(data) {
  if (!data) {
    Logger.warning("Data for history is required");
    return;
  }
  const { key, field, fieldDel, value, type } = data;

  const lasted = await CacheData.getAll(key);
  if (type === "lasted") {
    return lasted;
  }
  if (Object.keys(lasted) == field) {
    Logger.warning(`Duplicate field history ${field}`);
    return;
  }
  const newHistory = await CacheData.setData(key, field, value);
  if (!newHistory) {
    Logger.error(
      `Failed to record history: ${field} at: ${getCurrentTimestamp()}`
    );
    return;
  }

  Logger.info(`Insert data success : ${field}`);

  if (fieldDel) {
    await CacheData.cleanData(key, fieldDel);
    Logger.info(`Clean data of booking lead: ${fieldDel}`);
  }

  Logger.info(`Create a New history: (${field}) with data`);
  return;
}

async function differentDate(lastedhistory, currentDeteTime) {
  if (!lastedhistory) {
    Logger.warning(`value is required in different date`);
    return moment();
  }
  const currentDete = moment(currentDeteTime);
  const lastedDete = moment(lastedhistory);
  const conntDate = currentDete.diff(lastedDete, "days");
  return conntDate;
}

function getDateSubtract(baseDate, dayOffset) {
  if (baseDate)
    return moment(baseDate)
      .subtract(dayOffset, "days")
      .format("DDMMYYYY")
      .toString();
  return moment().subtract(dayOffset, "days").format("DDMMYYYY").toString();
}

function determineCheckDate(lastTransfer, fallbackDate) {
  if (!lastTransfer) {
    Logger.info("No previous transfer found. Defaulting to fallback date.");
    return fallbackDate;
  }

  const transferDateMatch = Object.keys(lastTransfer)
    .toString()
    .match(/_(\d{8})\.txt$/);
  if (!transferDateMatch) return fallbackDate;

  const [day, month, year] = parseTransferDate(transferDateMatch[1]);
  const lastTransferDate = new Date(year, month - 1, day);

  return lastTransferDate;
}

function parseTransferDate(dateStr) {
  return [
    parseInt(dateStr.substr(0, 2), 10),
    parseInt(dateStr.substr(2, 2), 10),
    parseInt(dateStr.substr(4, 4), 10),
  ];
}

function getCurrentTimestamp(dateTime) {
  if (dateTime) {
    return moment(dateTime).subtract(1, "days");
  }
  return moment().subtract(1, "days").format("YYYY-MM-DD HH:mm:ss");
}


// Delivery Lead
async function findDeliveryFile(fileName) {
  const remotePath = `${process.env.SFTP_PATH}/trans_clo_delivered_lead/${fileName}`;
  const fileContent = await SFTP.get(remotePath);
  return fileContent ? fileContent : null;
}


async function findAllDelivery() {
  const path = `${process.env.SFTP_PATH}/trans_clo_delivered_lead/`;
  const dataListDelivery = await SFTP.getlsit(path);
  Logger.info(`list data: ${JSON.stringify(dataListDelivery, null, 2)}`);
  return dataListDelivery;
}

async function countGetFileDelivery() {
  const lastTransfer = await historyTransfer({
    key: "C365_HistoryDelivery",
    field: "",
    fieldDel: "",
    value: "",
    type: "lasted",
  });
  const subtractDete = getDateSubtract(process.env.DATETIME_LEAD, 1);
  const checkDate = determineCheckDate(lastTransfer, subtractDete);
  const currentDate = await getCurrentTimestamp(process.env.DATETIME_LEAD);
  const countRecovery = await differentDate(checkDate, currentDate);
 
  return countRecovery;
}

function findMatchingDelivery(dataList, checkDate) {
  const regex = /_(\d{8})\.txt$/;
  for (const delivery of dataList) {
    const match = delivery.name.match(regex);
    if (match && match[1] == checkDate) {
      Logger.info(`Found delivery: ${delivery.name}`);
      return delivery.name;
    }
  }

  return null;
}

async function saveTransferDelivery(fildName, lastTransfer, value) {
  const newRecord = {
    key: "C365_HistoryDelivery",
    field: fildName.toString(),
    fieldDel: Object.keys(lastTransfer).join(''),
    value,
    type: "new",
  };
  await historyTransfer(newRecord);
}

async function recoveryDelivery() {
  const countRecovery = await countGetFileDelivery();

  const result = {
    message: "",
    notFound: [],
    dataIsEmtry: [],
    response: {
      success: [],
      failed: []
    }
  }

  let success = 0;
  let failed = 0;

  Logger.info(`Date diff is : ${countRecovery}`);

  for (i = 0; i < countRecovery; i++) {

    const dataListDelivery = await findAllDelivery();
    const dateSub = await getDateSubtract();
    const lastTransfer = await historyTransfer({
      key: "C365_HistoryDelivery",
      field: "",
      fieldDel: "",
      value: "",
      type: "lasted",
    });
    const checkDate = convertDateFileName(lastTransfer, dateSub);

    const deliveryFindName = findMatchingDelivery(dataListDelivery, checkDate);
    Logger.info(`file delivery time:${i} ${deliveryFindName}`)
    if (!deliveryFindName) {
      const value = `Lead not found in SFTP at ${deliveryFindName} ${getCurrentTimestamp()}`
      Logger.warning(value); 
      result.notFound.push(value)
      return result;
    }

    const fileContent = await findDeliveryFile(deliveryFindName);
    if (!fileContent) {
      Logger.warning("Unable to read data from SFTP");
      return false;
    }

    const mappedDelivery = await mapDataForMetaDelivery(fileContent, "purchase");
    if (!mappedDelivery || mappedDelivery.length <= 0) {
      const value = `This delivery: ${deliveryFindName} is emtry data at: ${moment().format(
        "DD-MM-YYYY HH:mm:ss"
      )}`;
      Logger.warning(value)
      await saveTransferDelivery(deliveryFindName, lastTransfer, value);
      Logger.info(`Create a new history: ${fileContent} with emtry data`);
      result.dataIsEmtry.push(value)
    }
    else {
      for (j = 0; j < mappedDelivery.length; j++) {
        const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
        const url = `/events${queryParams}`;

        const response = await http
          .post(url, { data: [mappedDelivery[j]] })
          .catch((error) => {
            return error;
          });

        if (response.status == 200) {
          success++;
          result.response.success.push(mappedDelivery[j])
          //to do make logging
          Logger.info(
            `Send request ${mappedDelivery[j].event_name} lead(${mappedDelivery[j].user_data.lead_id
            }) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)} `
          );
        } else {
          failed++;
          result.response.failed.push({ ...mappedDelivery[j], facebookMessage: response.response?.data?.error });
          Logger.error(
            `⚠ Failed to request data: ${JSON.stringify(
              mappedDelivery[j]
            )} \nException : ${JSON.stringify(response.response?.data?.error)}`
          );
        }
      }
    }

    const messageLog = `All request quelified Lead is success => ${success}, is failed => ${failed}`;
    await saveTransferDelivery(deliveryFindName, lastTransfer, messageLog);
    result.message = messageLog
    Logger.debug(messageLog);
  }

  return result;
}

/**
 * Map pattrun json to facebook
 * @param {*} csvFile
 * @param {*} eventName
 */
async function mapDataForMetaBooking(csvFile, eventName) {
  try {
    const records = parse((await csvFile).toString(), {
      columns: true,
      skip_empty_lines: true,
      delimiter: "|",
    });

    if (records.length <= 0) {
      return null;
    }
    const reformat = records.map((record) => {
      // const eventTime = Object.keys();
      return {
        event_name: eventName,
        event_time: moment(Date.parse(record.booking_date)).unix(),
        action_source: "system_generated",
        user_data: {
          lead_id: Number(record.leadgen_id),
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota_crm",
        },
      };
    });

    Logger.info(`Result =>>  ${eventName}`, JSON.stringify(reformat));

    return reformat;
  } catch (error) {
    Logger.error(`⚠ Failed to map data: ${csvFile} \nException : ${error}`);
  }
}

/**
 *
 * @param {*} csvFile
 * @param {*} eventName
 * @returns
 */
async function mapDataForMetaDelivery(csvFile, eventName) {
  try {
    const records = parse((await csvFile).toString(), {
      columns: true,
      skip_empty_lines: true,
      delimiter: "|",
    });

    if (records.length <= 0) {
      return null;
    }

    const reformat = records.map((record) => {
      return {
        event_name: eventName,
        event_time: moment(Date.parse(record.delivery_date)).unix(),
        action_source: "system_generated",
        user_data: {
          lead_id: Number(record.leadgen_id),
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota_crm",
        },
      };
    });

    Logger.info(`Result =>>  ${eventName}`, reformat);

    return reformat;
  } catch (error) {
    Logger.error(
      `⚠ Failed to map data: ${csvFile} \nException : ${error.response.data}`
    );
  }
}

module.exports = { recoveryBooking, recoveryDelivery };
