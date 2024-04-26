const joi = require('joi');
const { ValidationError } = require('../errors');

exports.runValidation = async (args, schema) => {
  try {
    return await schema.validateAsync(args);
  } catch (error) {
    if (error instanceof joi.ValidationError) {
      throw new ValidationError(error.message);
    }

    throw error;
  }
}