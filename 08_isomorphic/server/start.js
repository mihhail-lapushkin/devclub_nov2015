require('node-jsx').install({ extension: '.js' })

var React = require('react')
var ReactDomServer = require('react-dom/server')
var express = require('express')

var App = require('../common/react/App')

var app = express()

app.get('/favicon.ico', (req, res) => res.end())
app.use(express.static('public'))

app.get('/someJsonData', (req, res) => {
  res.json({ someData: 'just some data' })
})

app.get('/someMoreJsonData', (req, res) => {
  res.json({ someMoreData: 'and some more data' })
})

app.use((req, res) => {
  res.send(`<!doctype html>${ReactDomServer.renderToString(React.createElement(App))}`)
})

app.listen(8888)