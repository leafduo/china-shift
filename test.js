var request = require('request');
var fs = require('fs');
var async = require('async');
var util = require('util');

var map = JSON.parse(fs.readFileSync('beijing_shift.json'))

var accuracy = 0.01;
var roundLevel = 100;

var test = function(cood, callback) {
    var x = cood[0]
    ,y = cood[1];
    request(util.format('http://api.map.baidu.com/ag/coord/convert?from=2&to=4&x=%d&y=%d', x, y), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            if (json.error != 0) {
                console.log(json);
                return;
            }
            roundedX = Math.floor(x*roundLevel)/roundLevel;
            roundedY = Math.floor(y*roundLevel)/roundLevel;
            roundedX1 = Math.round((roundedX+accuracy)*roundLevel)/roundLevel;
            roundedY1 = Math.round((roundedY+accuracy)*roundLevel)/roundLevel;
            var baiduX = parseFloat(new Buffer(json.x, 'base64').toString()) - x;
            var baiduY = parseFloat(new Buffer(json.y, 'base64').toString()) - y;
            var ourX = (map[roundedX][roundedY][0] + map[roundedX1][roundedY][0] + map[roundedX][roundedY1][0] + map[roundedX1][roundedY1][0])/4
            var ourY = (map[roundedX][roundedY][1] + map[roundedX1][roundedY][1] + map[roundedX][roundedY1][1] + map[roundedX1][roundedY1][1])/4
            var diffX = (baiduX - ourX) * 111000;
            var diffY = (baiduY - ourY) * 111000;
            console.log("%d %d %d %d %d %d %d %d %d", Math.sqrt(diffX*diffX + diffY*diffY), x, y, baiduX, ourX, diffX, baiduY, ourY, diffY);
        } else {
            console.log(error);
        }
        callback();
    });
}

var minX = 39, maxX = 41.1;
var minY = 115.2, maxY = 117.5;

var list = [];
for (var i=0;i<1000;++i) {
    list.push([Math.random() * (maxX - minX) + minX, Math.random() * (maxY - minY) + minY]);
}

var q = async.queue(test, 20);
q.push(list, null);
