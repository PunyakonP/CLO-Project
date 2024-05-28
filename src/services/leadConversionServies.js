const MssqlConnection = require("../helpers/MssqlConnection");
const moment = require("moment");
moment.defaultFormat = moment.ISO_8601
const Logger = require("../helpers/Logger");
const CacheData = require("../helpers/connectRedis");
const axios = require("axios");
const http = axios.create({
  baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.PIXEL_ID}`,
});

/**
 * get data
 * @returns {Promise}
 */
async function getQuerifiedLead() {
  let startDate;
  let endDate;

  if (process.env.INITIAL_DATA == 'Y') {
    startDate = moment(`${process.env.INITIAL_START}`).subtract(1, "days").add(7, 'hours').format(`YYYY-MM-DD 00:00:00.000`);
    endDate = moment(`${process.env.INITIAL_END}`).subtract(1, "days").add(7, 'hours').format(`YYYY-MM-DD 23:59:59.999`);
  } else {
    startDate = moment().subtract(1, "days").add(7, 'hours').format(`YYYY-MM-DD 00:00:00.000`);
    endDate = moment().subtract(1, "days").add(7, 'hours').format(`YYYY-MM-DD 23:59:59.999`);
  }
  const resultForResponse = {
    message: "",
    response: {
      success: [],
      failed: []
    }
  }

  const result = await MssqlConnection.executeQuery(
    `SELECT Lead_id, SendDate
      FROM TempTarget
      WHERE SendDate between '${startDate}' and '${endDate}'
      order by ID desc`,
    [{ String }]
  );

  if (!result || result.recordset.length <= 0) {
    const message = `This date: ${new Date().toLocaleDateString()} don't have data. Result: ${result.recordset.length}`
    Logger.debug(message);
    resultForResponse.message = message
    return resultForResponse;
  }
  Logger.info(`QualifiedLead count: ${result.recordset.length}`);

  const mapQuelifiedLead = await mapDataForMeta("qualified", result.recordset);
  let success = 0;
  let failed = 0;

  for (i = 0; i < mapQuelifiedLead.length; i++) {

    const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
    const url = `/events${queryParams}`;

    const response = await http
      .post(url, { data: [mapQuelifiedLead[i]] })
      .catch((error) => {
        return error;
      });

    if (response.status == 200) {
      success++;
      resultForResponse.response.success.push(mapQuelifiedLead[i])
      //to do make logging
      Logger.info(`Send request ${mapQuelifiedLead[i].event_name} lead(${mapQuelifiedLead[i].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
    }
    else {
      failed++;
      resultForResponse.response.failed.push({ ...mapQuelifiedLead[i], facebookMessage: response.response?.data?.error })
      Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapQuelifiedLead[i])} \nException : ${JSON.stringify(response.response?.data?.error)}`);

      const checkDuplicate = await CacheData.getData("Lead_Qualified", `${mapQuelifiedLead[i].user_data.lead_id}`);
      if (checkDuplicate) {
        Logger.warning(`This leadi_id: ${mapQuelifiedLead[i].user_data.lead_id} is exist in cached`);
      }
      else {
        const recoveryData = await CacheData.setData("Lead_Qualified", `${moment().format('YYYY-MM-DDTHH:mm:ss')}`, JSON.stringify(mapQuelifiedLead[0]));

        if (!recoveryData) {
          Logger.error(`Failed to insert Cashe data for: ${mapQuelifiedLead[i].user_data.lead_id}`)
        }
      }

      Logger.info(`Created raw lead: ${mapQuelifiedLead[i].user_data.lead_id} to save cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
    }

  }
  const message = `All request quelified Lead is success => ${success}, is failed => ${failed}`
  resultForResponse.message = message;
  Logger.debug(message);
  return resultForResponse;
}

/**
 *
 * @param { } data
 * @returns
 */
async function getInitialLead(data) {
  const { createdTime, leadgenId } = data;
  Logger.info(`raw data from webhook ${createdTime} , ${leadgenId}`)
  if (!data) {
    Logger.warning(`The parameter data is required`);
    return;
  }

  const checkCache = await CacheData.getAll('Lead_Initial');
  if (Object.values(checkCache).join('') != '') {
    const reSendData = await recoveryInitial(checkCache);

  }

  const mapRawLead = {
    data: [
      {
        event_name: "initial_lead",
        event_time: moment(createdTime).unix(),
        action_source: "system_generated",
        user_data: {
          lead_id: Number(leadgenId),
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota_crm",
        },
      },
    ],
  };

  const result = {
    message: "",
    response: {
      success: [],
      failed: []
    }
  }

  Logger.info(`Map data from webhook, \n${JSON.stringify(mapRawLead, null, 2)}`);

  const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;
  const response = await http
    .post(`/events${queryParams}`, mapRawLead)
    .catch((error) => {
      return error;
    });

  if (response.status == 200) {
    const messageResponse = `Send request ${mapRawLead.data[0].event_name} lead(${mapRawLead.data[0].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`
    result.message = messageResponse
    result.response.success.push(mapRawLead.data[0])
    Logger.info(messageResponse);
  }
  else {
    const messageResponse = `⚠ Failed to request data: ${JSON.stringify(mapRawLead.data[0], null, 2)} `
    const facebookResponse = `${JSON.stringify(response.response?.data?.error, null, 2)}`
    result.message = messageResponse
    result.response.failed.push({ ...mapRawLead.data[0], facebookMessage: response.response?.data?.error });
    Logger.error(`${messageResponse} \nException: ${facebookResponse}`);
    //to do make cashe Redis
    const leadId = mapRawLead.data[0].user_data.lead_id;
    Logger.info(`Initial lead data: ${leadId}`);
    const checkDuplicate = await CacheData.getData("Lead_Initial", `${leadId}`);
    if (checkDuplicate) {
      Logger.warning(`This leadi_id: ${leadId} is exist in cached`);
    }
    else {

      const recoveryData = await CacheData.setData("Lead_Initial", `${leadId}_${moment().format('YYYYMMDDHHmmss')}`, JSON.stringify(mapRawLead.data[0]));

      if (!recoveryData) {
        Logger.error(`Failed to insert Cashe data for: ${leadId}`)
      }
    }

    Logger.info(`Created raw lead: ${leadId} to save cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
  }

  return result
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
        action_source: "system_generated",
        user_data: {
          lead_id: Number(record.Lead_id),
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
    Logger.error(`⚠ Failed to map data: ${data} \nException : ${error}`);
  }
}


module.exports = { getQuerifiedLead, getInitialLead };
