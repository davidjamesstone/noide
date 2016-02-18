var Path = require('path')
var Joi = require('joi')
var Boom = require('Boom')
var fileutils = require('../file-system-utils')
var watcher = require('../services/file-system-watcher')

module.exports = {
  method: 'GET',
  path: '/file',
  config: {
    handler: function (request, reply) {
      var path = Path.resolve(process.cwd(), request.query.path)

      fileutils.readFile(path, (err, file) => {
        if (err) {
          return reply(err.code === 'ENOENT'
            ? Boom.notFound('`' + path + '` not found', err)
            : Boom.badRequest('Invalid request', err))
        }

        var relativeDir = Path.relative(process.cwd(), file.dir)
        var relativePath = Path.relative(process.cwd(), file.path)
        file.relativePath = relativePath

        var watched = watcher.watched
        var paths = Object.keys(watched)
        var fsos = paths
          .filter(path => { return !watched[path].isDirectory })
          .map(path => {
            var fso = watched[path]
            fso.relativePath = Path.relative(process.cwd(), path)
            return fso
          })

        // var favicon = common.favicons[file.ext] || 'android'
        return reply.view('file', {
          meta: {
            favicon: '/public/icons copy/_file_type_' + file.ext.substr(1) + '.png',
            title: relativeDir ? file.name + ' [' + relativeDir + ']' : file.name
          },
          path: path,
          file: file,
          fsos: fsos,
          dataJSON: JSON.stringify({
            file: file,
            fsos: fsos,
            watched: watched
          })
        })
      })
    },
    validate: {
      query: {
        path: Joi.string().required()
      }
    }
  }
}
// Cache-Control: max-age=
