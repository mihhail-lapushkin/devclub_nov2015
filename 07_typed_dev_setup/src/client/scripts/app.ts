import async = require('async')
import BlahComponent = require('./BlahComponent')

document.addEventListener('DOMContentLoaded', () => {
  var blahComponent: BlahComponent = new BlahComponent('.BlahComponent')

  async.parallel([
    callback => setTimeout(callback, 1000),
    callback => {
      var xhr: XMLHttpRequest = new XMLHttpRequest()

      xhr.onload = () => callback(null, JSON.parse(xhr.responseText))
      xhr.open('GET', 'http://localhost:8888/someJsonData')
      xhr.send()
    },
    callback => {
      var xhr: XMLHttpRequest = new XMLHttpRequest()

      xhr.onload = () => callback(null, JSON.parse(xhr.responseText))
      xhr.open('GET', 'http://localhost:8888/someMoreJsonData')
      xhr.send()
    }
  ], (error: any, results: Array<any>) => {
    blahComponent.setText(`${results[1].someData} ${results[2].someMoreData}`)
  })
})