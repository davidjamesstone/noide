function required (val, name) {
  if (!val) {
    return name + ' is required'
  }
}

module.exports = {
  required: required
}
