///<reference path='../typings/socket.io.d.ts' />

class Player {
    
    private _username: string;
    private _socket: SocketIO.Socket;
    private _baseTeam: Object[];
    
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
    
    getBaseTeam(): Object[] {
        return this._baseTeam;
    }
    
    setBaseTeam(baseTeam: Object[]): void {
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
    
    constructor(namespace: SocketIO.Namespace){
        var playerModel = new PlayerModel();
        this._namespace = namespace;
        this._playerModel = playerModel;
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
            socket.on('team-change', function(baseTeam: Object[]){
                console.log(playerModel.findBySocket(socket).getUsername() + " is changing teams");
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
            });
            socket.on('disconnect', function(){
                if(playerModel.findBySocket(socket) != null){
                    console.log(playerModel.findBySocket(socket).getUsername() + " disconnected");
                    playerModel.removePlayer(playerModel.findBySocket(socket));
                } else {
                    console.log('A non logged user left');
                }
            });
        });
    }
}