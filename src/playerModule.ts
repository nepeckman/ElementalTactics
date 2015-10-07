///<reference path='../typings/socket.io.d.ts' />
import battle_mod = require('./battleModule');

export class Player {
    
    private _username: string;
    private _socket: SocketIO.Socket;
    private _baseTeam: battle_mod.BaseUnit[];
    
    constructor(username: string, socket: SocketIO.Socket){
        this._username = username;
        this._socket = socket;
    }
    
    getUsername(): string{
        return this._username;
    }
    
    setUsername(username: string): void{
        this._username = username;
    }
    
    getSocket(): SocketIO.Socket{
        return this._socket;
    }
    
    setSocket(socket: SocketIO.Socket): void{
        this._socket = socket;
    }
    
    getBaseTeam(): battle_mod.BaseUnit[] {
        return this._baseTeam;
    }
    
    setBaseTeam(baseTeam: battle_mod.BaseUnit[]): void {
        this._baseTeam = baseTeam;
    }
}

class PlayerModel{
    
    private _players: Player[];
    
    constructor(){
        this._players = new Array();
    }
    
    addPlayer(player: Player): void{
        this._players.push(player);
    }
    
    removePlayer(player: Player): void{
        var index: number = this._players.indexOf(player);
        if(index > -1){
            this._players.splice(index, 1);
        }
    }
    
    findByUsername(username: string): Player{
        var match: Player;
        this._players.forEach(function(player: Player){
            if(player.getUsername() === username){
                match = player;
            }
        });
        return match;
    }
    
    findBySocket(socket: SocketIO.Socket): Player{
        var match: Player;
        this._players.forEach(function(player: Player){
            if(player.getSocket().id === socket.id){
                match = player;
            }
        });
        return match;
    }
    
    getUserlist(): string[]{
        var userlist: string[] = new Array();
        this._players.forEach(function(player){
            userlist.push(player.getUsername());
        });
        return userlist;
    }
}

export class PlayerController{

    private _namespace: SocketIO.Namespace;
    private _playerModel: PlayerModel;
    private _battleController: battle_mod.BattleController;
    
    constructor(namespace: SocketIO.Namespace){
        var playerModel = new PlayerModel();
        var battleController = new battle_mod.BattleController();
        this._namespace = namespace;
        this._playerModel = playerModel;
        this._battleController = battleController;
        this._namespace.on('connection', function(socket: SocketIO.Socket){
            socket.emit('userlist', playerModel.getUserlist());
            socket.on('login', function(name: string){
                console.log(name + " logged in");
                playerModel.addPlayer(new Player(name, socket));
                namespace.emit('new-user', name);
            });
            socket.on('name-change', function(newName: string){
                var oldName = playerModel.findBySocket(socket).getUsername();
                console.log(oldName + " is now know as " + newName);
                playerModel.findBySocket(socket).setUsername(newName);
                namespace.emit('name-change', oldName, newName);
            });
            socket.on('lobby-message', function(msg: string){
                console.log('Message sent: ' + msg);
                namespace.emit('lobby-message', msg);
            });
            socket.on('team-change', function(baseTeam: battle_mod.BaseUnit[]){
                console.log(playerModel.findBySocket(socket).getUsername() + " is changing teams");
                console.log(baseTeam);
                playerModel.findBySocket(socket).setBaseTeam(baseTeam);
            });
            socket.on('challenge', function(challengedUser: string){
                console.log(playerModel.findBySocket(socket).getUsername() + " challenges " + challengedUser);
                playerModel.findByUsername(challengedUser).getSocket().emit('battle-request', playerModel.findBySocket(socket).getUsername());
            });
            socket.on('reject-battle', function(challengingUser: string){
                console.log(challengingUser + " had their battle rejected.");
                playerModel.findByUsername(challengingUser).getSocket().emit('rejected-battle');
            });
            socket.on('new-battle', function(player1: string, player2: string){
                console.log("Battle started between " + player1 + " and " + player2);
                battleController.newBattle(playerModel.findByUsername(player1), playerModel.findByUsername(player2));
            });
            socket.on('battle-input', function(id: number, mover: number, move: string, target: battle_mod.BaseTarget){
                console.log(id);
                console.log(move);
                console.log(target);
                battleController.recieveInput(id, socket, mover, move, target);
            });
            socket.on('battle-switch', function(id: number, unit_slot: number){
                battleController.recieveSwitch(id, socket, unit_slot);
            });
            socket.on('disconnect', function(){
                if(playerModel.findBySocket(socket) != null){
                    var player: Player = playerModel.findBySocket(socket);
                    console.log(player.getUsername() + " disconnected");
                    playerModel.removePlayer(player);
                    namespace.emit('user-gone', player.getUsername());
                } else {
                    console.log('A non logged user left');
                }
            });
        });
    }
}