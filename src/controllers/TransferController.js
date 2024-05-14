const joi = require('joi');
const { runValidation } = require('../helpers/runValidation');
const { success } = require('../helpers/response');
const Logger = require('../helpers/Logger');
const c365Service = require('../services/c365Service')
const leadConversionServies = require('../services/leadConversionServies')

exports.getAllTransfers = async (req, res, next) => {
  try {
    //console.log('req', req.route.path);
    const request = await runValidation({}, joi.object());
    const result = await leadConversionServies.getQuerifiedLead();
    // switch (req.route.path) {
    //   case '/quelified':
    //     const result = await leadConversionServies.getQuerifiedLead();
    //     if (!result) {
    //       success(res, { status: 'Failed', result });
    //     }
    //     // console.log(result);
    //     break;

    //   case '/booking':
    //     await c365Service();
    //     break;

    //   case '/delivery':
    //     await c365Service();
    //     break;

    //   case '/rawlead':
    //     await leadConversionServies.getRawLead(req.body);
    //     break;
    // }
    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });

    // if (result.recordset.length <= 0) {
    //   success(res, { status: 'SUCCESS', result: 'Data is not updated' });
    //   return;
    // }
    success(res, { status: 'SUCCESS', result });
    console.log(result.data);
    //  res.send(result.data);
  } catch (error) {
    next(error);
  }
};

exports.getBookingLead = async (req, res, next) => {
  try {

    const request = await runValidation({}, joi.object());
    const result = c365Service();

    Logger.info(`Successfully get API identity: ${result}`, {
      result,
      request,
    });
    success(res, { status: 'SUCCESS', result });

  } catch (error) {
    next(error)
  }
}