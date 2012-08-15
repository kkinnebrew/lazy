var map,
    stops,
    infowindow,
    markersArray = [],
    serviceURL = "http://orangelit.com:8008/stops";

function initialize() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  if (navigator.geolocation) {
  
    navigator.geolocation.getCurrentPosition(function (position) {
    
      var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      // Define a new infowindow for all markers to use.
      infowindow = new google.maps.InfoWindow({
        map: map
      });
      
      // Set your location marker.
      var marker = new google.maps.Marker({
        map: map,
        position: pos,
        icon: "../img/marker.png"
      });

      map.setCenter(pos);

      // Get the stops around you.
      $.ajax({
        url: serviceURL,
        type: "GET",
        dataType: "JSON",
        data: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      }).success(function (returnData) {
      
        console.log("Request succeeded");
        stops = returnData.stops;
        renderSelectedStops();
        
      }).error(function () {
      
        console.log("Request failed");
        
      });
      
    }, function () {
    
      handleNoGeolocation(true);
      
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }
}

function renderSelectedStops() {

  var selectedDirection = $("#direction").val().toLowerCase();
  
  map.clearMarkers();
  
  $.each(stops, function (index) {
    if (this.routeDirection.toLowerCase() === selectedDirection) {
      var latlng2 = new google.maps.LatLng(this.latitude, this.longitude);
      createMarker(latlng2, this.stopName, this.routeDirection, this.arrivalTime, infowindow);
    }
  });
}

function createMarker(latlng, name, address, arrivalTime, infoWindow) {
  var html = "<b>" + name + "</b> <br />Direction: " + address + "<br />Arrives: " + arrivalTime;
  var marker = new google.maps.Marker({
    map: map,
    position: latlng
  });
  markersArray.push(marker);
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(html);
    infoWindow.open(map, marker);
  });
}

function handleNoGeolocation(errorFlag) {

  var options = {
    map: map,
    position: new google.maps.LatLng(-20, 88),
    content: errorFlag ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.'
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}

google.maps.Map.prototype.clearMarkers = function() {
  if (markersArray) {
    for (var i = 0; i < markersArray.length; i++ ) {
      markersArray[i].setMap(null);
    }
  }
}

google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function() {

  $("#direction").change(function() {
    renderSelectedStops();
  });
  
  $("#refreshLocation").click(function() {
    initialize();
  });
});