var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var app = express();
var schemaName = new Schema({
    request: String,
    title: String,
    id: Number
}, {
    collection: 'test'
});
schemaName.index({ request: 'text' });
var Model = mongoose.model('Model', schemaName);
mongoose.connect('mongodb://localhost:27017/db08');
app.get('/find/:query', async function (req, res) {
    var query = req.params.query;
    try {
        var result = await Model.find({
            $text: {
                $search: query
            }
        });
        if (result) {
            res.json(result);
        } else {
            res.send(JSON.stringify({ error: 'Error' }));
        }
    } catch (err) {
        res.status(500).send(JSON.stringify({ error: err.message }));
    }
});
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Node.js listening on port ' + port);
});