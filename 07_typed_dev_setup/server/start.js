var express = require('express');
var app = express();
app.get('/favicon.ico', function (req, res) { return res.end(); });
app.use(express.static('public'));
app.get('/someJsonData', function (req, res) {
    res.json({ someData: 'just some data' });
});
app.get('/someMoreJsonData', function (req, res) {
    res.json({ someMoreData: 'and some more data' });
});
app.listen(8888);
//# sourceMappingURL=start.js.map