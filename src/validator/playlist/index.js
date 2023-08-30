import InvariantError from '../../exceptions/InvariantError.js'
import {
  PlaylistsPayloadSchema,
  SongsPlaylistPayloadSchema
} from './schema.js'

const PlaylistsValidator = {
  validatePlaylistPayload: (payload) => {
    const validationResult = PlaylistsPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  },

  validateSongPlaylistPayload: (payload) => {
    const validationResult = SongsPlaylistPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  }
}

export default PlaylistsValidator
