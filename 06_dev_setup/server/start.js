var express = require('express')
var app = express()

app.get('/favicon.ico', (req, res) => res.end())
app.use(express.static('public'))

app.get('/someJsonData', (req, res) => {
  res.json({ someData: 'just some data' })
})

app.get('/someMoreJsonData', (req, res) => {
  res.json({ someMoreData: 'and some more data' })
})

app.listen(8888)