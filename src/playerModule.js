///<reference path='../typings/socket.io.d.ts' />
var battle_mod = require('./battleModule');
var Player = (function () {
    function Player(username, socket) {
        this._username = username;
        this._socket = socket;
        this._isBattling = false;
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
    Player.prototype.setBattleStatus = function (status) {
        this._isBattling = status;
    };
    Player.prototype.isBattling = function () {
        return this._isBattling;
    };
    return Player;
})();
exports.Player = Player;
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
        var battleController = new battle_mod.BattleController();
        this._namespace = namespace;
        this._playerModel = playerModel;
        this._battleController = battleController;
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
                console.log(baseTeam);
                playerModel.findBySocket(socket).setBaseTeam(baseTeam);
            });
            socket.on('challenge', function (challengedUser) {
                console.log(playerModel.findBySocket(socket).getUsername() + " challenges " + challengedUser);
                var targetPlayer = playerModel.findByUsername(challengedUser);
                if (!targetPlayer.isBattling()) {
                    targetPlayer.getSocket().emit('battle-request', playerModel.findBySocket(socket).getUsername());
                }
                else {
                    socket.emit('player-busy');
                }
            });
            socket.on('reject-battle', function (challengingUser) {
                console.log(challengingUser + " had their battle rejected.");
                playerModel.findByUsername(challengingUser).getSocket().emit('rejected-battle');
            });
            socket.on('new-battle', function (player1, player2) {
                console.log("Battle started between " + player1 + " and " + player2);
                battleController.newBattle(playerModel.findByUsername(player1), playerModel.findByUsername(player2));
            });
            socket.on('battle-input', function (id, mover, move, target) {
                console.log(id);
                console.log(move);
                console.log(target);
                battleController.recieveInput(id, socket, mover, move, target);
            });
            socket.on('battle-switch', function (id, unit_slot) {
                battleController.recieveSwitch(id, socket, unit_slot);
            });
            socket.on('battle-over', function () {
                playerModel.findBySocket(socket).setBattleStatus(false);
            });
            socket.on('disconnect', function () {
                if (playerModel.findBySocket(socket) != null) {
                    battleController.playerDisconnect(socket);
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
