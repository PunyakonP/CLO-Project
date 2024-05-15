const MssqlConnection = require("../helpers/MssqlConnection");
const moment = require("moment");
const Logger = require("../helpers/Logger");
const CacheData = require("../helpers/connectRedis");
const axios = require("axios");
const http = axios.create({
  baseURL: `${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.APP_ID}`,
});

/**
 * get data
 * @returns {Promise}
 */
async function getQuerifiedLead() {
  let startDate = moment()
    .subtract(1, "days")
    .format(`YYYY-MM-DD 00:00:00.000`);
  let endDate = moment().subtract(1, "days").format(`YYYY-MM-DD 23:59:59.999`);
  const result = await MssqlConnection.executeQuery(
    `SELECT Lead_id, SendDate
      FROM TempTarget
      WHERE SendDate between '${startDate}' and '${endDate}'
      order by ID desc`,
    [{ String }]
  );

  if (!result || result.recordset.length <= 0) {
    Logger.debug(
      `This date: ${new Date().toLocaleDateString()} don't have data. Result: ${result.recordset.length
      }`
    );
    return;
  }

  Logger.info(`QuerifiedLead count: ${result.recordset.length}`);

  const mapQuelifiedLead = await mapDataForMeta("qualified", result.recordset);

  let success = 0;
  let failed = 0;
  for (i = 0; i < mapQuelifiedLead.length; i++) {
    const url = `/events${queryParams}`;

    const response = await http
      .post(url, { data: [mapQuelifiedLead[i]] })
      .catch((error) => {
        return error;
      });

    if (response.status == 200) {
      success++;
      //to do make logging
      Logger.info(`Send request ${mapQuelifiedLead[i].event_name} lead(${mapQuelifiedLead[i].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
    } 
    else {
      failed++;
      Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapQuelifiedLead[i])} \nException : ${JSON.stringify(response.response.data)}`);
    }
    const message = `All request quelified Lead is success${success}, is failed${failed}`
    Logger.debug(message);

    const checkDuplicate = await CacheData.getData("Lead_Quelified", `${leadId}`);
    if (checkDuplicate) {
      Logger.warning(`This leadi_id: ${leadId} is exist in cached`);
    } 
    else {

      const recoveryData = await CacheData.setData("Lead_Quelified", `${leadId}`, JSON.stringify(mapRawLead.data[0]));

      if (!recoveryData) {
        Logger.error(`Failed to insert Cashe data for: ${leadId}`)
      }
    }

    Logger.info(`Created raw lead: ${leadId} to save cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
  }
}

/**
 *
 * @param { } data
 * @returns
 */
async function getInitialLead(data) {
  const { createdTime, leadgenId } = data;
  if (!data) {
    Logger.warning(`The parameter data is required`);
    return;
  }

  const mapRawLead = {
    data: [
      {
        event_name: "qualified",
        event_time: createdTime,
        action_source: "system_generated",
        user_data: {
          lead_id: leadgenId,
        },
        custom_data: {
          event_source: "crm",
          lead_event_source: "toyota_crm",
        },
      },
    ],
  };

  Logger.info('Map data from webhook', JSON.stringify(mapRawLead));

  const queryParams = `?access_token=${process.env.ACCESS_TOKEN_FACEBOOK}`;

  const response = await http
    .post(`/events${queryParams}`, JSON.stringify(mapRawLead))
    .catch((error) => {
      return error;
    });

  if (response.status == 200) {
    Logger.info(
      `Send request ${mapRawLead.data[0].event_name} lead(${mapRawLead.data[0].user_data.lead_id}) at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
  } 
  else {
    Logger.error(`⚠ Failed to request data: ${JSON.stringify(mapRawLead.data[0])} \nException : ${JSON.stringify(response.response.data)}`);
    //to do make cashe Redis
    const leadId = mapRawLead.data[0].user_data.lead_id;
      Logger.info(`Initial lead data: ${leadId}`);
    const checkDuplicate = await CacheData.getData("Lead_Initial", `${leadId}`);
    if (checkDuplicate) {
      Logger.warning(`This leadi_id: ${leadId} is exist in cached`);
    } 
    else {

      const recoveryData = await CacheData.setData("Lead_Initial", `${leadId}`, JSON.stringify(mapRawLead.data[0]));

      if (!recoveryData) {
        Logger.error(`Failed to insert Cashe data for: ${leadId}`)
      }
    }

    Logger.info(`Created raw lead: ${leadId} to save cache successfully at ${moment().format(`YYYY-MM-DD HH:mm:ss.SSS`)}`);
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
        action_source: "system_generated",
        user_data: {
          lead_id: record.Lead_id,
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
