var app = angular.module('playerViewApp', []);
app.controller('playerViewCtrl', function($scope) {
    var socket = io();
    
    $scope.username = {name: "", loggedIn: false};
    $scope.isChallenging = false;
    $scope.isChallenged = false;
    $scope.userlist = new Array();
    var units = new Array();
    for(var idx = 0; idx < 5; idx++){
        units.push({name: "Unit " + (idx+1), primaryType: "", secondaryType: ""});
    }
    $scope.units = units;
    $scope.types = ["Fire", "Water", "Air", "Earth", "Plant", "Electric", "Ice", "Metal", "Light", "Dark"];
    
    $scope.changeName = function(){
        if($scope.username.loggedIn === false){
            console.log("Logging in");
            socket.emit('login', $scope.newName);
            $scope.username.loggedIn = true;
        } else {
            console.log('Changing name to' + $scope.newName);
            socket.emit('name-change', $scope.newName);
        }
        $scope.username.name = $scope.newName;
    }
    $scope.promptChallenge = function(user){
        if(user !== $scope.username.name){
            $scope.isChallenging = true;
            $scope.challengedUser = user;
        }
    }
    $scope.submitChallenge = function(){
        console.log('Challenging ' + $scope.challengedUser);
        socket.emit('challenge', $scope.challengedUser);
        $scope.isChallenging = false;
    }
    $scope.cancelChallenge = function(){
        $scope.isChallenging = false;
        $scope.challengedUser = "";
    }
    $scope.acceptChallenge = function(){
        console.log('Challenge accepted');
        socket.emit('new-battle', $scope.username, $scope.challengingUser);
        $scope.isChallenged= false;
    }
    $scope.rejectChallenge = function(){
        console.log('Sending a rejection');
        socket.emit('reject-battle', $scope.challengingUser);
        $scope.isChallenged= false;
    }
    $scope.changeTeam = function(){
        console.log('Sending a team change');
        socket.emit('team-change', $scope.units);
    }
    
    var compareFunction = function(a,b) {
            if(a.toLowerCase() > b.toLowerCase()){return 1;}
            else if(a.toLowerCase() < b.toLowerCase()){return -1;}
            else{return 0;}
    }
    
    socket.on('userlist', function(userlist){
        console.log("Initial userlist");
        $scope.userlist = userlist;
        $scope.userlist.sort(compareFunction);
        $scope.$apply();
    });
    socket.on('new-user', function(user){
        console.log(user + " joined the chat");
        $scope.userlist.push(user);
        $scope.userlist.sort(compareFunction);
        $scope.$apply();
    });
    socket.on('name-change', function(oldName, newName){
        console.log(oldName + " changed to " + newName);
        $scope.userlist.forEach(function(name){
            if(name === oldName){
                name = newName;
            }
        });
        $scope.$apply();
    });
    socket.on('battle-request', function(user){
        console.log(user + " wants to battle");
        $scope.isChallenged = true;
        $scope.challeningUser = user;
    });
    socket.on('rejected-battle', function(){
        console.log('Your battle was rejected');
        $scope.isChallenging = false;
    });
});
