var request = require('request');
var util = require('util');
var async = require('async');
var fs = require('fs');

var result = {};

var convert = function(cood, callback) {
    var x = Math.round(cood[0]*10)/10
    ,y = Math.round(cood[1]*10)/10;
    request(util.format('http://api.map.baidu.com/ag/coord/convert?from=2&to=4&x=%d&y=%d', x, y), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            if (json.error != 0) {
                console.log(json);
                return;
            }
            var shiftX = parseFloat(new Buffer(json.x, 'base64').toString()) - x;
            var shiftY = parseFloat(new Buffer(json.y, 'base64').toString()) - y;
            if (!result.hasOwnProperty(x)) {
                result[x] = {}
            }
            result[x][y] = [shiftX, shiftY];
            console.log(x);
        } else {
            console.log(error);
            console.log("%d %d", x, y);
        }
        callback();
    });
}

var list = [];
for (var x = 0; 74 + x * 0.1 <= 135; x++) {
    for (var y = 0; 19 + y * 0.1 <= 53; y++) {
        list.push([74 + x * 0.1, 19 + y * 0.1]);
    }
}

var q = async.queue(convert, 20);
q.push(list, null);
q.drain = function() {
    fs.writeFileSync('shift_gcj02_bd09.json', util.format("%j", result))
}
