LazyApp = (function() {
  var map,
      stops,
      infowindow,
      directionsService,
      directionsDisplay,
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
  
        // Define a map things.
        infowindow = new google.maps.InfoWindow({
          map: map
        });
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        
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
    
    $.each(stops, function () {
      if (this.routeDirection.toLowerCase() === selectedDirection) {
        
        // Array of coordinates in route
        var coords = [];
      
        // Add closest stop marker.
        var initialLatLong = new google.maps.LatLng(this.latitude, this.longitude);
        createMarker(initialLatLong, this.stopName, this.routeDirection, this.arrivalTime, infowindow);
        coords.push(initialLatLong);
        
        // Add markers for rest of route.
        $.each(routeDirection.stops.nextStops, function() {
          var nextStopLatLong = new google.maps.LatLng(this.latitude, this.longitude);
          createMarker(nextStopLatLong);
          coords.push(nextStopLatLong);
        });
        
        // Draw route.
        createRoute(coords);
      }
    });
  }
  
  function createMarker(latlng) {
    var marker = new google.maps.Marker({
      map: map,
      position: latlng
    });
    markersArray.push(marker);
  }
  
  function createMarker(latlng, name, direction, arrivalTime, infoWindow) {
    var html = "<b>" + name + "</b> <br />Direction: " + direction + "<br />Arrives: " + arrivalTime;
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
  
  function createRoute(listOfCoords) {
    var request = {
      origin: listOfCoords[0],
      destination: listOfCoords[listOfCoords.length - 1],
      waypoints: [],
      travelMode: google.maps.TravelMode.WALKING
    };
    
    if (listOfCoords.length > 2) {
      $.each(listOfCoords, function() {
        request.waypoints.push({
          location: this,
          stopover: false
        });
      });
    }
    
    directionsService.route(request, function(result) {
      directionsDisplay.setDirections(result);
    });
  }
  
  function handleNoGeolocation(errorFlag) {
    var options = {
      map: map,
      position: new google.maps.LatLng(41.88, -87.63),
      content: errorFlag ? 'Error: The Geolocation service failed.' : 'Error: Your browser doesn\'t support geolocation.'
    };
  
    var infowindow = new google.maps.InfoWindow(options);
    map.setCenter(options.position);
  }
  
  return {
    markersArray: markersArray,
    renderSelectedStops: renderSelectedStops,
    initialize: initialize
  }
  
})();

google.maps.Map.prototype.clearMarkers = function() {
  if (LazyApp.markersArray) {
    for (var i = 0; i < LazyApp.markersArray.length; i++ ) {
      LazyApp.markersArray[i].setMap(null);
    }
  }
}

google.maps.event.addDomListener(window, 'load', LazyApp.initialize);

$(document).ready(function() {

  $("#direction").change(function() {
    LazyApp.renderSelectedStops();
  });
  
  $("#refreshLocation").click(function() {
    LazyApp.initialize();
  });
});