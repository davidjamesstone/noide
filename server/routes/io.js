var Joi = require('joi')
var Boom = require('boom')
var spawnargs = require('spawn-args')
var spawn = require('child_process').spawn
var procs = {}

function getProcesses () {
  const pids = Object.keys(procs)
  return pids.map((pid) => {
    return {
      pid: procs[pid].pid,
      buffer: procs[pid].buffer,
      name: procs[pid].name,
      command: procs[pid].command
    }
  })
}

module.exports = [{
  path: '/io',
  method: 'POST',
  config: {
    handler: function (request, reply) {
      // const task = request.payload.task
      const name = request.payload.name
      const command = request.payload.command
      const args = spawnargs(command)
      // const proc = spawn(task.command, task.args, task.options)
      const child = spawn(args[0], args.slice(1))
      const pid = child.pid

      child.on('error', (err) => {
        console.error(err)
        var data = err.toString()
        if (pid) {
          var proc = procs[pid]
          if (proc) {
            proc.buffer = data
          }

          server.publish('/io', {
            data: data,
            pid: pid
          })
        }
      })

      if (!pid) {
        return reply({ message: `Failed to start child process \'${command}\'` }).code(500)
      }

      const socket = request.socket
      const server = request.server
      procs[pid] = {
        pid: pid,
        child: child,
        buffer: '',
        name: name,
        command: command,
        socket: socket.id
      }

      // proc.stdout.pipe(process.stdout)
      child.stdout.on('data', (data) => {
        console.log(data.toString())
        // socket.send(data.toString())
        data = data.toString()
        var proc = procs[pid]
        if (proc) {
          proc.buffer = data
        }
        server.publish('/io', {
          data: data,
          pid: pid
        })
      })

      child.stderr.on('data', (data) => {
        console.log(data.toString())
        // socket.send(data.toString())
        data = data.toString()
        var proc = procs[pid]
        if (proc) {
          proc.buffer = data
        }
        server.publish('/io', {
          data: data,
          pid: pid
        })
      })

      child.on('exit', (code) => {
        delete procs[pid]
        server.publish('/io', {
          data: `Child exited with code ${code}` + '\n',
          pid: pid
        })

        server.publish('/io/pids', getProcesses())
      })
      reply(pid)

      server.publish('/io/pids', getProcesses())
    },
    validate: {
      payload: {
        name: Joi.string().required(),
        command: Joi.string().required()
      }
    }
  }
}, {
  path: '/io/pids',
  method: 'GET',
  config: {
    handler: function (request, reply) {
      reply(getProcesses())
    }
  }
}, {
  path: '/io/kill',
  method: 'POST',
  config: {
    handler: function (request, reply) {
      var proc = procs[request.payload.pid]
      if (proc) {
        proc.child.kill()
      }
      reply(proc ? proc.pid : null)
    },
    validate: {
      payload: {
        pid: Joi.number().required()
      }
    }
  }
}]
