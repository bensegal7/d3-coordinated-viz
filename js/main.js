(function(){

//pseudo-global variables
//variables for data join
document.body.style.backgroundColor = "black";

var attrArray = ["Health Care Spending (PPP)", 
				 "Health Care Spending(Per Capita USD)",
    			 "Life Expectancy", 
    			 "Maternal Mortality Rate (per 100,000 births)", 
   				 "Infant Mortality Rate (1000 births)"];

var expressed = attrArray[0]; //initial attribute
var constant= "Health Care Spending (PPP)";
var constant2 =  "Health Care Spending(Per Capita USD)";
var countryName = "ADMIN";
var population = "Population (2014)";

var chartWidth = window.innerWidth *.9 ,
    	chartHeight = 250,
        leftPadding = 35,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + (topBottomPadding+2) + ")",
		translate2 = "translate(" + leftPadding + "," + (chartInnerHeight+ 5) + ")";


 

	 //create a scale to size bars proportionally to frame
var yScale = d3.scaleLinear()
        .range([0, chartHeight])
        .domain([1000, -50]);

var xScale = d3.scaleLinear()
		.range([0,chartWidth])
		.domain([-70,11000]);

var yAxis = d3.axisLeft()
        .scale(yScale);

var xAxis = d3.axisTop()
    	.scale(xScale);

var axis1;

var container = d3.select("body") //get the <body> element from the DOM
    .append("svg") //put a new svg in the body
    .attr("class", "container")
    .attr("width", 1265) //assign the width
    .attr("height", 700) //assign the height
    .attr("class", "container"); //assign a class name


    
var titleRec = container.append("rect")
	.attr("class", "titleRec")
	.attr("width", 1265)
	.attr("height", 80)
	.attr("x", 0)
	.attr("y", 0);
       
var pageTitle = container.append("text")
	.attr("class", "pageTitle")
	.attr("x", 70)
	.attr("y", 58)
	.text("Quality of Health Care in the World: 2016");


var chart =  container.append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart")
        .attr("x", 41) //position from left on the x (horizontal) axis
        .attr("y", 385);

var createdBy = container.append("text")
	.attr("class", "createdBy")
	.attr("x", 0)
	.attr("y", 670)
	.text("Created by Benjamin Segal");

var projectionLab = container.append("text")
	.attr("class", "projectionLab")
	.attr("x", 0)
	.attr("y", 683)
	.text("Map Projection: Equirectangular");

var dataLab = container.append("text")
	.attr("class", "projectionLab")
	.attr("x", 0)
	.attr("y", 696)
	.text("Data Source: worldbank.org");

var yLabel;

var xLabel = container.append("text")
	.attr("class", "xLabel")
	.attr("x", 550)
	.attr("y", 650)
	.text(constant);




var attrText = container.append("text")
			.attr("class", "attrText")
			.attr("x", 0)
			.attr("y", 100);




//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
     var width = window.innerWidth *.5,
         height = 460;
   
    //create new svg container for the map
    var map = container.append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 68) //position from left on the x (horizontal) axis
        .attr("y", 0);
  


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

        createLegend(colorScale);

     
        
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
        })
        .on("mousemove", moveLabel);


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

    var max = d3.max(domainArray);

    var min = max/6.2;

    var min2 = d3.min(domainArray);

   
    if(min2 < 30){
    	yScale.domain([max*1.3,0-min]);
	};

	if(min2> 30){
		yScale.domain([max*1.1,min +23]);
	};

    yAxis.scale(yScale);

    return colorScale;
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){

	

    //create a second svg element to hold the bar chart
   	var circles = chart.selectAll("circle")  // <-- No longer "rect"
   		.data(csvData)
   		.enter()
   		.append("circle") 
   		.attr("class", function(d){
            return "circles " + d.ADM0_A3;
        })    
        .attr("width", (chartWidth / csvData.length-1))
        .on("mouseover", function(){
            return "circles " + d.ADM0_A3;
        })    
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

    var desc = circles.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
	    

    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 30)
        .attr("class", "chartTitle");
   
        

     //create vertical axis generator
    

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    var axis2 = chart.append("g")
        .attr("class", "axis2")
        .attr("transform", translate2)
        .call(xAxis);
    
	
   

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
            return i*5; 
        })
        .duration(100);

	updateChart(circles, csvData.length, colorScale);

    
};
//function to position, size, and color bars in chart
function updateChart(circles, n, colorScale){
  
    //position bars
   circles.attr("cx", function(d) {
	        return xScale(d[constant])+40;
	   	})
	   	.attr("cy", function(d) {
	   		if(constant == expressed){
	   			return 150;
	   		};

	   		
	        return yScale((d[expressed]));
	    
	   	})
	   	.attr("r", 8)
	   	.style("fill", function(d){
            
           

	   		if (d[expressed] == ""){
	   			return "none";
            };

            return choropleth(d, colorScale);

            
    	});



   	//at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed);


  //  	d3.select(".yLabel").remove();


  //  	if(attrArray[0] !== expressed){
  //   yLabel = container.append("text")
		// .attr("class", "yLabel")
		// .attr('transform', "rotate(-90)")
		// .attr("x", -400)
		// .attr("y", 690)
		// .text(expressed);
  //   };


    d3.select(".axis1").remove();
  

    axis1 = chart.append("g")
        .attr("class", "axis1")
        .attr("transform", translate);

    if(constant !== expressed){
 		axis1.call(yAxis);
    };

   

   retrieveInfo();

};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke

    if(!isNaN(props[expressed])){
    var selected = d3.selectAll("." + props.ADM0_A3)
        .style("stroke", "red")
        .style("stroke-width", "2");

    setLabel(props);
	};
};

//function to highlight enumeration units and bars
function highlight2(props){
    //change stroke

    if(!isNaN(props[expressed])){
    var selected = d3.selectAll("." + props.ADM0_A3)
        .style("stroke", "red")
        .style("stroke-width", "10");

    setLabel(props);
	};
};

function moveFront (){

	  return this.each(function(){
	  this.parentNode.appendChild(this);
	});
	  
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

        d3.select(".infolabel")
        .remove();

        return styleObject[styleName];
    };
};

//function to create dynamic label
function setLabel(props){

    //label content
    var labelAttribute =  "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";



    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.ADM0_A3 + "_label")
        .html(props[countryName]);
       

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(labelAttribute);
};

//function to move info label with mouse
function moveLabel(){
     //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function createLegend(colorScale){

};

function retrieveInfo() {

	attrText.remove();

	attrText = container.append("text")
			.attr("class", "attrText")
			.attr("x", 720)
			.attr("y", 180);

		
	if(expressed == attrArray[0]){
		
		var line1 = attrText.append("tspan")
			.text(expressed + " is measured in Purchasing");
			  
		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("Power Parity (PPP). PPP equalizes the purchasing power ");
			
		var line3 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("of different currencies by eliminating the differences in ");
			 
		var line3 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("price levels between countries. Explore the map to see how ");
		
		var line4 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("much people spend on health care in different countries!");
	};

	if(expressed == attrArray[1]){
		
		var line1 = attrText.append("tspan")
			.text(expressed + " is measured in"); 

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("US Dollars. Explore the dataset to see how much you");
		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("would spend on health care in other countries!");

			
	};

	if(expressed == attrArray[2]){

		var line1 = attrText.append("tspan")
			.text("Eplore the dataset to see how life expectancy at birth "); 

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("is affected by health care spending!");
	

	};
	if(expressed == attrArray[3]){
		var line1 = attrText.append("tspan")
			.text("Eplore the dataset to see how the maternal mortality"); 

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("rate (per 100,000 births) in each country is affected ");

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("by health care spending!");
	
	
	};
	if(expressed == attrArray[4]){
		
		var line1 = attrText.append("tspan")
			.text("Eplore the dataset to see how the infant mortality"); 

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("rate (per 1,000 births) in each country is affected ");

		var line2 = attrText.append("tspan")
			.attr("x", 720)
			.attr("dy", "25")
			.text("by health care spending!");


	
	};
};

})(); 

