/********** TYPES AND TYPE RELATED THINGS **********/
var Type;
(function (Type) {
    Type[Type["Fire"] = 0] = "Fire";
    Type[Type["Water"] = 1] = "Water";
    Type[Type["Air"] = 2] = "Air";
    Type[Type["Earth"] = 3] = "Earth";
    Type[Type["Flora"] = 4] = "Flora";
    Type[Type["Electric"] = 5] = "Electric";
    Type[Type["Ice"] = 6] = "Ice";
    Type[Type["Metal"] = 7] = "Metal";
    Type[Type["Light"] = 8] = "Light";
    Type[Type["Dark"] = 9] = "Dark";
    Type[Type["Neutral"] = 10] = "Neutral";
})(Type || (Type = {}));
;
var TypeArray = [Type.Fire, Type.Water, Type.Air, Type.Earth, Type.Flora, Type.Electric, Type.Ice, Type.Metal, Type.Light, Type.Dark, Type.Neutral];
var typeMap = {};
var fireMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Fire":
            fireMap[Type[idx]] = 2;
            break;
        case "Water":
            fireMap[Type[idx]] = 2;
            break;
        case "Air":
            fireMap[Type[idx]] = 2;
            break;
        case "Earth":
            fireMap[Type[idx]] = 2;
            break;
        case "Flora":
            fireMap[Type[idx]] = 1 / 2;
            break;
        case "Ice":
            fireMap[Type[idx]] = 1 / 2;
            break;
        default:
            fireMap[Type[idx]] = 1;
    }
}
var waterMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Fire":
            waterMap[Type[idx]] = 1 / 2;
            break;
        case "Water":
            waterMap[Type[idx]] = 1 / 2;
            break;
        case "Flora":
            waterMap[Type[idx]] = 2;
            break;
        case "Electric":
            waterMap[Type[idx]] = 2;
            break;
        case "Ice":
            waterMap[Type[idx]] = 1 / 2;
            break;
        case "Metal":
            waterMap[Type[idx]] = 1 / 2;
            break;
        default:
            waterMap[Type[idx]] = 1;
    }
}
var airMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Earth":
            airMap[Type[idx]] = 1 / 2;
            break;
        case "Ice":
            airMap[Type[idx]] = 2;
            break;
        default:
            airMap[Type[idx]] = 1;
    }
}
var earthMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Water":
            earthMap[Type[idx]] = 2;
            break;
        case "Air":
            earthMap[Type[idx]] = 1 / 2;
            break;
        case "Earth":
            earthMap[Type[idx]] = 1 / 2;
            break;
        case "Flora":
            earthMap[Type[idx]] = 2;
            break;
        case "Electric":
            earthMap[Type[idx]] = 1 / 2;
            break;
        default:
            earthMap[Type[idx]] = 1;
    }
}
var floraMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Fire":
            floraMap[Type[idx]] = 2;
            break;
        case "Water":
            floraMap[Type[idx]] = 1 / 2;
            break;
        case "Air":
            floraMap[Type[idx]] = 2;
            break;
        case "Flora":
            floraMap[Type[idx]] = 1 / 2;
            break;
        case "Electric":
            floraMap[Type[idx]] = 1 / 2;
            break;
        case "Ice":
            floraMap[Type[idx]] = 2;
            break;
        default:
            floraMap[Type[idx]] = 1;
    }
}
var electricMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Earth":
            electricMap[Type[idx]] = 2;
            break;
        case "Electric":
            electricMap[Type[idx]] = 2;
            break;
        case "Metal":
            electricMap[Type[idx]] = 1 / 2;
            break;
        default:
            electricMap[Type[idx]] = 1;
    }
}
var iceMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Fire":
            iceMap[Type[idx]] = 2;
            break;
        case "Water":
            iceMap[Type[idx]] = 1 / 2;
            break;
        case "Metal":
            iceMap[Type[idx]] = 2;
            break;
        case "Dark":
            iceMap[Type[idx]] = 1 / 2;
            break;
        default:
            iceMap[Type[idx]] = 1;
    }
}
var metalMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Air":
            metalMap[Type[idx]] = 1 / 2;
            break;
        case "Earth":
            metalMap[Type[idx]] = 2;
            break;
        case "Light":
            metalMap[Type[idx]] = 1 / 2;
            break;
        default:
            metalMap[Type[idx]] = 1;
    }
}
var lightMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Metal":
            lightMap[Type[idx]] = 2;
            break;
        case "Light":
            lightMap[Type[idx]] = 1 / 2;
            break;
        default:
            lightMap[Type[idx]] = 1;
    }
}
var darkMap = {};
for (var idx = 0; idx < 11; idx++) {
    switch (Type[idx]) {
        case "Electric":
            darkMap[Type[idx]] = 2;
            break;
        case "Dark":
            darkMap[Type[idx]] = 2;
            break;
        default:
            darkMap[Type[idx]] = 1;
    }
}
var neutralMap = {};
for (var idx = 0; idx < 11; idx++) {
    neutralMap[Type[idx]] = 1;
}
typeMap[Type.Fire] = fireMap;
typeMap[Type.Water] = waterMap;
typeMap[Type.Air] = airMap;
typeMap[Type.Earth] = earthMap;
typeMap[Type.Flora] = floraMap;
typeMap[Type.Electric] = electricMap;
typeMap[Type.Ice] = iceMap;
typeMap[Type.Metal] = metalMap;
typeMap[Type.Light] = lightMap;
typeMap[Type.Dark] = darkMap;
typeMap[Type.Neutral] = neutralMap;
function typeDamage(attackingType, primaryType, secondaryType) {
    return typeMap[primaryType][Type[attackingType]] * typeMap[secondaryType][Type[attackingType]];
}
function stringToType(s) {
    switch (s) {
        case 'Fire':
            return Type.Fire;
            break;
        case 'Water':
            return Type.Water;
            break;
        case 'Air':
            return Type.Air;
            break;
        case 'Earth':
            return Type.Earth;
            break;
        case 'Flora':
            return Type.Flora;
            break;
        case 'Electric':
            return Type.Electric;
            break;
        case 'Ice':
            return Type.Ice;
            break;
        case 'Metal':
            return Type.Metal;
            break;
        case 'Light':
            return Type.Light;
            break;
        case 'Dark':
            return Type.Dark;
            break;
        default:
            return Type.Neutral;
    }
}
function typeDamageFromString(attackingType, primaryType, secondaryType) {
    return typeDamage(stringToType(attackingType), stringToType(primaryType), stringToType(secondaryType));
}
function defensiveTypeMatchup(primaryTypeString, secondaryTypeString) {
    var matchups = new Array();
    var primaryType = stringToType(primaryTypeString);
    var secondaryType = stringToType(secondaryTypeString);
    TypeArray.forEach(function (type) {
        matchups.push({ type: type, effectiveness: typeDamage(type, primaryType, secondaryType) });
    });
    return matchups;
}
function offensiveTypeMatchup(primaryTypeString) {
    var matchups = new Array();
    var offensive_type = stringToType(primaryTypeString);
    TypeArray.forEach(function (type) {
        matchups.push({ type: type, effectiveness: typeDamage(offensive_type, type, Type.Neutral) });
    });
    return matchups;
}
