import { nanoid } from 'nanoid'
import pg from 'pg'
import InvariantError from '../../exceptions/InvariantError.js'
import NotFoundError from '../../exceptions/NotFoundError.js'

const { Pool } = pg

class AlbumsService {
  constructor (cacheService) {
    this._pool = new Pool()
    this._cacheService = cacheService
  }

  async addAlbum ({ name, year }) {
    const id = `album-${nanoid(16)}`

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year]
    }

    const result = await this._pool.query(query)

    if (!result.rows[0].id) {
      throw new InvariantError('Album failed to add. | Album gagal ditambahkan.')
    }

    return result.rows[0].id
  }

  async getAlbumById (id) {
    const queryGetAlbum = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id]
    }

    const queryGetSongs = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [id]
    }

    const albumResult = await this._pool.query(queryGetAlbum)
    const songsResult = await this._pool.query(queryGetSongs)

    if (!albumResult.rows.length) {
      throw new NotFoundError('Albums not found. | Album tidak ditemukan.')
    }

    const album = albumResult.rows[0]
    const result = {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover,
      songs: songsResult.rows
    }

    return result
  }

  async editAlbumById (id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Failed to update album. ID not found. | Gagal memperbarui album. Id tidak ditemukan.')
    }
  }

  async deleteAlbumById (id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Album failed to delete. ID not found. | Album gagal dihapus. Id tidak ditemukan.')
    }
  }

  async editAlbumCoverById (id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Failed to update album. ID not found. | Gagal memperbarui album. Id tidak ditemukan.')
    }
  }

  async addAlbumLikeById (albumId, userId) {
    const id = `like-${nanoid(16)}`

    const queryCheckLike = {
      text: `SELECT id FROM user_album_likes 
      WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId]
    }

    const resultCheck = await this._pool.query(queryCheckLike)

    if (!resultCheck.rows.length) {
      const query = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId]
      }

      const result = await this._pool.query(query)

      if (!result.rows.length) {
        throw new InvariantError('Failed to add likes. ID not found. | Gagal menambahkan like. Id tidak ditemukan.')
      }
    } else {
      throw new InvariantError('Failed to add likes. You have already liked this album. | Gagal menambahkan like. Anda sudah memberikan like pada album ini.')
    }

    await this._cacheService.delete(`album-likes:${albumId}`)
  }

  async deleteAlbumLikeById (userId, albumId) {
    const query = {
      text: `DELETE FROM user_album_likes 
      WHERE user_id = $1 AND album_id = $2 
      RETURNING id`,
      values: [userId, albumId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Failed to delete likes. | Gagal menghapus like.')
    }
    await this._cacheService.delete(`album-likes:${albumId}`)
  }

  async getAlbumLikesById (albumId) {
    try {
      const result = await this._cacheService.get(`album-likes:${albumId}`)
      const likes = parseInt(result)
      return {
        cache: true,
        likes
      }
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId]
      }

      const result = await this._pool.query(query)

      if (!result.rows.length) {
        throw new NotFoundError('Failed to fetch likes. | Gagal mengambil like.')
      }

      const likes = parseInt(result.rows[0].count)

      await this._cacheService.set(`album-likes:${albumId}`, likes)
      return {
        cache: false,
        likes
      }
    }
  }
}

export default AlbumsService
