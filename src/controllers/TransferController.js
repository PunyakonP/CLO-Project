const joi = require("joi");
const { runValidation } = require("../helpers/runValidation");
const { success } = require("../helpers/response");
const Logger = require("../helpers/Logger");
const c365Service = require("../services/c365Service");
const leadConversionServies = require("../services/leadConversionServies");

exports.getQuelifiedLead = async (req, res, next) => {
  try {
    const request = await runValidation({}, joi.object());
    const result = await leadConversionServies.getQuerifiedLead();

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
    const result = leadConversionServies.getInitialLead(request);

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });
    success(res, { status: "SUCCESS", result });
  } catch (error) {
    next(error);
  }
};


