import Joi from 'joi'

const PlaylistsPayloadSchema = Joi.object({
  name: Joi.string().max(255).required()
})

const SongsPlaylistPayloadSchema = Joi.object({
  songId: Joi.string().max(50).required()
})

export {
  PlaylistsPayloadSchema,
  SongsPlaylistPayloadSchema
}
