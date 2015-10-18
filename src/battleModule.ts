///<reference path='../typings/socket.io.d.ts' />
///<reference path='../typings/node-uuid.d.ts' />

var uuid: UUID = require('node-uuid');
import player_mod = require('./playerModule');

export class BattleController{
    
    private _battleModel: BattleModel;
    
    constructor(){
        this._battleModel = new BattleModel();
    }
    
    newBattle(player1: player_mod.Player, player2: player_mod.Player){
        player1.setBattleStatus(true);
        player2.setBattleStatus(true);
        var tiebreaker = Math.random() < .5;
        var team1: Team = new Team(player1.getSocket(), player1.getUsername(), player1.getBaseTeam(), tiebreaker);
        var team2: Team = new Team(player2.getSocket(), player2.getUsername(), player2.getBaseTeam(), !tiebreaker);
        // TODO: add id to constuctor
        var battle: Battle = new Battle(this._battleModel, team1, team2);
        this._battleModel.addBattle(battle);
        [team1, team2].forEach(function(team, index, array){
            team.setBattle(battle);
            var oppIdx = (index === 0) ? 1 : 0;
            team.getSocket().emit('new-battle', battle.id, team.getLivingUnits(), array[oppIdx].getLivingUnits(), team.tiebreaker, team.playerName, array[oppIdx].playerName);
            team.getSocket().emit('prompt-move');
        });
    }
    
    recieveInput(battleId: string, socket: SocketIO.Socket, mover: number, move: string, baseTarget: BaseTarget){
        var battle: Battle = this._battleModel.findBattle(battleId);
        var target: Target = new Target(baseTarget.unit_slot, (baseTarget.team === "you") ? battle.getTeam(socket) : battle.getOpponent(socket));
        battle.getTeam(socket).recieveMove(move, target);
    }
    
    recieveSwitch(battleID: string, socket: SocketIO.Socket, unit_slot: number){
        var battle: Battle = this._battleModel.findBattle(battleID);
        battle.getTeam(socket).replaceUnit(unit_slot);
    }
    
    playerDisconnect(socket: SocketIO.Socket){
        var battles = this._battleModel.findPlayerBattles(socket);
            if(battles.length > 0){
                battles.forEach(function(battle){
                    battle.playerDisconnect(socket);
                });
            }
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
    
    findBattle(id: string): Battle{
        var match: Battle;
        this._battles.forEach(function(battle: Battle){
            if(battle.id === id){
                match = battle;
            }
        });
        return match;
    }
    
    findPlayerBattles(socket: SocketIO.Socket): Battle[]{
        var matches: Battle[] = new Array();
        this._battles.forEach(function(battle: Battle){
            if(battle.team1.getSocket().id === socket.id || battle.team2.getSocket().id === socket.id){
                matches.push(battle);
            }
        });
        return matches;
    }
}

class Battle{
    
    private _battleModel: BattleModel;
    team1: Team;
    team2: Team;
    id: string;
    battleLog: string[];
    
    constructor(battleModel: BattleModel, team1: Team, team2: Team){
        this._battleModel = battleModel;
        this.team1 = team1;
        this.team2 = team2;
        this.id = uuid.v4();
    }
    
    getTeam(socket: SocketIO.Socket){
        return (this.team1.getSocket().id === socket.id) ? this.team1 : this.team2;
    }
    
    getOpponent(socket: SocketIO.Socket){
        return (this.team1.getSocket().id === socket.id) ? this.team2 : this.team1;
    }
    
    actionSubmitted(){
        if(this.team1.isReady() && this.team2.isReady()){
            this.processTurn();
        }
    }
    
switchSubmitted(unitName: string, playerName: string){
        if(this.team1.getActiveUnit().health > 0 && this.team2.getActiveUnit().health > 0){
            this.battleLog.push(playerName + " sent out " + unitName);
            this.startTurn();
        }
    }
    
    processTurn(){
        var acting_units = [this.team1.getActiveUnit(), this.team2.getActiveUnit()];
        acting_units.sort(function(a, b){
            if(a.move.priority > b.move.priority){return -1}
            else if(a.move.priority < b.move.priority){return 1}
            else {return a.move.tiebreaker ? -1 : 1}
        });
        var battleLog: string[] = new Array();
        acting_units.forEach(function(unit){
            console.log(unit.move);
            if(unit.move.name === "attack" && unit.health > 0){
                var defendingUnit = unit.move.target.team.getActiveUnit();
                var damage: number = unit.move.damage*typeDamage(unit.primaryType, defendingUnit.primaryType, defendingUnit.secondaryType);
                defendingUnit.health -= damage;
                battleLog.push(unit.name + " attacked " + defendingUnit.name + " for " + damage.toString() + " damage!");
            } else if(unit.move.name === "switch" && unit.health > 0){
                var newActiveUnit = unit.move.target.team.getLivingUnits()[unit.move.target.unit_slot];
                unit.move.target.team.switchUnits(unit, newActiveUnit);
                battleLog.push(unit.name + " switched to " + newActiveUnit.name);
            }
        });
        this.battleLog = battleLog;
        this.endTurn();
    }
    
    startTurn(){
        this.team1.getSocket().emit('battle-info', this.team1.getLivingUnits(), this.team2.getLivingUnits(), this.team1.tiebreaker, this.battleLog);
        this.team2.getSocket().emit('battle-info', this.team2.getLivingUnits(), this.team1.getLivingUnits(), this.team2.tiebreaker, this.battleLog);
        this.battleLog = new Array();
        this.team1.promptMove();
        this.team2.promptMove();
    }
    
    endTurn(){
        this.team1.endTurn();
        this.team2.endTurn();
        this.team1.getSocket().emit('battle-info', this.team1.getLivingUnits(), this.team2.getLivingUnits(), this.team1.tiebreaker, this.battleLog);
        this.team2.getSocket().emit('battle-info', this.team2.getLivingUnits(), this.team1.getLivingUnits(), this.team2.tiebreaker, this.battleLog);
        this.battleLog = new Array();
        if(!this.team1.isAlive() || !this.team2.isAlive()){
            this.endGame(); 
        } else if(this.team1.getActiveUnit().health <= 0 || this.team2.getActiveUnit().health <= 0) {
            if(this.team1.getActiveUnit().health <= 0){
                var livingUnits: Unit[] = new Array();
                this.team1.getLivingUnits().forEach(function(unit){
                    if(unit.health > 0){
                        livingUnits.push(unit);
                    }
                });
                this.team1.getSocket().emit('prompt-switch', livingUnits);
            }
            if(this.team2.getActiveUnit().health <= 0){
                var livingUnits: Unit[] = new Array();
                this.team2.getLivingUnits().forEach(function(unit){
                    if(unit.health > 0){
                        livingUnits.push(unit);
                    }
                });
                this.team2.getSocket().emit('prompt-switch', livingUnits);
            }
        } else {
            this.startTurn();
        }
    }
    
    endGame(){
        this.team1.getSocket().emit('battle-over', this.team1.isAlive());
        this.team2.getSocket().emit('battle-over', this.team2.isAlive());
        this._battleModel.removeBattle(this);
    }
    
    playerDisconnect(socket: SocketIO.Socket){
        this.getOpponent(socket).getSocket().emit('battle-over', true);
    }
}

class Team{

    private _socket: SocketIO.Socket;
    private _living_units: Unit[];
    private _active_unit: Unit;
    private _battle: Battle;
    private _ready: boolean;
    playerName: string;
    tiebreaker: boolean;
    
    constructor(socket: SocketIO.Socket, playerName: string, baseTeam: BaseUnit[], tiebreaker: boolean){
        this._socket = socket;
        this.playerName = playerName;
        var units: Unit[] = new Array();
        baseTeam.forEach(function(unit){
            units.push(new Unit(unit));
        });
        this._living_units = units;
        this._active_unit = units[0];
        this.tiebreaker = tiebreaker;
    }
    
    setBattle(battle: Battle){
        this._battle = battle;
    }
    
    getSocket(): SocketIO.Socket{
        return this._socket;
    }
    
    getActiveUnit(): Unit{
        return this._active_unit;
    }
    
    getLivingUnits(): Unit[]{
        return this._living_units;
    }
    
    isReady(): boolean{
        return this._ready;
    }
    
    promptMove(){
        this._socket.emit('prompt-move');
    }
    
    promptSwitch(){
        this._socket.emit('prompt-switch');
    }
    
    endTurn(){
        this.switchTiebreaker();
        this._ready = false;
        this._living_units.forEach(function(unit){
            unit.move = null;
        });
        if (this._living_units.length === 1 && this._active_unit.health <= 0){
            this._living_units = []
        }
    }
    
    removeDeadUnits(){
        this._living_units.forEach(function(unit, index, array){
            if(unit.health <= 0){
                array.splice(index, 1);
            }
        });
    }
    
    isAlive(): boolean{
        return this._living_units.length > 0;
    }
    
    switchTiebreaker(){
        this.tiebreaker = !this.tiebreaker;
    }
    
    replaceUnit(unit_slot){
        this.switchUnits(this._active_unit, this._living_units[unit_slot]);
        this.removeDeadUnits();
        this._battle.switchSubmitted(this._active_unit.name, this.playerName);
    }
    
    switchUnits(unit1: Unit, unit2: Unit){
        var idx1 = this._living_units.indexOf(unit1);
        var idx2 = this._living_units.indexOf(unit2);
        var temp = this._living_units[idx1];
        this._living_units[idx1] = this._living_units[idx2];
        this._living_units[idx2] = temp;
        this._active_unit = this._living_units[0];
    }
    
    recieveMove(move: string, target: Target){
        var damage = (move === "attack") ? 4 : 0;
        var priority = (move === "attack") ? 0 : 1;
        this._active_unit.move = new Move(move, this._active_unit.primaryType, target, priority, damage, this.tiebreaker);
        this._ready = true;
        this._battle.actionSubmitted();
    }
}

class Unit{
    
    primaryType: Type;
    secondaryType: Type;
    name: string;
    health: number;
    move: Move;
    
    constructor(baseUnit: BaseUnit){
        this.primaryType = baseUnit.primaryType;
        this.secondaryType = baseUnit.secondaryType;
        this.name = baseUnit.name;
        this.health = 10;
    }
}


export interface BaseUnit{

    primaryType: Type;
    secondaryType: Type;
    name: string;
    
}

enum Type {"Fire", "Water", "Air", "Earth", "Flora", "Electric", "Ice", "Metal", "Light", "Dark", "Neutral"};

export interface BaseTarget{
    
    unit_slot: number;
    team: string;
}

class Target{
    
    unit_slot: number;
    team: Team;
    
    constructor(unit_slot: number, team: Team){
        this.unit_slot = unit_slot;
        this.team = team;
    }
}

class Move {
    
    name: string;
    type: Type;
    target: Target;
    priority: number;
    damage: number;
    tiebreaker: boolean;
    
    constructor(name: string, type: Type, target: Target, priority: number, damage: number, tiebreaker: boolean){
        this.name = name;
        this.type = type;
        this.target = target;
        this.priority = priority;
        this.damage = damage;
        this.tiebreaker = tiebreaker;
    }
}



/********** TYPES AND TYPE RELATED THINGS **********/

var typeMap = {};
var fireMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Fire":
            fireMap[Type[idx]] = 2;
            break;
        case "Water":
            fireMap[Type[idx]] = 2;
            break;
        case "Air":
            fireMap[Type[idx]] = 2;
            break;
        case "Earth":
            fireMap[Type[idx]] = 2;
            break;
        case "Flora":
            fireMap[Type[idx]] = 1/2;
            break;
        case "Ice":
            fireMap[Type[idx]] = 1/2;
            break;
        default:
            fireMap[Type[idx]] = 1;
    }
}
var waterMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Fire":
            waterMap[Type[idx]] = 1/2;
            break;
        case "Water":
            waterMap[Type[idx]] = 1/2;
            break;
        case "Flora":
            waterMap[Type[idx]] = 2;
            break;
        case "Electric":
            waterMap[Type[idx]] = 2;
            break;
        case "Ice":
            waterMap[Type[idx]] = 1/2;
            break;
        case "Metal":
            waterMap[Type[idx]] = 1/2;
            break;
        default:
            waterMap[Type[idx]] = 1;
    }
}
var airMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Earth":
            airMap[Type[idx]] = 1/2;
            break;
        case "Ice":
            airMap[Type[idx]] = 2;
            break;
        default:
            airMap[Type[idx]] = 1;
    }
}
var earthMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Water":
            earthMap[Type[idx]] = 2;
            break;
        case "Air":
            earthMap[Type[idx]] = 1/2;
            break;
        case "Earth":
            earthMap[Type[idx]] = 1/2;
            break;
        case "Flora":
            earthMap[Type[idx]] = 2;
            break;
        case "Electric":
            earthMap[Type[idx]] = 1/2;
            break;
        default:
            earthMap[Type[idx]] = 1;
    }
}
var floraMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Fire":
            floraMap[Type[idx]] = 2;
            break;
        case "Water":
            floraMap[Type[idx]] = 1/2;
            break;
        case "Air":
            floraMap[Type[idx]] = 2;
            break;
        case "Flora":
            floraMap[Type[idx]] = 1/2;
            break;
        case "Electric":
            floraMap[Type[idx]] = 1/2;
            break;
        case "Ice":
            floraMap[Type[idx]] = 2;
            break;
        default:
            floraMap[Type[idx]] = 1;
    }
}
var electricMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Earth":
            electricMap[Type[idx]] = 2;
            break;
        case "Electric":
            electricMap[Type[idx]] = 2;
            break;
        case "Metal":
            electricMap[Type[idx]] = 1/2;
            break;
        default:
            electricMap[Type[idx]] = 1;
    }
}
var iceMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Fire":
            iceMap[Type[idx]] = 2;
            break;
        case "Water":
            iceMap[Type[idx]] = 1/2;
            break;
        case "Metal":
            iceMap[Type[idx]] = 2;
            break;
        case "Dark":
            iceMap[Type[idx]] = 1/2;
            break;
        default:
            iceMap[Type[idx]] = 1;
    }
}
var metalMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Air":
            metalMap[Type[idx]] = 1/2;
            break;
        case "Earth":
            metalMap[Type[idx]] = 2;
            break;
        case "Light":
            metalMap[Type[idx]] = 1/2;
            break;
        default:
            metalMap[Type[idx]] = 1;
    }
}
var lightMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Metal":
            lightMap[Type[idx]] = 2;
            break;
        case "Light":
            lightMap[Type[idx]] = 1/2;
            break;
        default:
            lightMap[Type[idx]] = 1;
    }
}
var darkMap = {};
for(var idx = 0; idx < 11; idx++){
    switch(Type[idx]){
        case "Electric":
            darkMap[Type[idx]] = 2;
            break;
        case "Dark":
            darkMap[Type[idx]] = 2;
            break;
        default:
            darkMap[Type[idx]] = 1;
    }
}
var neutralMap = {};
for(var idx = 0; idx < 11; idx++){
    neutralMap[Type[idx]] = 1;
}

typeMap[Type.Fire] = fireMap;
typeMap[Type.Water] = waterMap;
typeMap[Type.Air] = airMap;
typeMap[Type.Earth] = earthMap;
typeMap[Type.Flora] = floraMap;
typeMap[Type.Electric] = electricMap;
typeMap[Type.Ice] = iceMap;
typeMap[Type.Metal] = metalMap;
typeMap[Type.Light] = lightMap;
typeMap[Type.Dark] = darkMap;
typeMap[Type.Neutral] = neutralMap;

function typeDamage(attackingType: Type, primaryType: Type, secondaryType: Type): number{
    console.log(typeMap[Type[primaryType]]);
    return typeMap[Type[primaryType]][attackingType] * typeMap[Type[secondaryType]][attackingType];
}