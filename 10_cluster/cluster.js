var cluster = require('cluster')
var http = require('http')
var os = require('os')

function iAmMaster() {
  os.cpus().forEach(() => cluster.fork())

  cluster.on('online', (worker) => {
    console.log(`worker ${worker.process.pid} born`)
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
  })
}

function iAmWorker() {
  http.createServer((req, res) => {
    console.log(`${cluster.worker.id} handled request`)

    if (req.url.indexOf('favicon') >= 0) {
      while (true) {}
    } else {
      res.end(`${cluster.worker.id} returned response`)
    }
  }).listen(8888)
}

if (cluster.isMaster) {
  iAmMaster()
} else {
  iAmWorker()
}