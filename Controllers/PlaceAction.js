include('PlaceSearch.js')

function requestService(type, opts) {
    //this is how I would expect to add a place to the database, but there's all that JSONP trouble
    var request = {
        type: 'POST',
        //url: "https://maps.googleapis.com/maps/api/place/add/json?sensor=false&key=AIzaSyBLSBTaFr11MIh8otpdIPyT1xlTBAuBsi0",
        url: "https://ourwebservice",
        datatype: 'json',
        data: {
            "location": {
                "lat": opts.lat(),
                "lng": opts.lng()
            },
            "accuracy": 50,
            "name": opts.name,
            "types": [opts.type],
            "language": "en-US"
        },
        success: function (respond, textStatus, jqXHR) {
            alert("in respond!");
            if (respond) {
                alert(respond);
                alert(respond["status"]);
                alert(respond["reference"]);
                alert(respond["id"]);
                open_info(latLng, respond["id"]);
            } else {
                alert("something wrong with response");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("error!");
            alert(textStatus);
            alert(errorThrown);
        }
    };
    $.ajax(request);
    nearbySearch(opts);
}

function addPlace() {
    // Build opts (lat, long, etc)
    var opts //= above
    requestService("POST", opts)
}

function addEvent() {
    // Build opts (place, duration, etc...)
    var opts
    requestService("POST", opts)
}

