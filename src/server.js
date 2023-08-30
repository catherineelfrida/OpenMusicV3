import config from './utils/config.js'

import Hapi from '@hapi/hapi'
import Jwt from '@hapi/jwt'
import Inert from '@hapi/inert'

import path from 'path'
import { fileURLToPath } from 'url'

import albums from './api/album/index.js'
import AlbumsService from './services/postgres/AlbumService.js'
import AlbumsValidator from './validator/album/index.js'

import songs from './api/song/index.js'
import SongsService from './services/postgres/SongService.js'
import SongsValidator from './validator/song/index.js'

import users from './api/user/index.js'
import UsersService from './services/postgres/UserService.js'
import UsersValidator from './validator/user/index.js'

import authentications from './api/authentication/index.js'
import AuthenticationsValidator from './validator/authentication/index.js'
import AuthenticationsService from './services/postgres/AuthenticationService.js'
import TokenManager from './tokenize/TokenManager.js'

import playlists from './api/playlist/index.js'
import PlaylistsValidator from './validator/playlist/index.js'
import PlaylistsService from './services/postgres/PlaylistService.js'

import collaborations from './api/collaboration/index.js'
import CollaborationsValidator from './validator/collaboration/index.js'
import CollaborationsService from './services/postgres/CollaborationService.js'

import _exports from './api/export/index.js'
import ProducerService from './services/rabbitmq/ProducerService.js'
import ExportsValidator from './validator/export/index.js'

import ClientError from './exceptions/ClientError.js'

import StorageService from './services/storage/StorageService.js'

import CacheService from './services/redis/CacheService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const init = async () => {
  const cacheSercice = new CacheService()
  const collaborationsService = new CollaborationsService(cacheSercice)
  const albumsService = new AlbumsService(cacheSercice)
  const songsService = new SongsService()
  const usersService = new UsersService()
  const authenticationsService = new AuthenticationsService()
  const playlistsService = new PlaylistsService(collaborationsService, cacheSercice)
  const storageService = new StorageService(path.resolve(__dirname, '/api/album/file/images/album_cover')
  )

  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*']
      }
    }
  })

  await server.register([
    {
      plugin: Jwt
    },
    {
      plugin: Inert
    }
  ])

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.jwt.accesskey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.jwt.accessage
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id
      }
    })
  })

  server.ext('onPreResponse', (request, h) => {
    const { response } = request
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message
        })
        newResponse.code(response.statusCode)
        return newResponse
      }
      if (!response.isServer) {
        return h.continue
      }
      const newResponse = h.response({
        status: 'error',
        message: 'Sorry, an error occurred on the server. | Maaf, terjadi kesalahan pada server kami.'
      })
      newResponse.code(500)
      return newResponse
    }
    return h.continue
  })

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        storageService,
        validator: AlbumsValidator
      }
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator
      }
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator
      }
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator
      }
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        validator: PlaylistsValidator
      }
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator
      }
    },
    {
      plugin: _exports,
      options: {
        exportsService: ProducerService,
        playlistsService,
        validator: ExportsValidator
      }
    }
  ])

  await server.start()
  console.log(`Server berjalan pada ${server.info.uri}`)
}

init()
