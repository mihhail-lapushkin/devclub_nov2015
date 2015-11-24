var greeter = require('../common/greeter')
var async = require('async')

document.addEventListener('DOMContentLoaded', () => {
  async.waterfall([
    callback => setTimeout(callback, 1000),
    callback => {
      document.body.innerHTML = greeter.getGreetingFrom('Browser')
      callback()
    },
    callback => setTimeout(callback, 1000),
    callback => {
      document.body.innerHTML = greeter.getGreetingFrom('Blah')
      callback()
    }
  ])
})