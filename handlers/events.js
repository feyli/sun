const fs = require('fs')

module.exports = () => {
  for (let file of fs.readdirSync('./events')) {
    require('../events/' + file)
  }
}