import express = require('express')

var app: express.Express = express()

app.get('/favicon.ico', (req, res) => res.end())
app.use(express.static('public'))

app.get('/someJsonData', (req: express.Request, res: express.Response) => {
  res.json({ someData: 'just some data' })
})

app.get('/someMoreJsonData', (req: express.Request, res: express.Response) => {
  res.json({ someMoreData: 'and some more data' })
})

app.listen(8888)