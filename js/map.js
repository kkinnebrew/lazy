			
      var map;

      function initialize() {
        var mapOptions = {
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map'),
            mapOptions);

        // Try HTML5 geolocation
        if(navigator.geolocation) {
			
			var serviceURL = "http://orangelit.com:8008/stops";
			
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude,
                                             position.coords.longitude);

            var infowindow = new google.maps.InfoWindow({
              map: map,
              position: pos,
              content: 'Location found using HTML5.'
            });

            map.setCenter(pos);
			
			var stopsList = $.ajax({
				url: serviceURL,
				type: "GET",
				data: { latitude: position.coords.latitude, 
						longitude: position.coords.longitude }, 
				dataType: "JSON"
			})
			.done(function(returnData){
				alert("SUCCESS");
				
				returnData.stops.each(function(index) {
					var infowindow2 = new google.maps.InfoWindow(options);
					var latlng2 = new google.maps.LatLng($(this).latitude, $(this).longitude);
					createMarker(latlng2, $(this).stopName, $(this).routeDirection, infowindow2);
				});
			})
			.fail(function(){
				alert("FAILED");
			})
			.always(function(){
				alert("COMPLETED");
			})
			
          }, function() {
            handleNoGeolocation(true);
          });
        } else {
          // Browser doesn't support Geolocation
          handleNoGeolocation(false);
        }
      }

      function handleNoGeolocation(errorFlag) {
        if (errorFlag) {
          var content = 'Error: The Geolocation service failed.';
        } else {
          var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        var options = {
          map: map,
          position: new google.maps.LatLng(-20, 88),
          content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
      }

      google.maps.event.addDomListener(window, 'load', initialize);
    