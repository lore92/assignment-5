console.log("Assignment 5");

var margin = {t:50,r:100,b:50,l:50};
var width = document.getElementById('map').clientWidth - margin.r - margin.l,
    height = document.getElementById('map').clientHeight - margin.t - margin.b;

var canvas = d3.select('.canvas');
var map = canvas
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//TODO: set up a mercator projection, and a d3.geo.path() generator
//Center the projection at the center of Boston
var bostonLngLat = [-71.088066,42.315520]; //from http://itouchmap.com/latlong.html

var projection = d3.geo.mercator()
	//.center takes 2 element array of long, then lat
    .center(bostonLngLat)
    .translate([width/2, height/2])
    .scale(180000)

var path = d3.geo.path().projection(projection);

//TODO: create a color scale
var scaleColor = d3.scale.linear().domain([0,700000]).range(['#ECC8EC', '#4F2F4F']);

//TODO: create a d3.map() to store the value of median HH income per block group
var medianHHincome = d3.map();

//TODO: import data, parse, and draw
queue()
	.defer(d3.json, "data/bos_census_blk_group.geojson")
	.defer(d3.json, "data/bos_neighborhoods.geojson")
	.defer(d3.csv, "data/acs2013_median_hh_income.csv", parse_med)
	.await(function(err,loadingData,loadtheData,median_set){
		console.log(loadingData)
		//console.log(loadtheData);


        draw(loadingData, loadtheData, median_set);

	})

function draw(loadingData, loadtheData, median_set) {


	//4.draw the counties as a single path
        map.selectAll('.block-groups')
        	.attr('class', 'block-groups')
            .data(loadingData.features)
            .enter()
            .append('path')
            .attr('d', path)
            //6. give each county a fill color based on unemployment rate
            //what does the data in the path need to work with to make a fill color?
            .style('fill', function (f){

            	if (medianHHincome.get(f.properties.geoid).income==0){

            		return "#FFEDCC"

            	} else {

                return scaleColor( medianHHincome.get(f.properties.geoid).income )

            	}	

            })
            .call(attachTooltip);

        /*map.selectAll('.neighborhoods')
        	.attr('class', 'neighborhoods')
        	.data(loadtheData.features)
        	.enter()
        	.appe*/

        map2 = map.append("g")
        	.attr("class","neighborhoods")
        	.selectAll("neighborhoods")
        	.data(loadtheData.features)
        	.enter()
        	.append("g")
        	.attr("class", "neighborhood");

        map2.append("path")
        	.attr("class", "boundaries")
        	.attr("d", path)
        	.style("stroke", "#ffffff")
        	.style("stroke-width", "1px")
        	.style('fill', 'none');
        	

    map2.append("text")
        .text(function(d){
            //console.log(d);
            var nameNeigh = (d.properties.Name);
            //console.log(nameNeigh);
            return nameNeigh
        })
        .attr('class', 'NeighName')
        .attr("x", function (d){
            return path.centroid(d)[0];
        })
        .attr("y", function (d){
            return path.centroid(d)[1];
        })
        .attr('font-size', '10px');
        
}

function attachTooltip(selection){
    selection
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip
                .transition()
                .style('opacity',1)
                .style('fill', 'white');

            var income = (medianHHincome.get(d.properties.geoid)).income;
            tooltip.select('#income').html(income);
        })
        .on('mousemove',function(){
            var xy = d3.mouse(canvas.node());
            var tooltip = d3.select('.custom-tooltip');

            tooltip
                .style('left',xy[0]+25+'px')
                .style('top',(xy[1]+25)+'px');

        })
        .on('mouseleave',function(){
            var tooltip = d3.select('.custom-tooltip')
                .transition()
                .style('opacity',0);
        })
}	

function parse_med(p) {
    //console.log(p)
     	medianHHincome.set (p.geoid, {
        	'nameBlock': p.name,
        	'income': +p.B19013001
    	});
    	console.log(medianHHincome)
    };
