const { success } = require("../helpers/response");
const Logger = require("../helpers/Logger");
const axios = require("axios");
const soap = require("soap");

exports.verifyRequestSignature = async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.APP_FACEBOOK_SECRET) {
    return res.send(challenge);
  }

  return res.status(403).send("Permission denied.");
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

    try {
      const param = `?access_token=${process.env.APP_FACEBOOK_ACCESS_TOKEN}`;
      const result = await axios.get(
        `${process.env.TCAP_API_URL}/${leadgen_id}${param}`
      );

      const { created_time, id } = result.data;

      const payloadOfTCAP = {
        createdTime: created_time,
        leadgenId: id,
      };

      // HTTP Request
      // await axios.post(
      //   `${process.env.TCAP_API_URL}/api/transfers/initial`,
      //   payloadOfTCAP
      // );

      // SOAP Request
      // let response = "";
      // entry.changed.forEach((change) => {
      //   const ad_id = change.value.ad_id || 1;
      //   const ad_name = change.value.ad_name || "";
      //   const form_id = change.value.form_id || "";
      //   const page_id = change.value.page_id || "";
      //   const adgroup_id = change.value.adgroup_id || "";

      //   const params = {
      //     Authen: "DMAPTHAILAND",
      //     ad_id,
      //     ad_name,
      //     form_id,
      //     page_id,
      //     adgroup_id,
      //     json: response,
      //   };

      //   soap.createClient(url, function (err, client) {
      //     if (err) {
      //       console.error("err: 1", err);
      //       return;
      //     }

      //     client.Add(params, function (err, result) {
      //       if (err) {
      //         console.error("err: 2", err);
      //         return;
      //       }
      //       console.log("result: ", result);
      //     });
      //   });
      // });

      Logger.info("Successfully request API");
      success(res, { status: "SUCCESS", result: {} });
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      // console.log(JSON.stringify(error.response, null, 2));
    }
  } catch (error) {
    next(error);
  }
};
