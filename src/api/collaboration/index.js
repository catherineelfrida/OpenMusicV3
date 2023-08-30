import routes from './routes.js'
import CollaborationsHandler from './handler.js'

const collaborationsPlugin = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, {
    collaborationsService,
    playlistsService,
    usersService,
    validator
  }) => {
    const collaborationHandler = new CollaborationsHandler(
      collaborationsService,
      playlistsService,
      usersService,
      validator
    )
    server.route(routes(collaborationHandler))
  }
}

export default collaborationsPlugin
