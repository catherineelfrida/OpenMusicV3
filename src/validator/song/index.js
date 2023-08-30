import InvariantError from '../../exceptions/InvariantError.js'
import SongsPayloadSchema from './schema.js'

const SongsValidator = {
  validateSongPayload: (payload) => {
    const validationResult = SongsPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  }
}

export default SongsValidator
