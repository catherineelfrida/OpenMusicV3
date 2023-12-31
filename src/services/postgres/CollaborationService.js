import pg from 'pg'
import { nanoid } from 'nanoid'
import InvariantError from '../../exceptions/InvariantError.js'
import AuthorizationError from '../../exceptions/AuthorizationError.js'

const { Pool } = pg

class CollaborationsService {
  constructor (cacheService) {
    this._pool = new Pool()
    this._cacheService = cacheService
  }

  async addCollaboration (playlistId, userId) {
    const id = `collaboration-${nanoid(16)}`

    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Collaboration failed to add. | Kolaborasi gagal ditambahkan.')
    }

    await this._cacheService.delete(`playlist:${userId}`)
    return result.rows[0].id
  }

  async deleteCollaboration (playlistId, userId) {
    const query = {
      text: `DELETE FROM collaborations
      WHERE playlist_id = $1 AND user_id = $2
      RETURNING id`,
      values: [playlistId, userId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Collaboration failed to delete. | Kolaborasi gagal dihapus.')
    }

    await this._cacheService.delete(`playlist:${userId}`)
  }

  async verifyCollaborator (playlistId, userId) {
    const query = {
      text: `SELECT * FROM collaborations
      WHERE playlist_id = $1 AND user_id = $2`,
      values: [playlistId, userId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new AuthorizationError('Collaboration failed to verify. | Kolaborasi gagal diverifikasi.')
    }
  }
}

export default CollaborationsService
