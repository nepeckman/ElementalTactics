///<reference path='../typings/socket.io.d.ts' />
///<reference path='../typings/node-uuid.d.ts' />
var uuid = require('node-uuid');
var type_mod = require('./typeModule');
var BattleController = (function () {
    function BattleController() {
        this._battleModel = new BattleModel();
    }
    BattleController.prototype.newBattle = function (player1, player2) {
        player1.setBattleStatus(true);
        player2.setBattleStatus(true);
        var tiebreaker = Math.random() < .5;
        var team1 = new Team(player1.getSocket(), player1.getUsername(), player1.getBaseTeam(), tiebreaker);
        var team2 = new Team(player2.getSocket(), player2.getUsername(), player2.getBaseTeam(), !tiebreaker);
        // TODO: add id to constuctor
        var battle = new Battle(this._battleModel, team1, team2);
        this._battleModel.addBattle(battle);
        [team1, team2].forEach(function (team, index, array) {
            team.setBattle(battle);
            var oppIdx = (index === 0) ? 1 : 0;
            team.getSocket().emit('new-battle', battle.id, team.getLivingUnits(), array[oppIdx].getLivingUnits(), team.tiebreaker, team.playerName, array[oppIdx].playerName);
            team.getSocket().emit('prompt-move');
        });
    };
    BattleController.prototype.recieveInput = function (battleId, socket, mover, move, baseTarget) {
        var battle = this._battleModel.findBattle(battleId);
        var target = new Target(baseTarget.unit_slot, (baseTarget.team === "you") ? battle.getTeam(socket) : battle.getOpponent(socket));
        battle.getTeam(socket).recieveMove(move, target);
    };
    BattleController.prototype.recieveSwitch = function (battleID, socket, unit_slot) {
        var battle = this._battleModel.findBattle(battleID);
        battle.getTeam(socket).replaceUnit(unit_slot);
    };
    BattleController.prototype.playerDisconnect = function (socket) {
        var battles = this._battleModel.findPlayerBattles(socket);
        if (battles.length > 0) {
            battles.forEach(function (battle) {
                battle.playerDisconnect(socket);
            });
        }
    };
    return BattleController;
})();
exports.BattleController = BattleController;
var BattleModel = (function () {
    function BattleModel() {
        this._battles = new Array();
    }
    BattleModel.prototype.addBattle = function (battle) {
        this._battles.push(battle);
    };
    BattleModel.prototype.removeBattle = function (battle) {
        var index = this._battles.indexOf(battle);
        if (index > -1) {
            this._battles.splice(index, 1);
        }
    };
    BattleModel.prototype.findBattle = function (id) {
        var match;
        this._battles.forEach(function (battle) {
            if (battle.id === id) {
                match = battle;
            }
        });
        return match;
    };
    BattleModel.prototype.findPlayerBattles = function (socket) {
        var matches = new Array();
        this._battles.forEach(function (battle) {
            if (battle.team1.getSocket().id === socket.id || battle.team2.getSocket().id === socket.id) {
                matches.push(battle);
            }
        });
        return matches;
    };
    return BattleModel;
})();
var Battle = (function () {
    function Battle(battleModel, team1, team2) {
        this._battleModel = battleModel;
        this.team1 = team1;
        this.team2 = team2;
        this.id = uuid.v4();
    }
    Battle.prototype.getTeam = function (socket) {
        return (this.team1.getSocket().id === socket.id) ? this.team1 : this.team2;
    };
    Battle.prototype.getOpponent = function (socket) {
        return (this.team1.getSocket().id === socket.id) ? this.team2 : this.team1;
    };
    Battle.prototype.actionSubmitted = function () {
        if (this.team1.isReady() && this.team2.isReady()) {
            this.processTurn();
        }
    };
    Battle.prototype.switchSubmitted = function (unitName, playerName) {
        if (this.team1.getActiveUnit().health > 0 && this.team2.getActiveUnit().health > 0) {
            this.battleLog.push(playerName + " sent out " + unitName);
            this.startTurn();
        }
    };
    Battle.prototype.processTurn = function () {
        var acting_units = [this.team1.getActiveUnit(), this.team2.getActiveUnit()];
        acting_units.sort(function (a, b) {
            if (a.move.priority > b.move.priority) {
                return -1;
            }
            else if (a.move.priority < b.move.priority) {
                return 1;
            }
            else {
                return a.move.tiebreaker ? -1 : 1;
            }
        });
        var battleLog = new Array();
        acting_units.forEach(function (unit) {
            console.log(unit.move);
            if (unit.move.name === "attack" && unit.health > 0) {
                var defendingUnit = unit.move.target.team.getActiveUnit();
                var damage = unit.move.damage * type_mod.typeDamage(unit.primaryType, defendingUnit.primaryType, defendingUnit.secondaryType);
                defendingUnit.health -= damage;
                battleLog.push(unit.name + " attacked " + defendingUnit.name + " for " + damage.toString() + " damage!");
            }
            else if (unit.move.name === "switch" && unit.health > 0) {
                var newActiveUnit = unit.move.target.team.getLivingUnits()[unit.move.target.unit_slot];
                unit.move.target.team.switchUnits(unit, newActiveUnit);
                battleLog.push(unit.name + " switched to " + newActiveUnit.name);
            }
        });
        this.battleLog = battleLog;
        this.endTurn();
    };
    Battle.prototype.startTurn = function () {
        this.team1.getSocket().emit('battle-info', this.team1.getLivingUnits(), this.team2.getLivingUnits(), this.team1.tiebreaker, this.battleLog);
        this.team2.getSocket().emit('battle-info', this.team2.getLivingUnits(), this.team1.getLivingUnits(), this.team2.tiebreaker, this.battleLog);
        this.battleLog = new Array();
        this.team1.promptMove();
        this.team2.promptMove();
    };
    Battle.prototype.endTurn = function () {
        this.team1.endTurn();
        this.team2.endTurn();
        this.team1.getSocket().emit('battle-info', this.team1.getLivingUnits(), this.team2.getLivingUnits(), this.team1.tiebreaker, this.battleLog);
        this.team2.getSocket().emit('battle-info', this.team2.getLivingUnits(), this.team1.getLivingUnits(), this.team2.tiebreaker, this.battleLog);
        this.battleLog = new Array();
        if (!this.team1.isAlive() || !this.team2.isAlive()) {
            this.endGame();
        }
        else if (this.team1.getActiveUnit().health <= 0 || this.team2.getActiveUnit().health <= 0) {
            if (this.team1.getActiveUnit().health <= 0) {
                var livingUnits = new Array();
                this.team1.getLivingUnits().forEach(function (unit) {
                    if (unit.health > 0) {
                        livingUnits.push(unit);
                    }
                });
                this.team1.getSocket().emit('prompt-switch', livingUnits);
            }
            if (this.team2.getActiveUnit().health <= 0) {
                var livingUnits = new Array();
                this.team2.getLivingUnits().forEach(function (unit) {
                    if (unit.health > 0) {
                        livingUnits.push(unit);
                    }
                });
                this.team2.getSocket().emit('prompt-switch', livingUnits);
            }
        }
        else {
            this.startTurn();
        }
    };
    Battle.prototype.endGame = function () {
        this.team1.getSocket().emit('battle-over', this.team1.isAlive());
        this.team2.getSocket().emit('battle-over', this.team2.isAlive());
        this._battleModel.removeBattle(this);
    };
    Battle.prototype.playerDisconnect = function (socket) {
        this.getOpponent(socket).getSocket().emit('battle-over', true);
    };
    return Battle;
})();
var Team = (function () {
    function Team(socket, playerName, baseTeam, tiebreaker) {
        this._socket = socket;
        this.playerName = playerName;
        var units = new Array();
        baseTeam.forEach(function (unit) {
            units.push(new Unit(unit));
        });
        this._living_units = units;
        this._active_unit = units[0];
        this.tiebreaker = tiebreaker;
    }
    Team.prototype.setBattle = function (battle) {
        this._battle = battle;
    };
    Team.prototype.getSocket = function () {
        return this._socket;
    };
    Team.prototype.getActiveUnit = function () {
        return this._active_unit;
    };
    Team.prototype.getLivingUnits = function () {
        return this._living_units;
    };
    Team.prototype.isReady = function () {
        return this._ready;
    };
    Team.prototype.promptMove = function () {
        this._socket.emit('prompt-move');
    };
    Team.prototype.promptSwitch = function () {
        this._socket.emit('prompt-switch');
    };
    Team.prototype.endTurn = function () {
        this.switchTiebreaker();
        this._ready = false;
        this._living_units.forEach(function (unit) {
            unit.move = null;
        });
        if (this._living_units.length === 1 && this._active_unit.health <= 0) {
            this._living_units = [];
        }
    };
    Team.prototype.removeDeadUnits = function () {
        this._living_units.forEach(function (unit, index, array) {
            if (unit.health <= 0) {
                array.splice(index, 1);
            }
        });
    };
    Team.prototype.isAlive = function () {
        return this._living_units.length > 0;
    };
    Team.prototype.switchTiebreaker = function () {
        this.tiebreaker = !this.tiebreaker;
    };
    Team.prototype.replaceUnit = function (unit_slot) {
        this.switchUnits(this._active_unit, this._living_units[unit_slot]);
        this.removeDeadUnits();
        this._battle.switchSubmitted(this._active_unit.name, this.playerName);
    };
    Team.prototype.switchUnits = function (unit1, unit2) {
        var idx1 = this._living_units.indexOf(unit1);
        var idx2 = this._living_units.indexOf(unit2);
        var temp = this._living_units[idx1];
        this._living_units[idx1] = this._living_units[idx2];
        this._living_units[idx2] = temp;
        this._active_unit = this._living_units[0];
    };
    Team.prototype.recieveMove = function (move, target) {
        var damage = (move === "attack") ? 4 : 0;
        var priority = (move === "attack") ? 0 : 1;
        this._active_unit.move = new Move(move, this._active_unit.primaryType, target, priority, damage, this.tiebreaker);
        this._ready = true;
        this._battle.actionSubmitted();
    };
    return Team;
})();
var Unit = (function () {
    function Unit(baseUnit) {
        this.primaryType = baseUnit.primaryType;
        this.secondaryType = baseUnit.secondaryType;
        this.name = baseUnit.name;
        this.health = 10;
    }
    return Unit;
})();
var Target = (function () {
    function Target(unit_slot, team) {
        this.unit_slot = unit_slot;
        this.team = team;
    }
    return Target;
})();
var Move = (function () {
    function Move(name, type, target, priority, damage, tiebreaker) {
        this.name = name;
        this.type = type;
        this.target = target;
        this.priority = priority;
        this.damage = damage;
        this.tiebreaker = tiebreaker;
    }
    return Move;
})();
