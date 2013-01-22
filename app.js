var request = require('request');
var util = require('util');
var async = require('async');
var fs = require('fs');

var result = {};
var accuracy = 0.01;
var roundLevel = 100;

var convert = function(cood, callback) {
    var x = Math.round(cood[0]*roundLevel)/roundLevel
    ,y = Math.round(cood[1]*roundLevel)/roundLevel;
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
var startX = 39, endX = 41.1, startY = 115.2, endY = 117.5
for (var x = 0; startX + x * accuracy <= endX; x++) {
    for (var y = 0; startY + y * accuracy <= endY; y++) {
        list.push([startX + x * accuracy, startY + y * accuracy]);
    }
}

var q = async.queue(convert, 20);
q.push(list, null);
q.drain = function() {
    fs.writeFileSync('beijing_shift.json', util.format("%j", result))
}
