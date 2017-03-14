//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoEquirectangular()
        .center([0, 0])
        .scale(100)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/d3labdata.csv") //load attributes from csv
        .defer(d3.json, "data/worldmap.topojson") //load chloropleth spatial data
        .await(callback);

     function callback(error, csvData, world){
        //translate europe TopoJSON
        var worldMap = topojson.feature(world, world.objects.WorldMap);

        

        //add countries to map
        var countries = map.append("path")
            .datum(worldMap)
            .attr("class", "countries")
            .attr("d", path);
            

        //examine the results
        console.log(worldMap);
       	console.log(csvData);
    };
}; 