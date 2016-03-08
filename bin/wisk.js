module.exports = [{
  watch: {
    paths: ['client/**/*.js', 'client/**/*.html']
  },
  tasks: [{
    command: 'npm',
    args: ['run', 'build:app:js']
  }]
}, {
  watch: {
    paths: 'client/**/*.scss'
  },
  tasks: [{
    command: 'npm',
    args: ['run', 'build:css']
  }]
}]
