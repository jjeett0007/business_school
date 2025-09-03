import Joi from "joi";

export const signupValidation = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    profileName: Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
  }),
};

export const loginvalidatoin = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

export const otpCodeValidation = {
  body: Joi.object().keys({
    otpCode: Joi.number().required(),
  }),
};

export const userUpdateValidation = {
  body: Joi.object()
    .keys({
      profileInfo: Joi.object().keys({
        firstName: Joi.string(),
        lastName: Joi.string(),
        displayName: Joi.string(),
        phoneNumber: Joi.string(),
      }),
      avatar: Joi.string(),
      address: Joi.object().keys({
        country: Joi.string(),
        state: Joi.string(),
        city: Joi.string(),
      }),
    })
    .min(1),
};
