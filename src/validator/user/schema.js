import Joi from 'joi'

const UsersPayloadSchema = Joi.object({
  username: Joi.string().max(64).required(),
  password: Joi.string().required(),
  fullname: Joi.string().max(255).required()
})

export default UsersPayloadSchema
