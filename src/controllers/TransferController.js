const joi = require("joi");
const { runValidation } = require("../helpers/runValidation");
const { success } = require("../helpers/response");
const Logger = require("../helpers/Logger");
const c365Service = require("../services/c365Service");
const leadConversionServies = require("../services/leadConversionServies");
const { createAndUploadFile } = require('../helpers/fileSharre')

exports.getQuelifiedLead = async (req, res, next) => {
  try {
    const request = await runValidation({}, joi.object());
    const result = await leadConversionServies.getQuerifiedLead();
    await createAndUploadFile(result, 'trans_quelified_lead')

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });

    success(res, { status: "SUCCESS", result });
  } catch (error) {
    next(error);
  }
};

exports.getBookingLead = async (req, res, next) => {
  try {
    const request = await runValidation({}, joi.object());
    const result = await c365Service("booking");
    await createAndUploadFile(result, 'trans_booking_lead')

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });
    success(res, { status: "SUCCESS", result });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryLead = async (req, res, next) => {
  try {
    const request = await runValidation({}, joi.object());
    const result = await c365Service("delivery");
    await createAndUploadFile(result, 'trans_delivery_lead')

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });
    success(res, { status: "SUCCESS", result });
  } catch (error) {
    next(error);
  }
};

exports.getInitialLead = async (req, res, next) => {
  try {
    const { createdTime, leadgenId } = req.body;
    const request = await runValidation(
      { createdTime, leadgenId },
      joi.object({
        createdTime: joi.string().required(),
        leadgenId: joi.string().required(),
      })
    );
    const result = await leadConversionServies.getInitialLead(request);
    await createAndUploadFile(result, 'trans_initial_lead')


    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });
    success(res, { status: "SUCCESS", result });
  } catch (error) {
    next(error);
  }
};


