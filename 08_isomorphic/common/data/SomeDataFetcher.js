var request = require('superagent')

module.exports = {
  fetch: (callback) => {
    request
      .get('http://localhost:8888/someJsonData')
      .end((error, result) => {
        if (error) {
          callback(error)
        } else {
          callback(null, result.body)
        }
      })
  }
}