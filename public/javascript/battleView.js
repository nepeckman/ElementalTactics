app.controller('battleViewCtrl', function($scope) {
    var battleID;
    var yourName;
    var oppName;
    var mover = 0; // Active unit is always acting
    $scope.switchTarget = {unit_slot: null, team: "you"};
    $scope.battleLog = new Array();
    
    var submitMove = function(move, target){
        socket.emit('battle-input', battleID, mover, move, target);
        $scope.recievingAction = false;
        $scope.promptSwitch = false;
    }
    
    var updateView = function(yourTeam, oppTeam, tiebreaker){
        $scope.yourTeam = yourTeam;
        $scope.yourActive = yourTeam[0];
        $scope.oppTeam = oppTeam;
        $scope.oppActive = oppTeam[0];
        $scope.tiebreaker = (tiebreaker) ? "win ties" : "lose ties";
        $scope.$apply();
    }
    
    $scope.processMove = function(){
        if($scope.playerMove === "switch"){
            $scope.promptSwitch = true;
        } else if($scope.playerMove === "attack") {
            submitMove("attack", {unit_slot: 0, team: "opp"});
        }
    }
    $scope.submitSwitch = function(){
        console.log($scope.switchTarget);
        console.log($scope.yourTeam);
        submitMove("switch", $scope.switchTarget);
        $scope.promptSwitch = false;
    }
    
    $scope.submitReplacement = function(){
        socket.emit('battle-switch', battleID, $scope.switchTarget.unit_slot);
        $scope.recievingReplacement = false;
    }
    
    socket.on('new-battle', function(id, yourTeam, oppTeam, tiebreaker, _yourName, _oppName){
        battleID = id;
        yourName = _yourName;
        oppName = _oppName;
        $scope.battleLog = new Array();
        $scope.battleLog.push(": Battle started between " + yourName + " and " + oppName + "!");
        updateView(yourTeam, oppTeam, tiebreaker);
    });
    
    socket.on('prompt-move', function(){
        console.log('Move prompted');
        $scope.recievingAction = true;
        $scope.$apply();
    });
    
    socket.on('prompt-switch', function(livingUnits){
        $scope.recievingReplacement = true;
        $scope.livingUnits = livingUnits;
        $scope.$apply();
    });
    
    socket.on('battle-info', function(yourTeam, oppTeam, tiebreaker, battleLog){
        if(battleLog.length > 0){
            battleLog.forEach(function(entry){
                $scope.battleLog.push(": " + entry);
            });
        }
        updateView(yourTeam, oppTeam, tiebreaker);
    });
    
    socket.on('battle-over', function(winner){
        if(winner){
            $scope.battleLog.push("You win!");
        } else {
            $scope.battleLog.push("Your opponent wins!");
        }
        $scope.yourTeam =null;
        $scope.yourActive = null;
        $scope.oppTeam = null;
        $scope.oppActive = null;
        $scope.tiebreaker = null;
    });
});