app.controller('roomViewCtrl', function($scope) {
    $scope.startBattleRoom = function(){
        $scope.userInfo.room = "battle";
    }
    $scope.startLobbyRoom = function(){
        $scope.userInfo.room = "lobby";
    }
    $scope.startInfoRoom = function(){
        $scope.userInfo.room = "info";
    }
    $scope.startTeamRoom = function(){
        $scope.userInfo.room = "teambuilder";
    }
});