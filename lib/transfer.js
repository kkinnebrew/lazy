var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'mydbadmin',
  password : 'tssrj45',
});

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;
var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('lazy', server);

var times;

db.collection('times', function(err, collection) {
 times = collection;
});

connection.connect();

connection.query('USE lazy');

connection.query('SELECT * FROM lazy LIMIT 3414000, 150', function(err, rows, fields) {
  if (err) throw err;
  
  var obj;
//  var length = rows.length;
//  var count = 0;
//  var counter = 500;
  
  for (var i=0; i<rows.length; i++) {
    obj = {
      TripId: rows[i].trip_id,
      ArrivalTime: rows[i].arrival_time,
      DepartureTime: rows[i].departure_time,
      StopId: rows[i].stop_id,
      StopSequence: rows[i].stop_sequence,
      StopHeadSign: rows[i].stop_headsign,
      PickupType: rows[i].pickup_type,
      ShapeDistTraveled: rows[i].shape_dist_traveled,
    }
    times.insert(obj, function() {
      console.log("inserted rows at " + i);
    });
  }
  
  return;
  
  while(count < length) {
    var batch = [];
    while(counter > 0) {
//      if (!rows.hasOwnProperty(count)) {
//        count++;
//        counter--;
//        continue;
//      }
      obj = {
        TripId: rows[count].trip_id,
        ArrivalTime: rows[count].arrival_time,
        DepartureTime: rows[count].departure_time,
        StopId: rows[count].stop_id,
        StopSequence: rows[count].stop_sequence,
        StopHeadSign: rows[count].stop_headsign,
        PickupType: rows[count].pickup_type,
        ShapeDistTraveled: rows[count].shape_dist_traveled,
      }
      batch.push(obj);
      counter--;
      count++;
    }
    counter = 500;
    times.insert(batch, function() {
      console.log("inserted batch");
    });
    console.log("At row " + count); 
  }
    
});

connection.end();