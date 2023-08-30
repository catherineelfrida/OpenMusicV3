import Joi from 'joi'

const currentYear = new Date().getFullYear()

const SongsPayloadSchema = Joi.object({
  title: Joi.string().max(255).required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
  genre: Joi.string().max(128).required(),
  performer: Joi.string().max(255).required(),
  duration: Joi.number(),
  albumId: Joi.string().max(50)
})

export default SongsPayloadSchema
