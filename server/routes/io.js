var Joi = require('joi')
var Boom = require('boom')
var spawn = require('child_process').spawn
var procs = {}

module.exports = {
  path: '/io',
  method: 'POST',
  config: {
    id: 'io',
    handler: function (request, reply) {
      const task = request.payload.task
      const proc = spawn(task.command, task.args, task.options)
      const pid = proc.pid
      const socket = request.socket
      const server = request.server
      procs[pid] = {
        proc: proc,
        socket: socket.id
      }

      proc.stdout.pipe(process.stdout)
      proc.stdout.on('data', (data) => {
        console.log(data.toString())
        // socket.send(data.toString())
        server.publish('/io', {
          data: data.toString(),
          pid: pid
        })
      })

      proc.stderr.on('data', (data) => {
        // console.log(data.toString())
        // socket.send(data.toString())
        server.publish('/io', {
          data: data.toString(),
          pid: pid
        })
      })

      proc.on('exit', (code) => {
        delete procs[pid]
        server.publish('/io/pids', Object.keys(procs))
        // socket.send(code)
        // console.log(`Child exited with code ${code}`)
      })
      reply(pid)

      server.publish('/io/pids', Object.keys(procs))
    },
    validate: {
      payload: {
        task: Joi.object().required().keys({
          command: Joi.string().required(),
          args: Joi.array(),
          options: Joi.object()
        })
      }
    }
  }
}
