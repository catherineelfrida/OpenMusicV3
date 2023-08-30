import InvariantError from '../../exceptions/InvariantError.js'
import CollaborationsPayloadSchema from './schema.js'

const CollaborationsValidator = {
  validateCollaborationPayload: (payload) => {
    const validationResult = CollaborationsPayloadSchema.validate(payload)
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message)
    }
  }
}

export default CollaborationsValidator
