import Joi from 'joi'

const PostAuthenticationsPayloadSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

const PutAuthenticationsPayloadSchema = Joi.object({
  refreshToken: Joi.string().required()
})

const DeleteAuthenticationsPayloadSchema = Joi.object({
  refreshToken: Joi.string().required()
})

export {
  PostAuthenticationsPayloadSchema,
  PutAuthenticationsPayloadSchema,
  DeleteAuthenticationsPayloadSchema
}
