var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;
var url = require('url');    
var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('lazy', server);
var http = require('http');
var time = require('time');

var stopCache = {};
var stopArray = [];

Date.prototype.addMilliseconds = function(value) {
  this.setMilliseconds(this.getMilliseconds() + value);
  return this;
};

Date.prototype.addHours = function(value) {
  this.addMilliseconds(value * 60*60*1000);
};

db.collection('stops', function(err, collection) {
  collection.find({}, {}, function(err, cursor) {
    cursor.toArray(function(err, items) {
      stopArray = items;
      for (var i=0; i<items.length; i++) {
        stopCache[items[i].stop_id] = items[i];
      }
    });
  });  
});

function getBuses(stopId, callback) {
    
  db.collection('times', { sort: { 'ArrivalTime': -1}}, function(err, collection) {
    collection.find({ StopId: parseInt(stopId) }, { limit: 1000 }, function(err, cursor) {
      cursor.toArray(function(err, items) {
        callback(err, items, stopId);
      });
    });
  });
    
}

function printStopOutput(response, stops) {
  var stopArray = [];
  for (var i in stops) {
    stopArray.push(stops[i]);
  }
  var output = '{"stops" : ' + JSON.stringify(stopArray) + '}';                
  response.end(output);
}

var ignoreStops = {};

function getStops(response, longitude, latitude) {
  
  console.log('Fetching buses for %s, %s', longitude, latitude);
  
  var qlat = parseFloat(latitude);
  var qlong = parseFloat(longitude);
    
  function getDist(slong, slat, qlong, qlat) {
    var dlong = Math.pow(qlong - slong, 2);
    var dlat = Math.pow(qlat - slat, 2);
    return Math.sqrt(dlong + dlat);
  }
  
  var items = stopArray;
        
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");

  for (var i=0; i<items.length; i++) {
    items[i].dist = getDist(parseFloat(items[i].stop_lon), parseFloat(items[i].stop_lat), qlong, qlat);
  }
  
  items.sort(function(a,b){
    return (a.dist-b.dist);
  });
  
  var stops = {};
  var count = 20;
            
  for (var i=0; i<20; i++) {
  
    var stop = {};
    
    stop['routeNumber'] = '';
    stop['arrivalTime'] = 'Unknown';
    stop['routeNumber'] = '';
    
    if (items[i].hasOwnProperty('stop_desc')) {
      try {
        var direction = items[i].stop_desc.split(',')[1];
        stop['routeDirection'] = direction.replace(' ', '');
      } catch(e) {
        stop['routeDirection'] = 'Unknown';
      }          
    } else {
      stop['routeDirection'] = 'Unknown';
    }
    
    stop['stopId'] = items[i].stop_id;
    stop['stopName'] = items[i].stop_name;
    stop['latitude'] = items[i].stop_lat;
    stop['longitude'] = items[i].stop_lon;
    stop['nextStops'] = [];
    
    stops[items[i].stop_id] = stop;
    
    if (ignoreStops.hasOwnProperty(items[i].stop_id)) {
      count--;
      continue;
    }
    
    getBuses(items[i].stop_id, function(err, items, stopId) {
            
      count--;
                  
      if (items.length === 0) {
        
        if (count === 0) {
          ignoreStops[stopId] = true;
          printStopOutput(response, stops);
        }
        return;
      }
      
      var arrivals = [];
            
      for (var i=0; i<items.length; i++) {
        var arrival = items[i].ArrivalTime.split(':');
        var current = new time.Date();
        current.setTimezone("America/Chicago");
                
        var stopTime = new time.Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate(),
          arrival[0], 
          arrival[1], 
          arrival[2],
          0,
          'America/Chicago');
        
        items[i].ArrivalTimeDate = stopTime.toString();
                      
        if (stopTime >= current) {
          arrivals.push(items[i]);
        }
        
      }
      
      arrivals.sort(function(date1, date2) {
        if (date1.ArrivalTimeDate > date2.ArrivalTimeDate) return 1;
        if (date1.ArrivalTimeDate < date2.ArrivalTimeDate) return -1;
        return 0;
      });
      
      var next = arrivals.shift();
      
      if (next) {
        stops[stopId].arrivalTime = next.ArrivalTimeDate;
        var nextStops = arrivals.splice(0, 4);
        var nextStopArray = [];
        for (var i=0; i<nextStops.length; i++) {
          nextStopArray.push({
            stopId: nextStops.StopId,
            stopName: '',
            latitude: '',
            longitude: ''
          });
        }
      } else {
        stops[stopId].arrivalTime = 'Unknown';
      }
                                    
      if (count === 0) {
        printStopOutput(response, stops);
      }
                  
    });
  }    
}

function createStop(data) {

}

http.createServer(function (request, response) {
  
  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;
  
  switch(url_parts.pathname) {
    
    case '/stops':
      if (query.hasOwnProperty('longitude') && query.hasOwnProperty('latitude')) {
        getStops(response, query.longitude, query.latitude);
      } else {
        response.writeHead(404);
        
        response.end('Error');
      }
      break;
    default:
      response.setHeader("Content-Type", "text/plain");
      response.end('Goodbye');
  }
  
  console.log('Request from ' + request.url);
  
}).listen(8008);

console.log('Server running at localhost:8008');