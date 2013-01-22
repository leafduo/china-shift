var request = require('request');
var util = require('util');
var async = require('async');
var fs = require('fs');
var program = require('commander');

program
    .version('0.0.1')
    .option('--lat [range]', 'latitude range')
    .option('--lon [range]', 'longitude range')
    .parse(process.argv);

var result = {};
var accuracy = 0.01;
var roundLevel = 100;

var convert = function(coods, callback) {
    var x = []
    ,y = [];
    coods.forEach(function(element, index, array) {
        x.push(Math.round(element[0]*roundLevel)/roundLevel);
        y.push(Math.round(element[1]*roundLevel)/roundLevel);
    });
    request(util.format('http://api.map.baidu.com/ag/coord/convert?from=2&to=4&x=%s&y=%s&mode=1', x.join(','), y.join(',')), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            json.forEach(function(element, index, array) {
                var shiftX = parseFloat(new Buffer(json[index].x, 'base64').toString()) - x[index];
                var shiftY = parseFloat(new Buffer(json[index].y, 'base64').toString()) - y[index];
                data = util.format("%d %d %s %s\n", x[index], y[index], shiftX, shiftY);
                fs.appendFile('0.01.txt', data);
            });
            callback();
        } else {
            console.log(error, json);
        }
    });
}

if (!program.lat) {
    program.lat = '74,135';
}
if (!program.lon) {
    program.lon = '19,53';
}
var lat = program.lat.split(','),
    lon = program.lon.split(',');
var startX = parseFloat(lat[0]), endX = parseFloat(lat[1]),
    startY = parseFloat(lon[0]), endY = parseFloat(lon[1])

var list = [];
var i = 0;
var q = async.queue(convert, 16);

var x = 0,
y = 0;
function addTask() {
    for (; startX + x * accuracy <= endX;) {
        for (; startY + y * accuracy <= endY; y++) {
            list.push([startX + x * accuracy, startY + y * accuracy]);
            if (list.length == 20) {
                q.push([list], null);
                list = [];
            }
        }
        y = 0;
        ++x;
        return;
    }
}

addTask();
q.empty = addTask;
