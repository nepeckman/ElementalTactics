app.controller('battleViewCtrl', function($scope) {
    $scope.yourTeam = [{name: "firemon", primaryType: "Fire", secondaryType: "Air"}, {name: "watermon", primaryType: "Water", secondaryType: "Ice"}];
    $scope.oppTeam = [{name: "airmon", primaryType: "Fire", secondaryType: "Air"}, {name: "icemon", primaryType: "Water", secondaryType: "Ice"}];
    $scope.yourActive = {name: "firemon", primaryType: "Fire", secondaryType: "Air"};
    $scope.oppActive = {name: "airmon", primaryType: "Fire", secondaryType: "Air"};
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