var async = require('async')

document.addEventListener('DOMContentLoaded', () => {
  async.parallel([
    callback => setTimeout(callback, 1000),
    callback => {
      var xhr = new XMLHttpRequest()

      xhr.onload = () => callback(null, JSON.parse(xhr.responseText))
      xhr.open('GET', 'http://localhost:8888/someJsonData')
      xhr.send()
    },
    callback => {
      var xhr = new XMLHttpRequest()

      xhr.onload = () => callback(null, JSON.parse(xhr.responseText))
      xhr.open('GET', 'http://localhost:8888/someMoreJsonData')
      xhr.send()
    }
  ], (error, results) => {
    document.body.firstChild.innerHTML = `${results[1].someData} ${results[2].someMoreData}`
  })
})