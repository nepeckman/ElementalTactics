app.controller('teambuildViewCtrl', function($scope){
    $scope.types = ["Fire", "Water", "Air", "Earth", "Flora", "Electric", "Ice", "Metal", "Light", "Dark"];
    var units = new Array();
    for(var idx = 0; idx < 5; idx++){
        units.push({name: "Unit " + (idx+1), primaryType: $scope.types[idx], secondaryType: "Neutral"});
    }
    $scope.units = units;
    
    $scope.changeTeam = function(){
        if($scope.userInfo.loggedIn){
            console.log('Sending a team change');
            $scope.userInfo.teamReady = true;
            socket.emit('team-change', $scope.units);
        }
    }

    $scope.defaultType = function(type, unit){
        if($scope.types.indexOf(type) === $scope.units.indexOf(unit)){
            return true;
        } else {
            return false;
        }
    }
});