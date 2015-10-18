app.controller('playerViewCtrl', function($scope) {
    $scope.isChallenging = false;
    $scope.isChallenged = false;
    $scope.userlist = new Array();
    $scope.lobbyMsgs = new Array();
    $scope.lobbyMsg = "";

    $scope.changeName = function(){
        var name_taken = false;
        $scope.userlist.forEach(function(user){
            if($scope.newName.toLowerCase() === user.name.toLowerCase()){
                name_taken = true;
            }
        });
        if($scope.newName === "" || $scope.newName.toLowerCase() === "alertbot"){
            name_taken = true;
        }
        if(!name_taken){
            if($scope.userInfo.loggedIn === false){
                console.log("Logging in");
                socket.emit('login', $scope.newName);
                $scope.userInfo.loggedIn = true;
            } else {
                console.log('Changing name to' + $scope.newName);
                socket.emit('name-change', $scope.newName);
            }
            $scope.userInfo.name = $scope.newName;
        } else {
            $scope.lobbyMsgs.push("ALERTBOT: That name is taken!");
        }
    }
    $scope.lobbyMessage = function(){
        if($scope.userInfo.loggedIn){
            console.log('Message sent: ' + $scope.lobbyMsg);
            var msg = $scope.userInfo.name + ": " + $scope.lobbyMsg;
            socket.emit('lobby-message', msg);
            $scope.lobbyMsg = "";
        }
    }
    $scope.promptChallenge = function(user){
        if(user !== $scope.userInfo.name && $scope.userInfo.loggedIn && $scope.userInfo.teamReady){
            $scope.isChallenging = true;
            $scope.challengedUser = user;
        } else if(!$scope.userInfo.teamReady){
            $scope.lobbyMsgs.push("ALERTBOT: Please build a team before challenging!");
        }
        $scope.$apply();
    }
    $scope.submitChallenge = function(){
        if($scope.userInfo.loggedIn){
            console.log('Challenging ' + $scope.challengedUser);
            $scope.lobbyMsgs.push("ALERTBOT: You are challenging " + $scope.challengedUser);
            socket.emit('challenge', $scope.challengedUser);
            $scope.isChallenging = false;
        }
        $scope.$apply();
    }
    $scope.cancelChallenge = function(){
        $scope.isChallenging = false;
        $scope.challengedUser = "";
    }
    $scope.acceptChallenge = function(){
        if($scope.userInfo.loggedIn && $scope.userInfo.teamReady){
            console.log('Challenge accepted');
            socket.emit('new-battle', $scope.userInfo.name, $scope.challengingUser);
            $scope.isChallenged= false;
        } else if (!$scope.userInfo.teamReady){
            $scope.lobbyMsgs.push("ALERTBOT: Please build a team before accepting!");
        }
        $scope.$apply();
    }
    $scope.rejectChallenge = function(){
        console.log('Sending a rejection');
        $scope.lobbyMsgs.push("ALERTBOT: You rejected the challenge.");
        socket.emit('reject-battle', $scope.challengingUser);
        $scope.isChallenged= false;
        $scope.$apply();
    }
    
    var compareFunction = function(a,b) {
            if(a.name.toLowerCase() > b.name.toLowerCase()){return 1;}
            else if(a.name.toLowerCase() < b.name.toLowerCase()){return -1;}
            else{return 0;}
    }
    
    socket.on('userlist', function(userlist){
        console.log("Initial userlist");
        userlist.forEach(function(user){
            $scope.userlist.push({name: user});
        });
        $scope.userlist.sort(compareFunction);
        $scope.$apply();
    });
    socket.on('new-user', function(user){
        console.log(user + " joined the chat");
        $scope.lobbyMsgs.push("ALERTBOT: " + user + " joined.");
        $scope.userlist.push({name: user});
        $scope.userlist.sort(compareFunction);
        $scope.$apply();
    });
    socket.on('name-change', function(oldName, newName){
        console.log(oldName + " changed to " + newName);
        $scope.lobbyMsgs.push("ALERTBOT: " + oldName + " changed to " + newName);
        $scope.userlist.forEach(function(user){
            if(user.name === oldName){
                user.name = newName;
            }
        });
        $scope.$apply();
    });
    socket.on('user-gone', function(disconnectedUser){
        console.log(disconnectedUser + " disconnected");
        $scope.lobbyMsgs.push("ALERTBOT: " + disconnectedUser + " disconnected");
        $scope.userlist.forEach(function(user, index, array){
            if(user.name === disconnectedUser){
                array.splice(index, 1);
            }
        });
        $scope.$apply();
    });
    socket.on('lobby-message', function(msg){
        console.log('Message recieved: ' + msg);
        $scope.lobbyMsgs.push(msg);
        $scope.$apply();
    });
    socket.on('battle-request', function(user){
        console.log(user + " wants to battle");
        $scope.lobbyMsgs.push("ALERTBOT: " + user + " wants to battle!");
        $scope.isChallenged = true;
        $scope.challengingUser = user;
        $scope.$apply();
    });
    socket.on('rejected-battle', function(){
        $scope.lobbyMsgs.push("ALERTBOT: Your battle request was rejected!");
        console.log('Your battle was rejected');
        $scope.isChallenging = false;
        $scope.$apply();
    });
    socket.on('player-busy', function(){
        $scope.lobbyMsgs.push("ALERTBOT: Player is busy!");
        console.log('Your battle was rejected');
        $scope.$apply();
    });
});
