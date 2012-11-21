include ('GUIDriver.js')
function searchService (opts) {
    
}

function nearbySearch(opts) {
    //Perform search with opts
    opts.URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/xml?query='+opts+'&sensor=false&key=AIzaSyBLSBTaFr11MIh8otpdIPyT1xlTBAuBsi0
    results = searchService(opts)
    refreshResults(results)
}

function textSearch(opts) {
    opts.URL = 'https://maps.googleapis.com/maps/api/place/textsearch/xml?query='+opts+'&sensor=false&key=AIzaSyBLSBTaFr11MIh8otpdIPyT1xlTBAuBsi0
    results = searchService(opts)
    refreshResults(results)
}

function refreshResults(results){
    // Update Map
    // Update List
    // GUIDriver.Refresh
}