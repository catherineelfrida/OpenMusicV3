import pg from 'pg'
import { nanoid } from 'nanoid'
import InvariantError from '../../exceptions/InvariantError.js'
import NotFoundError from '../../exceptions/NotFoundError.js'
import AuthorizationError from '../../exceptions/AuthorizationError.js'

const { Pool } = pg

class PlaylistsService {
  constructor (collaborationsService, cacheService) {
    this._pool = new Pool()
    this._collaborationsService = collaborationsService
    this._cacheService = cacheService
  }

  async addPlaylist (name, owner) {
    const id = `playlist-${nanoid(16)}`

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Playlist failed to add. | Playlist gagal ditambahkan.')
    }

    await this._cacheService.delete(`playlist:${owner}`)
    return result.rows[0].id
  }

  async getPlaylists (userId) {
    try {
      const result = await this._cacheService.get(`playlist:${userId}`)
      const playlists = JSON.parse(result)
      return {
        cache: true,
        playlists
      }
    } catch (error) {
      const query = {
        text: `SELECT p.id, p.name, u.username
        FROM playlists p
        INNER JOIN users u
        ON p.owner = u.id
        WHERE p.owner = $1
  
        UNION
        
        SELECT p.id, p.name, u.username
        FROM collaborations c
        INNER JOIN playlists p
        ON c.playlist_id = p.id
        INNER JOIN users u
        ON p.owner = u.id
        WHERE c.user_id = $1`,
        values: [userId]
      }

      const result = await this._pool.query(query)

      await this._cacheService.set(
          `playlist:${userId}`,
          JSON.stringify(result.rows)
      )

      return {
        cache: false,
        playlists: result.rows
      }
    }
  }

  async getPlaylistById (playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Playlists not found. | Playlist tidak ditemukan.')
    }

    return result.rows[0]
  }

  async deletePlaylist (id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id, owner',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Playlist failed to delete. ID not found. | Playlist gagal dihapus. Id tidak ditemukan.')
    }

    const { owner } = result.rows[0]
    await this._cacheService.delete(`playlist:${owner}`)
  }

  async addSongToPlaylist (playlistId, songId) {
    const id = `playlist_song-${nanoid(16)}`
    const query = {
      text: 'INSERT INTO playlist_songs VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Music failed to add to playlist. | Musik gagal ditambahkan kedalam playlist.')
    }
  }

  async getPlaylistSongsById (playlistId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId)

    const queryGetPlaylist = {
      text: `SELECT p.id, p.name, u.username
      FROM playlists p
      INNER JOIN users u
      ON p.owner = u.id
      WHERE p.id = $1`,
      values: [playlistId]
    }

    const playlistResult = await this._pool.query(queryGetPlaylist)

    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlists not found. | Playlist tidak ditemukan')
    }

    const queryGetSongs = {
      text: `SELECT s.id, s.title, s.performer
      FROM songs s
      INNER JOIN playlist_songs p 
      ON p.song_id = s.id
      WHERE p.playlist_id = $1`,
      values: [playlistId]
    }
    const songsResult = await this._pool.query(queryGetSongs)

    const playlist = playlistResult.rows[0]
    const result = {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: songsResult.rows
    }

    return result
  }

  async deleteSongFromPlaylist (playlistId, songId) {
    const query = {
      text: `DELETE FROM playlist_songs 
      WHERE playlist_id = $1 AND song_id = $2
      RETURNING id`,
      values: [playlistId, songId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Music failed to remove from playlist. | Musik gagal dihapus dari playlist.')
    }
  }

  async getPlaylistActivitiesById (playlistId) {
    await this.getPlaylistById(playlistId)

    const query = {
      text: `SELECT u.username, s.title, a.action, a.time
      FROM playlist_song_activities a
      INNER JOIN songs s
      ON a.song_id = s.id
      INNER JOIN users u
      ON a.user_id = u.id
      WHERE playlist_id = $1
      ORDER BY a.time ASC`,
      values: [playlistId]
    }

    const result = await this._pool.query(query)
    return result.rows
  }

  async addActivity (playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`
    const time = new Date().toISOString()
    const query = {
      text: `INSERT INTO playlist_song_activities
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      values: [id, playlistId, songId, userId, action, time]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new InvariantError('Failed to add activity. | Gagal menambahkan activity.')
    }
  }

  async verifyPlaylistOwner (playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Playlists not found. | Playlist tidak ditemukan.')
    }

    const playlist = result.rows[0]

    if (playlist.owner !== userId) {
      throw new AuthorizationError('You do not have access to this resource. | Anda tidak memiliki akses resource ini.')
    }
  }

  async verifyPlaylistAccess (playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId)
    } catch (ownerNotFoundError) {
      if (ownerNotFoundError instanceof NotFoundError) {
        throw ownerNotFoundError
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId)
      } catch (collaboratorError) {
        throw ownerNotFoundError
      }
    }
  }
}

export default PlaylistsService
