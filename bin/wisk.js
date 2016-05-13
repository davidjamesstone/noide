module.exports = [{
  paths: ['client/**/*.js', 'client/**/*.html'],
  on: {
    all: ['npm run build:app:js']
  }
}, {
  paths: ['client/**/*.scss'],
  on: {
    all: ['npm run build:css']
  }
}]
