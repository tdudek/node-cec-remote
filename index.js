const Path = require('path')
const Hapi = require('hapi')
const HapiBoomDecorators = require('hapi-boom-decorators')
const Inert = require('inert')
const NodeCec = require('node-cec').NodeCec

const cec = new NodeCec('node-cec-monitor')

process.on( 'SIGINT', function() {
  if ( cec != null ) {
    cec.stop()
  }
  process.exit()
});

let ready = false

cec.once('ready', function(client) {
  console.log('CEC connection ready');
  ready = true
});
cec.start( 'cec-client', '-m', '-d', '8' );

const server = new Hapi.Server({
  port: 3001,
  host: '0.0.0.0',
})

server.route({
  method: 'PATCH',
  path: '/api/devices/tv',
  handler: (request, h) => {
    
    const command = request.payload.command
    if (command === 'on') {
      cec.send('on 0')
      // bad hack to ensure tv goes on
      setTimeout(() => cec.send('on 0'), 2000)

      return {
        command,
        message: 'command executed',
      }
    }
    
    if (command === 'off') {
      cec.send('standby 0')
      return {
        command,
        message: 'command executed',
      }
    }

    return h.badRequest()
  }
})

const provision = async () => {
  try {
    await server.register(HapiBoomDecorators)
    await server.register(Inert)
    await server.start()
  }
  catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log('Server running at:', server.info.uri);
}

provision()