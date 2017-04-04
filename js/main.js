(function(){

//pseudo-global variables
 //variables for data join
var attrArray = ["Health Care Spending (PPP)", 
    			 "Life Expectancy", 
    			 "Maternal Mortality Rate (per 100,000 births)", 
   				 "Infant Mortality Rate (1000 births)",  					 
   				 "Population (2014)"];

var expressed = attrArray[0]; //initial attribute
var constant= attrArray[0];

var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";


	 //create a scale to size bars proportionally to frame
var yScale = d3.scaleLinear()
        .range([0, chartWidth])
        .domain([0, 500]);

var xScale = d3.scaleLinear()
		.range([0,chartHeight])
		.domain([0,9000]);

var container = d3.select("body") //get the <body> element from the DOM
    .append("svg") //put a new svg in the body
    .attr("width", 1265) //assign the width
    .attr("height", 625) //assign the height
    .attr("class", "container") //assign a class name
    .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!
       


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
     var width = window.innerWidth * 0.5,
        height = 460;


	 
   
    //create new svg container for the map
    var map = container.append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 20) //position from left on the x (horizontal) axis
        .attr("y", 50);
  


    //create Albers equal area conic projection 
    var projection = d3.geoEquirectangular()
        .center([0, 0])
        .scale(100)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/d3labdata.csv") //load attributes from csv
        .defer(d3.json, "data/ne_10m_admin_0_countries (2).topojson") //load chloropleth spatial data
        .await(callback);

     function callback(error, csvData, world){

 		//place graticule on the map
        setGraticule(map, path);

     	
        //translate europe TopoJSON
        var worldMap = topojson.feature(world, world.objects.worldmap);

      


        //add countries to map
        var countries = map.append("path")
            .datum(worldMap)
            .attr("class", "countries")
            .attr("d", path);

        //join csv data to GeoJSON enumeration units
        worldMap = joinData(worldMap, csvData);
            
       

        //create the color scale
        var colorScale = makeColorScale(csvData);

         //add enumeration units to the map
        setEnumerationUnits(worldMap, map, path, colorScale);
 		
 		//add coordinated visualization to the map
        setChart(csvData, colorScale);

        createDropdown(csvData);

    };
}; 


function setGraticule(map, path){
     var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

     //create graticule background
     var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
            //create graticule lines
     var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
};

function joinData(worldMap, csvData){

       
    
    	  //loop through csv to assign each set of csv attribute values to geojson region
	    for (var i=0; i<csvData.length; i++){
	        var csvCountry = csvData[i]; //the current country
	        var csvKey = csvCountry.ADM0_A3; //the CSV primary key


	        //loop through geojson regions to find correct region
	        for (var a=0; a<worldMap.features.length; a++){

	            var geojsonProps = worldMap.features[a].properties; //the current region geojson properties
	            var geojsonKey = geojsonProps.ADM0_A3; //the geojson primary key
	           
;
	            //where primary keys match, transfer csv data to geojson properties object
	            if (geojsonKey == csvKey){

	                //assign all attributes and values
	                attrArray.forEach(function(attr){
	                    var val = parseFloat(csvCountry[attr]); //get csv attribute value
	                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
	                });
	            };
	        };
	    };

    return worldMap;
};


function setEnumerationUnits(worldMap, map, path, colorScale){
    //add France regions to map
    var regions = map.selectAll(".regions")
        .data(worldMap.features)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.ADM0_A3;
        })
        .attr("d", path)
        .style("fill", function(d){
        	
            return choropleth(d.properties, colorScale);

        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
          .on("mouseout", function(d){
            dehighlight(d.properties);
        });

    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create color scale generator
function makeColorScale(data){

    var colorClasses = [
        "#eff3ff",
		"#bdd7e7",
		"#6baed6",
		"#3182bd",
		"#08519c",
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);


    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        if (!isNaN(val)){
        domainArray.push(val);
    	}
       
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //create a second svg element to hold the bar chart
    var chart =  container.append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart")
        .attr("x", 700) //position from left on the x (horizontal) axis
        .attr("y", 100)
        .style("background-color", "white");

   	var circles = chart.selectAll("circle")  // <-- No longer "rect"
   		.data(csvData)
   		.enter()
   		.append("circle") 
   		.attr("class", function(d){
            return "bars " + d.ADM0_A3;
        })    
        .attr("width", (chartWidth / csvData.length-1))
        .on("mouseover", highlight)
        .on("mouseout", dehighlight);

    var desc = circles.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
	    

    var chartTitle = chart.append("text")
        .attr("x", 30)
        .attr("y", 40)
        .attr("class", "chartTitle");
        

     //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    updateChart(circles, csvData.length, colorScale);

};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });


    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};	

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
     	.transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    var circles = d3.selectAll("circle")
       .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(100);

	updateChart(circles, csvData.length, colorScale);
    
};
//function to position, size, and color bars in chart
function updateChart(circles, n, colorScale){
    //position bars
   circles.attr("cx", function(d) {
	        return xScale(parseFloat(d[constant]))+30;
	   	})
	   	.attr("cy", function(d) {

	   		if(constant == expressed){
	   			return 200;
	   		};
	   		
	        return yScale(parseFloat(d[expressed]))+200;
	    
	   	})
	   	.attr("r", 5)
	   	.style("fill", function(d){
            return choropleth(d, colorScale);
    	});


   	//at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each region");
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.ADM0_A3)
        .style("stroke", "red")
        .style("stroke-width", "2");
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.ADM0_A3)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

})(); 

