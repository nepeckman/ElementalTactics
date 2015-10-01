///<reference path='../typings/socket.io.d.ts' />
var Player = (function () {
    function Player(username, socket) {
        this._username = username;
        this._socket = socket;
    }
    Player.prototype.getUsername = function () {
        return this._username;
    };
    Player.prototype.setUsername = function (username) {
        this._username = username;
    };
    Player.prototype.getSocket = function () {
        return this._socket;
    };
    Player.prototype.setSocket = function (socket) {
        this._socket = socket;
    };
    Player.prototype.getBaseTeam = function () {
        return this._baseTeam;
    };
    Player.prototype.setBaseTeam = function (baseTeam) {
        this._baseTeam = baseTeam;
    };
    return Player;
})();
var PlayerModel = (function () {
    function PlayerModel() {
        this._players = new Array();
    }
    PlayerModel.prototype.addPlayer = function (player) {
        this._players.push(player);
    };
    PlayerModel.prototype.removePlayer = function (player) {
        var index = this._players.indexOf(player);
        if (index > -1) {
            this._players.splice(index, 1);
        }
    };
    PlayerModel.prototype.findByUsername = function (username) {
        var match;
        this._players.forEach(function (player) {
            if (player.getUsername() === username) {
                match = player;
            }
        });
        return match;
    };
    PlayerModel.prototype.findBySocket = function (socket) {
        var match;
        this._players.forEach(function (player) {
            if (player.getSocket().id === socket.id) {
                match = player;
            }
        });
        return match;
    };
    PlayerModel.prototype.getUserlist = function () {
        var userlist = new Array();
        this._players.forEach(function (player) {
            userlist.push(player.getUsername());
        });
        return userlist;
    };
    return PlayerModel;
})();
var PlayerController = (function () {
    function PlayerController(namespace) {
        var playerModel = new PlayerModel();
        this._namespace = namespace;
        this._playerModel = playerModel;
        this._namespace.on('connection', function (socket) {
            socket.emit('userlist', playerModel.getUserlist());
            socket.on('login', function (name) {
                console.log(name + " logged in");
                playerModel.addPlayer(new Player(name, socket));
                namespace.emit('new-user', name);
            });
            socket.on('name-change', function (newName) {
                var oldName = playerModel.findBySocket(socket).getUsername();
                console.log(oldName + " is now know as " + newName);
                playerModel.findBySocket(socket).setUsername(newName);
                namespace.emit('name-change', oldName, newName);
            });
            socket.on('lobby-message', function (msg) {
                console.log('Message sent: ' + msg);
                namespace.emit('lobby-message', msg);
            });
            socket.on('team-change', function (baseTeam) {
                console.log(playerModel.findBySocket(socket).getUsername() + " is changing teams");
                playerModel.findBySocket(socket).setBaseTeam(baseTeam);
            });
            socket.on('challenge', function (challengedUser) {
                console.log(playerModel.findBySocket(socket).getUsername() + " challenges " + challengedUser);
                playerModel.findByUsername(challengedUser).getSocket().emit('battle-request', playerModel.findBySocket(socket).getUsername());
            });
            socket.on('reject-battle', function (challengingUser) {
                console.log(challengingUser + " had their battle rejected.");
                playerModel.findByUsername(challengingUser).getSocket().emit('rejected-battle');
            });
            socket.on('new-battle', function (player1, player2) {
                console.log("Battle started between " + player1 + " and " + player2);
            });
            socket.on('disconnect', function () {
                if (playerModel.findBySocket(socket) != null) {
                    var player = playerModel.findBySocket(socket);
                    console.log(player.getUsername() + " disconnected");
                    playerModel.removePlayer(player);
                    namespace.emit('user-gone', player.getUsername());
                }
                else {
                    console.log('A non logged user left');
                }
            });
        });
    }
    return PlayerController;
})();
exports.PlayerController = PlayerController;
