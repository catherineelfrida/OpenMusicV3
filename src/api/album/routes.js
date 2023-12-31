import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums',
    handler: handler.postAlbumHandler
  },
  {
    method: 'GET',
    path: '/albums/{id}',
    handler: handler.getAlbumByIdHandler
  },
  {
    method: 'PUT',
    path: '/albums/{id}',
    handler: handler.putAlbumByIdHandler
  },
  {
    method: 'DELETE',
    path: '/albums/{id}',
    handler: handler.deleteAlbumByIdHandler
  },
  {
    method: 'POST',
    path: '/albums/{id}/covers',
    handler: handler.postAlbumCoverHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 512000
      }
    }
  },
  {
    method: 'GET',
    path: '/upload/images/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, '/file/images/album_cover')
      }
    }
  },
  {
    method: 'POST',
    path: '/albums/{id}/likes',
    handler: handler.postLikeAlbumByIdHandler,
    options: {
      auth: 'openmusic_jwt'
    }
  },
  {
    method: 'GET',
    path: '/albums/{id}/likes',
    handler: handler.getAlbumLikesByIdHandler
  },
  {
    method: 'DELETE',
    path: '/albums/{id}/likes',
    handler: handler.deleteAlbumLikeByIdHandler,
    options: {
      auth: 'openmusic_jwt'
    }
  }
]

export default routes
