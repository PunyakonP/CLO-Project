const joi = require('joi');
const { runValidation } = require('../helpers/runValidation');
const { success } = require('../helpers/response');
const Logger = require('../helpers/Logger');

exports.getAllTransfers = async (req, res, next) => {
  try {
    const request = await runValidation({}, joi.object());
    const result = 'TCAP Api to meta.';

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });

    success(res, { status: 'SUCCESS', result });
  } catch (error) {
    next(error);
  }
};