app.controller('teambuildViewCtrl', function($scope){
    $scope.types = ["Fire", "Water", "Air", "Earth", "Flora", "Electric", "Ice", "Metal", "Light", "Dark",];
    var units = new Array();
    for(var idx = 0; idx < 5; idx++){
        units.push({name: "Unit " + (idx+1), primaryType: $scope.types[idx], secondaryType: "Neutral"});
    }
    $scope.units = units;
    $scope.offensiveMatches = false;
    
    $scope.toggleMatchups = function(){
        $scope.offensiveMatches = !$scope.offensiveMatches;
    }
    
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
    
    $scope.typeDamage = function(attackingType, primaryType, secondaryType){
        return typeDamageFromString(attackingType, primaryType, secondaryType)
    }
    
    $scope.teamResists = function(type){
        var resists = 0;
        $scope.units.forEach(function(unit){
            if(typeDamageFromString(type, unit.primaryType, unit.secondaryType) < 1){
                resists++;
            }
        });
        return resists;
    }
    
    $scope.teamWeaknesses = function(type){
        var weaknesses = 0;
        $scope.units.forEach(function(unit){
            if(typeDamageFromString(type, unit.primaryType, unit.secondaryType) > 1){
                weaknesses++;
            }
        });
        return weaknesses;
    }
    
    $scope.teamEffective = function(type){
        var effective = 0;
        $scope.units.forEach(function(unit){
            if(typeDamageFromString(unit.primaryType, type, 'Neutral') > 1){
                effective++;
            }
        });
        return effective;
    }
    
    $scope.teamIneffective = function(type){
        var ineffective = 0;
        $scope.units.forEach(function(unit){
            if(typeDamageFromString(unit.primaryType, type, 'Neutral') < 1){
                ineffective++;
            }
        });
        return ineffective;
    }
});