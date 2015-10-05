app.controller('battleViewCtrl', function($scope) {
    //$scope.yourTeam = [{name: "firemon", primaryType: "Fire", secondaryType: "Air", health: 10}, {name: "watermon", primaryType: "Water", secondaryType: "Ice", health: 10}];
    //$scope.oppTeam = [{name: "airmon", primaryType: "Fire", secondaryType: "Air", health: 10}, {name: "icemon", primaryType: "Water", secondaryType: "Ice", health: 10}];
    //$scope.yourActive = $scope.yourTeam[0];
    //$scope.oppActive = $scope.oppTeam[0];
    
    var submitMove = function(move, target){
        socket.emit('battle-input', move, target);
    }
    $scope.processMove = function(){
        if($scope.playerMove === "switch"){
            $scope.promptSwitch = true;
        } else if($scope.playerMove === "attack") {
            submitMove("attack");
        }
    }
    $scope.submitSwitch = function(){
        submitMove("switch", $scope.switchTarget);
    }
    
});