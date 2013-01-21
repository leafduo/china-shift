var request = require('request');
var util = require('util');
var async = require('async');
var mongojs = require('mongojs');

var db = mongojs('shift', ['shift']);

var convert = function(cood, callback) {
    var x = cood[0]
    ,y = cood[1];
    request(util.format('http://api.map.baidu.com/ag/coord/convert?from=0&to=2&x=%d&y=%d', x, y), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            if (json.error != 0) {
                console.log(json);
                return;
            }
            result = {}
            result.x = x;
            result.y = y;
            result.shiftX = parseFloat(new Buffer(json.x, 'base64').toString()) - result.x;
            result.shiftY = parseFloat(new Buffer(json.y, 'base64').toString()) - result.y;
            delete result.error;
            console.log(result);
            db.shift.insert(result);
        } else {
            console.log(error);
        }
        callback();
    });
}

var list = [];
for (var x = 0; 74 + x <= 135; x++) {
    for (var y = 0; 19 + y <= 53; y++) {
        list.push([74 + x, 19 + y]);
    }
}

var q = async.queue(convert, 20);
q.push(list, null);
