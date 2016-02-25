module.exports = [{
  watch: {
    paths: 'client'
  },
  tasks: [{
    command: 'npm',
    args: ['run', 'build:js']
  }]
}]
