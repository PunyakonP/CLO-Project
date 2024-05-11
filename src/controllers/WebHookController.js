const { success } = require("../helpers/response");
const httpStatus = require("http-status");
const Logger = require("../helpers/Logger");
const axios = require("axios");
const soap = require("soap");

exports.verifyRequestSignature = async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode !== "subscribe" && token !== process.env.APP_FACEBOOK_SECRET) {
    return res.status(httpStatus.FORBIDDEN).send("Permission denied.");
  }

  return res.send(challenge);
};

exports.webHookFacebook = async (req, res, next) => {
  try {
    const { body } = req;

    const [entry] = body.entry;
    const [change] = entry.changes;
    const { leadgen_id } = change.value;

    Logger.info(
      `Successfully received from facebook leadgen_id: ${leadgen_id}`,
      { leadgenId: leadgen_id }
    );

    // Request API Graph Facebook
    const param = `?access_token=${process.env.APP_FACEBOOK_ACCESS_TOKEN}`;
    const result = await axios.get(
      `${process.env.GRAPH_FACEBOOK_API_URL}/${leadgen_id}${param}`
    );

    const { created_time, id } = result.data;

    // HTTP Request
    await axios.post(`${process.env.TCAP_API_URL}/api/transfers/initial`, {
      createdTime: created_time,
      leadgenId: id,
    });

    Logger.info("Successfully request HTTP API TCAP", {
      createdTime: created_time,
      leadgenId: id,
    });

    // SOAP Request
    entry.changes.forEach((change) => {
      const ad_id = change.value.ad_id || 1;
      const ad_name = change.value.ad_name || "";
      const form_id = change.value.form_id || "";
      const page_id = change.value.page_id || "";
      const adgroup_id = change.value.adgroup_id || "";

      const params = {
        Authen: "DMAPTHAILAND",
        ad_id,
        ad_name,
        form_id,
        page_id,
        adgroup_id,
        json: JSON.stringify(result.data),
      };

      soapRequest(params);
    });

    success(res, { status: "SUCCESS", result: {} });
  } catch (error) {
    next(error);
  }
};

/**
 * Soap Request
 * @param {any} params
 */
function soapRequest(params) {
  soap.createClient(process.env.TCAP_API_SOAP_URL, function (err, client) {
    if (err) {
      Logger.error("Error request SOAP API", { err });
      return;
    }

    client.MapJason(params, function (err, result) {
      if (err) {
        Logger.error("Error request SOAP API", { err });
        return;
      }

      Logger.info("Successfully request SOAP API", { result });
    });
  });
}
