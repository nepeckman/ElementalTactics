var app = angular.module('playerViewApp', ['luegg.directives']).run(function($rootScope){
    $rootScope.userInfo = {room: "lobby", name: "", loggedIn: false, teamReady: false};
});
var socket = io();