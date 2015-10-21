app.controller('battleViewCtrl', function($scope) {
    $scope.playerNames = {yourName: "", oppName: ""};
    $scope.battleID;
    $scope.battling = false;
    $scope.offensiveMatchup = false;
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
    
    $scope.unitMatchup = function(offensiveUnit, deffensiveUnit){
        return typeDamageFromString(offensiveUnit.primaryType, deffensiveUnit.primaryType, deffensiveUnit.secondaryType);
    }
    
    $scope.toggleMatchup = function(){
        $scope.offensiveMatchup = !$scope.offensiveMatchup;
    }
    
    socket.on('new-battle', function(id, yourTeam, oppTeam, tiebreaker, yourName, oppName){
        $scope.battleID = id;
        $scope.playerNames.yourName = yourName;
        $scope.playerNames.oppName = oppName;
        $scope.battling = true;
        $scope.userInfo.room = "battle";
        $scope.battleLog = new Array();
        $scope.battleLog.push(": Battle started between " + $scope.playerNames.yourName + " and " + $scope.playerNames.oppName + "!");
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
        socket.emit('battle-over');
        $scope.$apply();
    });
});