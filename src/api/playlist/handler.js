import autoBind from 'auto-bind'

class PlaylistsHandler {
  constructor (playlistsService, songsService, validator) {
    this._playlistsService = playlistsService
    this._songsService = songsService
    this._validator = validator

    autoBind(this)
  }

  async postPlaylistHandler (request, h) {
    this._validator.validatePlaylistPayload(request.payload)
    const { name } = request.payload
    const { id: credentialId } = request.auth.credentials
    const playlistId =
      await this._playlistsService.addPlaylist(name, credentialId)
    const response = h.response({
      status: 'success',
      data: {
        playlistId
      }
    })
    response.code(201)
    return response
  }

  async getPlaylistsHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const { cache, playlists } =
      await this._playlistsService.getPlaylists(credentialId)
    const response = h.response({
      status: 'success',
      data: {
        playlists
      }
    })
    if (cache) response.header('X-Data-Source', 'cache')
    return response
  }

  async deletePlaylistByIdHandler (request, h) {
    const { id } = request.params
    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistOwner(id, credentialId)
    await this._playlistsService.deletePlaylist(id)
    return {
      status: 'success',
      message: 'Playlist deleted successfully. | Playlist berhasil dihapus.'
    }
  }

  async postPlaylistSongByIdHandler (request, h) {
    this._validator.validateSongPlaylistPayload(request.payload)
    const { songId } = request.payload
    const { id: playlistId } = request.params
    const { id: credentialId } = request.auth.credentials
    await this._songsService.getSongById(songId)
    await this._playlistsService.verifyPlaylistAccess(
      playlistId, credentialId
    )
    await this._playlistsService.addSongToPlaylist(playlistId, songId)
    await this._playlistsService.addActivity(
      playlistId, songId, credentialId, 'add'
    )
    const response = h.response({
      status: 'success',
      message: 'Music has been successfully added to the playlist. | Musik berhasil ditambahkan ke dalam playlist.'
    })
    response.code(201)
    return response
  }

  async getPlaylistSongsByIdHandler (request, h) {
    const { id } = request.params
    const { id: credentialId } = request.auth.credentials
    const playlist =
      await this._playlistsService.getPlaylistSongsById(id, credentialId)
    return {
      status: 'success',
      data: {
        playlist
      }
    }
  }

  async deletePlaylistSongsByIdHandler (request, h) {
    this._validator.validateSongPlaylistPayload(request.payload)
    const { id } = request.params
    const { songId } = request.payload
    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(id, credentialId)
    await this._playlistsService.deleteSongFromPlaylist(id, songId)
    await this._playlistsService.addActivity(
      id, songId, credentialId, 'delete'
    )
    return {
      status: 'success',
      message: 'The music was successfully removed from the playlist. | Musik berhasil dihapus dari playlist.'
    }
  }

  async getPlaylistActivitiesByIdHandler (request, h) {
    const { id } = request.params
    const { id: credentialId } = request.auth.credentials

    await this._playlistsService.verifyPlaylistAccess(id, credentialId)

    const activities =
      await this._playlistsService.getPlaylistActivitiesById(id)

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities
      }
    }
  }
}

export default PlaylistsHandler
