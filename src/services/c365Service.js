const fs = require("fs");
const { parse } = require("csv-parse/sync");
const Logger = require("../helpers/Logger");
const moment = require("moment");
const SFTP = require("../helpers/connectSFTP");
const CacheData = require("../helpers/connectRedis");
const axios = require("axios");
const recoveryService = require("./recoveryService");
const path = require("path");
// const { HttpClient } = require("../lib");
const http = axios.create({
  baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.PIXEL_ID}`,
});

/**
 * read file data (.txt) on SFTP server
 * @param {string} eventName
 * @returns
 */
async function readFile(eventName) {

  await SFTP.setup()
  const pathDir = process.env.SFTP_PATH

  const pathNow = await SFTP.where();
  Logger.debug(`Now this path are you login: ${pathNow}`)

  const listFolder = await SFTP.getlsit(`/clo_sftp/c365/dev/current/facebook/system`);
  if (!listFolder) {
    Logger.warning(`Directory is not exist ${pathDir}, ${listFolder}`);
    return false;
  }
  Logger.info(`list foldefs ${JSON.stringify(listFolder, null, 2)}`)

  if (eventName !== "booking") {
    const delivery = await deliveryLead();
    
    await SFTP.close();
    Logger.info(`Close connection SFTP`)
    return delivery;
  }

  const booking = await bookingLead();
  await SFTP.close();
  Logger.info(`Close connection SFTP`)
  return booking
}

// Booking lead
/**
 * 
 * @returns 
 */
async function bookingLead() {
  try {
    const dataListBooking = await findAllBooking()
    const currentDete = getDateFromNow("", 1)
    const lastTransfer = await historyTransfer({
      key: "C365_HistoryBooking",
      field: "",
      fieldDel: "",
      value: "",
      type: "lasted",
    });
    const checkDate = determineCheckDate(lastTransfer, currentDete);
    if (checkDate < currentDete) {
      Logger.debug(`Process recovery starting`);
      const resultRecovery = await recoveryService.recoveryBooking();
      if (resultRecovery == false) {
        Logger.error("Error recovery processing");
        return "Error recovery processing"
      }
      Logger.info(`Recovery successed`);
      return resultRecovery;
    }
    const bookingFindName = findMatchingBooking(dataListBooking, checkDate);

    if (!bookingFindName) {
      Logger.warning(`Booking file name not found in SFTP at ${getCurrentTimestamp()}`);
      return `Booking file name not found in SFTP at ${getCurrentTimestamp()}`
    }

    const fileName = await downloadBookFile(bookingFindName)
    if (!fileName) {
      Logger.warning("Unable to read data from SFTP")
      return 'Unable to read data from SFTP'
    }


    const mappedBookings = await mapDataForMetaBooking(fileName, "booking")
    if (!mappedBookings || mappedBookings.length <= 0) {
      const value = `This booking: ${fileName} is emtry data at: ${moment().format('DD-MM-YYYY HH:mm:ss')}`
      await saveTransferRecord(fileName, lastTransfer, value)
      return value
    }

    const result = await processBookingRequests(mappedBookings)
    await saveTransferRecord(fileName, lastTransfer, result.message)
    Logger.info(`result message ${result.message}`)
    return result

  } catch (error) {
    Logger.error(`Error during booking lead process: ${error}`);
    return false;
  }
}

async function findAllBooking() {
  const path = `${process.env.SFTP_PATH}/trans_clo_booking_lead/`
  const dataListBooking = await SFTP.getlsit(path);
  Logger.info(`list data: ${dataListBooking.length} items`)
  return dataListBooking;
}

async function downloadBookFile(fileName) {
  const remotePath = `${process.env.SFTP_PATH}/trans_clo_booking_lead/${fileName}`;
  const fileContent = await SFTP.dowmloadFile(remotePath, fileName);
  if (!fileContent) {
    Logger.warning(`Download file: ${fileName} failed`)
    return fileContent
  }
  Logger.info(`Download file: ${fileName} successed`)
  return fileName;
}

function getDateFromNow(baseDate, dayOffset) {
  if (baseDate) return moment(baseDate).subtract(dayOffset, 'days').format("DDMMYYYY").toString();
  return moment().subtract(dayOffset, 'days').format("DDMMYYYY").toString();;
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

  return null
}

function getCurrentTimestamp() {
  return moment().format("DD-MM-YYYY HH:mm:ss");
}

function parseTransferDate(dateStr) {
  return [
    parseInt(dateStr.substr(0, 2), 10),
    parseInt(dateStr.substr(2, 2), 10),
    parseInt(dateStr.substr(4, 4), 10)
  ]
}

function determineCheckDate(lastTransfer, fallbackDate) {
  if (!lastTransfer) {
    Logger.info("No previous transfer found. Defaulting to fallback date.")
    return fallbackDate;
  }

  const transferDateMatch = Object.keys(lastTransfer).toString().match(/_(\d{8})\.txt$/)
  if (!transferDateMatch) return fallbackDate;

  const [day, month, year] = parseTransferDate(transferDateMatch[1])
  const lastTransferDate = new Date(year, month - 1, day);
  const nextDate = moment(lastTransferDate).add(1, "days").format("DDMMYYYY")

  return nextDate;
}

async function processBookingRequests(mappedBookings) {
  const result = {
    message: "",
    response: {
      success: [],
      failed: []
    }
  }
  const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
  let success = 0;
  let failed = 0;

  for (const booking of mappedBookings) {
    const response = await sendBookingRequest(booking, queryParams)
    if (response.status == 200) {
      success++;
      result.response.success.push(booking);
      Logger.info(`Send request ${booking.event_name} lead(${booking.user_data.lead_id}) at ${getCurrentTimestamp()}`);
    } else {
      failed++;
      result.response.failed.push(booking);
      Logger.error(`Failed to request data: ${JSON.stringify(booking)} \nException : ${JSON.stringify(response.response.data)}`);
    }
  }

  const message = `All request quelified Lead is success => ${success}, is failed => ${failed}`
  result.message = message;

  return result
}

async function sendBookingRequest(booking, queryParams) {
  const url = `/events${queryParams}`;
  return http.post(url, { data: [booking] }).catch((error) => error);
}

async function saveTransferRecord(fildName, lastTransfer, value) {
  const newRecord = {
    key: "C365_HistoryBooking",
    field: fildName,
    fieldDel: Object.keys(lastTransfer).join(''),
    value,
    type: "new",
  };
  await historyTransfer(newRecord);
}

/**
 * History status transfer C365
 * @param {{key: string; field: string; value: string; type: 'lasted' | 'new'}} data
 * @returns {Promise<{lastedData: string } | {newHistory: string}>}
 */
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
    Logger.warning("Duplicate key history");
    return;
  }

  const newHistory = await CacheData.setData(key, field, value);

  if (!newHistory) {
    Logger.error(`Failed to record history: ${field} at: ${getCurrentTimestamp()}`);
    return false;
  }

  if (fieldDel) {
    await CacheData.cleanData(key, fieldDel);
  }

  if (!newHistory) {
    Logger.error(`Failed to save the data`);
    return newHistory;
  }
  Logger.info(`New history is ${field}`);
  return true;
}

// Delivery lead

async function findAllDelivery() {
  const path = `${process.env.SFTP_PATH}/trans_clo_delivered_lead`
  const dataListBooking = await SFTP.getlsit(path);
  Logger.info(`list data: ${dataListBooking.length} items`)
  return dataListBooking;
}

async function downloadDeliveryFile(fileName) {
  const remotePath = `${process.env.SFTP_PATH}/trans_clo_delivered_lead/${fileName}`;
  const fileContent = await SFTP.dowmloadFile(remotePath, fileName);
  if (!fileContent) {
    Logger.warning(`Download file: ${fileName} failed`)
    return fileContent
  }

  Logger.info(`Download file: ${fileName} successed`)
  return fileName;
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

  return null
}

async function processDeliveryRequests(mappedDeliverys) {
  const result = {
    message: "",
    response: {
      success: [],
      failed: []
    }
  }
  const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
  let success = 0;
  let failed = 0;

  for (const delivery of mappedDeliverys) {
    const response = await sendDeliveryRequest(delivery, queryParams)
    if (response.status == 200) {
      success++;
      result.response.success.push(delivery)
      Logger.info(`Send request ${delivery.event_name} lead(${delivery.user_data.lead_id}) at ${getCurrentTimestamp()}`);
    } else {
      failed++;
      result.response.failed.push(delivery)
      Logger.error(`Failed to request data: ${JSON.stringify(delivery)} \nException : ${JSON.stringify(response.response.data)}`);
    }
  }

  const message = `All request quelified Lead is success => ${success}, is failed => ${failed}`
  result.message = message;
  return result
}

async function sendDeliveryRequest(delivery, queryParams) {
  const url = `/events${queryParams}`;
  return http.post(url, { data: [delivery] }).catch((error) => error);
}

async function saveTransferDelivery(fildName, lastTransfer, value) {
  const newRecord = {
    key: "C365_HistoryDelivery",
    field: fildName,
    fieldDel: Object.keys(lastTransfer).join(''),
    value,
    type: "new",
  };
  await historyTransfer(newRecord);
}


/**
 * @returns {Promise<>}
 */
async function deliveryLead() {
  try {
    const dataListDelivery = await findAllDelivery()
    const currentDete = getDateFromNow("", 1)
    const lastTransfer = await historyTransfer({
      key: "C365_HistoryDelivery",
      field: "",
      fieldDel: "",
      value: "",
      type: "lasted",
    });

    const checkDate = determineCheckDate(lastTransfer, currentDete);
    if (checkDate < currentDete) {
      Logger.debug(`Process recovery starting`);
      const resultRecovery = await recoveryService.recoveryDelivery();
      if (resultRecovery == false) {
        Logger.error("Error recovery processing");
      }
      Logger.info(`Recovery successed`);
      return resultRecovery;
    }
    const deliveryFindName = findMatchingDelivery(dataListDelivery, checkDate);

    if (!deliveryFindName) {
      Logger.warning(`Delivery file name not found in SFTP at ${getCurrentTimestamp()}`);
      return `Delivery file name not found in SFTP at ${getCurrentTimestamp()}`
    }

    const fileName = await downloadDeliveryFile(deliveryFindName)
    if (!fileName) {
      Logger.warning("Unable to read data from SFTP")
      return "Unable to read data from SFTP"
    }

    const mappedDeliverys = await mapDataForMetaDelivery(fileName, "delivery")
    if (!mappedDeliverys || mappedDeliverys.length <= 0) {
      const value = `This delivery: ${fileName} is emtry data at: ${moment().format('DD-MM-YYYY HH:mm:ss')}`
      await saveTransferDelivery(fileName, lastTransfer, value)
      return value
    }

    const result = await processDeliveryRequests(mappedDeliverys)
    await saveTransferDelivery(fileName, lastTransfer, result.message)
    Logger.info(`result message: ${result.message}`)
    return result
  } catch (error) {
    Logger.error(`Error during delivery lead process: ${error}`);
    return false;
  }
}

/**
 * Map pattrun json to facebook
 * @param {*} csvFileName
 * @param {*} eventName
 */
async function mapDataForMetaBooking(csvFileName, eventName) {
  try {
    const localPathFile = path.join(__dirname, '..', `/assets/${csvFileName}`)
    const fileContent = await fs.readFileSync(localPathFile, 'utf8');
    await fs.unlinkSync(localPathFile)
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: "|",
    });

    if (records.length <= 0) {

      return null;
    }
    const reformat = await records.map((record) => {
      // const eventTime = Object.keys();
      return {
        event_name: eventName,
        event_time: moment(Date.parse(record.booking_date)).unix(),
        action_source: "system_generated",
        user_data: {
          lead_id: record.leadgen_id,
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota crm",
        },
      };
    });

    Logger.info(`Result =>>  ${eventName}`, reformat);
    return reformat;
  } catch (error) {
    Logger.error(`⚠ Failed to map data: ${csvFileName} \nException : ${error}`);
  }
}

async function mapDataForMetaDelivery(csvFileName, eventName) {
  try {

    const localPathFile = path.join(__dirname, '..', `/assets/${csvFileName}`)
    const fileContent = await fs.readFileSync(localPathFile, 'utf8')
    await fs.unlinkSync(localPathFile)
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: "|",
    });

    if (records.length <= 0) {
      return null;
    }

    const reformat = await records.map((record) => {
      return {
        event_name: eventName,
        event_time: moment(Date.parse(record.delivery_date)).unix(),
        action_source: "system_generated",
        user_data: {
          lead_id: record.leadgen_id,
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota crm",
        },
      };
    });

    Logger.info(`Result =>>  ${eventName}`, reformat);

    return reformat;
  } catch (error) {
    Logger.error(
      `⚠ Failed to map data: ${csvFileName} \nException : ${error}`
    );
  }
}

module.exports = readFile;
