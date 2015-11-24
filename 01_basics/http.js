require('http').createServer((req, res) => {
  res.end(req.url)
}).listen(8888)