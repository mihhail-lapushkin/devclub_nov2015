var async = require('async')

async.parallel([
  callback => setTimeout(callback, 500),
  callback => setTimeout(callback, 700),
  callback => setTimeout(callback, 800)
], () => {
  console.log('done!')
})