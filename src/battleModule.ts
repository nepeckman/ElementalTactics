///<reference path='../typings/socket.io.d.ts' />
import player_mod = require('./playerModule');

class BattleController{
    
    private _battleModel: BattleModel;
    
    constructor(){
        this._battleModel = new BattleModel();
    }
    
    newBattle(player1: player_mod.Player, player2: player_mod.Player){
        var team1: Team = new Team(player1.getSocket(), player1.getBaseTeam());
        var team2: Team = new Team(player2.getSocket(), player2.getBaseTeam());
        var battle: Battle = new Battle(team1, team2);
        this._battleModel.addBattle(battle);
    }
}

class BattleModel{

    private _battles: Battle[];
    
    constructor(){
        this._battles = new Array();
    }
    
    addBattle(battle: Battle){
        this._battles.push(battle);
    }
    
    removeBattle(battle: Battle){
        var index: number = this._battles.indexOf(battle);
        if(index > -1){
            this._battles.splice(index, 1);
        }
    }
    
    findBattle(id: number): Battle{
        var match: Battle;
        this._battles.forEach(function(battle: Battle){
            if(battle.id === id){
                match = battle;
            }
        });
        return match;
    }
}

class Battle{
    
    team1: Team;
    team2: Team;
    id: number;
    
    constructor(team1: Team, team2: Team){
        this.team1 = team1;
        this.team2 = team2;
    }
    
}

class Team{

    private _socket: SocketIO.Socket;
    private _living_units: Unit[];
    private _active_unit: Unit;
    private _battle: Battle;
    
    constructor(socket: SocketIO.Socket, baseTeam: BaseTeam){
        this._socket = socket;
        var units: Unit[] = new Array();
        baseTeam.units.forEach(function(unit){
            units.push(new Unit(unit));
        });
        this._living_units = units;
        this._active_unit = units[0];
    }
    
    setBattle(battle: Battle){
        this._battle = battle;
    }
}

class Unit{
    
    primaryType: Type;
    secondaryType: Type;
    name: string;
    health: number;
    
    constructor(baseUnit: BaseUnit){
        this.primaryType = baseUnit.primaryType;
        this.secondaryType = baseUnit.secondaryType;
        this.name = baseUnit.name;
        this.health = 10;
    }
}

export interface BaseTeam{
    
    units: BaseUnit[];
    
}

interface BaseUnit{

    primaryType: Type;
    secondaryType: Type;
    name: string;
    
}

enum Type {"Fire", "Water", "Air", "Earth", "Plant", "Electric", "Ice", "Metal", "Light", "Dark"};

interface Move {
    
    private _priority: number;
}
