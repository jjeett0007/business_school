import Joi from "joi";

const chatCreateValidation = {
  body: Joi.object().keys({
    sessionId: Joi.string().required(),
    content: Joi.string().required(),
  }),
};

const sessionIdParamsValidation = {
  params: Joi.object().keys({
    sessionId: Joi.string().required(),
  }),
};

export { chatCreateValidation, sessionIdParamsValidation };
