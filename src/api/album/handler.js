import autoBind from 'auto-bind'
import { config } from 'dotenv'

class AlbumsHandler {
  constructor (albumsService, storageService, validator) {
    this._albumsService = albumsService
    this._storageService = storageService
    this._validator = validator

    autoBind(this)
  }

  async postAlbumHandler (request, h) {
    this._validator.validateAlbumPayload(request.payload)
    const albumId = await this._albumsService.addAlbum(request.payload)
    const response = h.response({
      status: 'success',
      data: {
        albumId
      }
    })
    response.code(201)
    return response
  }

  async getAlbumByIdHandler (request, h) {
    const { id } = request.params
    const album = await this._albumsService.getAlbumById(id)
    return {
      status: 'success',
      data: {
        album
      }
    }
  }

  async putAlbumByIdHandler (request, h) {
    this._validator.validateAlbumPayload(request.payload)
    const { id } = request.params
    await this._albumsService.editAlbumById(id, request.payload)
    return {
      status: 'success',
      message: 'Album updated successfully. | Album berhasil diperbarui.'
    }
  }

  async deleteAlbumByIdHandler (request, h) {
    const { id } = request.params
    await this._albumsService.deleteAlbumById(id)
    return {
      status: 'success',
      message: 'Album deleted successfully. | Album berhasil dihapus.'
    }
  }

  async postAlbumCoverHandler (request, h) {
    const { id } = request.params
    const { cover } = request.payload
    this._validator.validateAlbumCoverHeaders(cover.hapi.headers)
    const filename = await this._storageService.writeFile(cover, cover.hapi)
    const url = `http://${config.server.host}:${config.server.port}/upload/images/${filename}`
    await this._albumsService.editAlbumCoverById(id, url)
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah.'
    })
    response.code(201)
    return response
  }

  async postLikeAlbumByIdHandler (request, h) {
    const { id: albumId } = request.params
    const { id: userId } = request.auth.credentials
    await this._albumsService.getAlbumById(albumId)
    await this._albumsService.addAlbumLikeById(albumId, userId)
    const response = h.response({
      status: 'success',
      message: 'Album liked successfully. | Album berhasil disukai.'
    })
    response.code(201)
    return response
  }

  async deleteAlbumLikeByIdHandler (request, h) {
    const { id: userId } = request.auth.credentials
    const { id: albumId } = request.params
    await this._albumsService.deleteAlbumLikeById(userId, albumId)
    return {
      status: 'success',
      message: 'Album successfully unliked. | Album berhasil tidak disukai.'
    }
  }

  async getAlbumLikesByIdHandler (request, h) {
    const { id } = request.params
    const { cache, likes } = await this._albumsService.getAlbumLikesById(id)
    const response = h.response({
      status: 'success',
      data: {
        likes
      }
    })
    if (cache) response.header('X-Data-Source', 'cache')
    return response
  }
}

export default AlbumsHandler
