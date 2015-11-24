var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.get('/favicon.ico', (req, res) => res.end())
app.use(express.static('public'))

var recording

app.post('/saveRecording', bodyParser.raw({
  inflate: false,
  limit: '10mb',
  type: 'video/webm'
}), (req, res) => {
  recording = req.body

  res.end()
})

app.get('/getRecording', (req, res) => {
  res.end(recording)
})

app.listen(8888)