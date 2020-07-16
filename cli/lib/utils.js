const pad = require('pad')

function fw (str, num) {
  if (str.toString().length <= num) {
    return pad(num, str.toString())
  }
  return str.toString().slice(0, num - 3) + '...'
}

function collect (value, previous) {
  return previous.concat([value])
}

module.exports = {
  fw,
  collect
}
