function DatabaseService(layout,mapPane){
	this.layout = layout;
	this.mapPane = mapPane;
	this.places_service = new google.maps.places.PlacesService(this.mapPane.map);
}

/*
nearby search:
1. get list of "our places"
	search for name with our tag
	build dictionary of results
2. get list of search results
	normal nearby search
3. replace search results with our versions of places
*/
DatabaseService.prototype.nearbySearch = function(searchString, callback){
	this.places_service.nearbySearch({
		location: this.mapPane.map.getCenter(),
		radius: 2000,
		keyword: searchString
	},
		function (results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				var places = [];			
				$.each(results,function(index, result){
					var newPlace = new Place({
						name : result.name,
						address : result.vicinity,
						location : result.geometry.location,
						icon : result.icon,
						id : result.id,
						reference : result.reference,
						types : result.types,
						events : result.events,
						isOurs : false
					});
					places.push(newPlace);
				});
				callback(places,status);
				
			}else{
				callback([],status);
			}
		}
	);
};

//callback spaghetti here :(
DatabaseService.prototype.nearbyCombinedSearch = function(searchString, callback){
	var me = this;
	this.getOurPlaces(function(ourPlaces, ourStatus){
			var ourPlacesLookup = {};
			$.each(ourPlaces,function(index,place){
				ourPlacesLookup[place.name] = place;
			});
			
			me.nearbySearch(searchString, function(theirPlaces, googleStatus){
				var combinedPlaces = [];
				$.each(theirPlaces,function(index,place){
					if(place.name in ourPlacesLookup){
						combinedPlaces.push(ourPlacesLookup[place.name]);
					}else{
						combinedPlaces.push(place);
					}
				});
				
				callback(combinedPlaces, status);
			});
		});	
};

DatabaseService.prototype.getOurPlaces = function(callback){
	this.places_service.nearbySearch({
		location: this.mapPane.map.getCenter(),
		radius: 2000,
		name: "UNI-TAS_"
	},
		function (results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				var places = [];			
				$.each(results,function(index, result){
					var newPlace = new Place({
						name : result.name.replace("UNI-TAS_",""),
						address : result.vicinity,
						location : result.geometry.location,
						icon : result.icon,
						id : result.id,
						reference : result.reference,
						types : result.types,
						events : result.events,
						isOurs : true
					});
					places.push(newPlace);
				});
				callback(places,status);
				
			}else{
				callback([],status);
			}
		}
	);
};

/*
	
commit place:
1. check to see if it's one of our places
2. if it is, remove absent events and add new ones
3. if it isn't, create one of our places with given events

*/

DatabaseService.prototype.addPlace = function(opts, successCallback) {
	var addPlace = {
		type: 'POST',
		url: "http://uni-tas.elasticbeanstalk.com/rest/place/add",
		dataType: 'jsonp',
		contentType: 'application/json; charset=UTF-8',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		data: {
			"location": {
				"lat": opts.location.lat(),
				"lng": opts.location.lng()
			},
			"accuracy": 50,
			"name": opts.name,
			"types": opts.types,
			"language": "en-US"
		},
		success: successCallback,
		error: function (jqXHR, textStatus, errorThrown) {
			alert("error!");
			alert(textStatus);
			alert(errorThrown);
		}
	};
	$.ajax(addPlace);
};

DatabaseService.prototype.addEvent = function(opts, successCallback) {
	var addEvent = {
		type: 'POST',
		url: "http://uni-tas.elasticbeanstalk.com/rest/place/event/add",
		dataType: 'jsonp',
		contentType: 'application/json; charset=UTF-8',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		data: {
			"duration": 17600, //opts.duration,
			"language": "EN-US",
			"summary": opts.description,
			"url": opts.url
		},
		success: function (respond, textStatus, jqXHR) {
			successCallback(respond, textStatus, jqXHR);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			alert("error!");
			alert(textStatus);
			alert(errorThrown);
		}
	};
	$.ajax(addEvent);
};

DatabaseService.prototype.removeEvent = function(opts, successCallback) {
	var addEvent = {
		type: 'POST',
		url: "http://uni-tas.elasticbeanstalk.com/rest/place/event/delete",
		dataType: 'jsonp',
		contentType: 'application/json; charset=UTF-8',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		data: {
			"reference": opts.place.reference,
			"event_id": opts.id
		},
		success: function (respond, textStatus, jqXHR) {
			successCallback(respond, textStatus, jqXHR);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			alert("error!");
			alert(textStatus);
			alert(errorThrown);
		}
	};
	$.ajax(addEvent);
};

//there is a lot of bad code duplication here, but I don't know how else to deal with these callbacks
DatabaseService.prototype.updateEvent = function (vent, callback){
	var me = this;
	if(!vent.place.isOurs){
		me.addPlace(vent.place,function(respond, textStatus, jqXHR){
			vent.place.reference = respond['reference'];
			vent.place.id = respond['id'];
			vent.place.isOurs = true;
			if(vent.id!=null){
				me.removeEvent(vent,function(ventRespond, ventTextStatus, ventJqXHR){
					me.addEvent(vent,function(ventAddRespond,ventAddTS,ventAddJqXHR){
						vent.id = ventAddRespond["id"];
						callback();
					});
				});
			}else{
				me.addEvent(vent,function(ventAddRespond,ventAddTS,ventAddJqXHR){
						vent.id = ventAddRespond["id"];
						callback();
				});
			}
		});
	}else{
		if(vent.id!=null){
				me.removeEvent(vent,function(ventRespond, ventTextStatus, ventJqXHR){
					me.addEvent(vent,function(ventAddRespond,ventAddTS,ventAddJqXHR){
						vent.id = ventAddRespond["id"];
						callback();
					});
				});
		}else{
			me.addEvent(vent,function(ventAddRespond,ventAddTS,ventAddJqXHR){
					vent.id = ventAddRespond["id"];
					callback();
			});
		}
	}
};

