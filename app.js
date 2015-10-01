var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var playerModule = require('./src/playerModule');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function (req, res) {
    res.render('index');
});

var playerController = new playerModule.PlayerController(io);

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
http.listen(server_port, server_ip_address, function () {
    console.log("Listening on " + server_ip_address + ", server_port " + server_port);
});