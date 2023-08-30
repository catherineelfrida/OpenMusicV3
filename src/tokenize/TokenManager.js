import Jwt from '@hapi/jwt'
import InvariantError from '../exceptions/InvariantError.js'
import config from '../utils/config.js'

const TokenManager = {
  generateAccessToken (payload) {
    return Jwt.token.generate(payload, config.jwt.accesskey)
  },

  generateRefreshToken (payload) {
    return Jwt.token.generate(payload, config.jwt.refreshkey)
  },

  verifyRefreshToken (refreshToken) {
    try {
      const artifacts = Jwt.token.decode(refreshToken)
      Jwt.token.verifySignature(artifacts, config.jwt.refreshkey)

      const { payload } = artifacts.decoded
      return payload
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid')
    }
  }
}

export default TokenManager
