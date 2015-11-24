'use strict'

var co = require('co')
var request = require('co-request')
var fs = require('co-fs')

var i = 0
setInterval(() => console.log(i++), 50)

co(function *() {
  console.log('PREPARING!')

  var devclubHtml = yield request('http://www.devclub.eu')

  console.log('GOT RESPONSE!')

  yield fs.writeFile('response.txt', JSON.stringify(devclubHtml.body))

  console.log('WRITTEN RESPONSE!')
}).catch(error => {
  console.log(error)
})