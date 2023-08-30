import Joi from 'joi'

const CollaborationsPayloadSchema = Joi.object({
  playlistId: Joi.string().max(50).required(),
  userId: Joi.string().max(50).required()
})

export default CollaborationsPayloadSchema
