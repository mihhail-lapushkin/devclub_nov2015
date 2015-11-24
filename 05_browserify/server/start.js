var express = require('express')
var greeter = require('../common/greeter')
var app = express()

app.get('/favicon.ico', (req, res) => res.end())
app.use(express.static('public'))

app.get('/greet', (req, res) => {
  res.send(greeter.getGreetingFrom('Server'))
})

app.listen(8888)