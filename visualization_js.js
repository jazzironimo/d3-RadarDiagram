   function drawChart(id, avgWordLength, lixValue, lexicalDensity, SweVocTotal, avgSentenceLength, ratioSubClauses, avgSentenceDepth) {
    
    var data = [[{axis:"SweVoc (Total)", value: SweVocTotal}, // not standardized
                 {axis:"Ovix", value: lexicalDensity/0.483},
                 {axis:"Lix", value: lixValue/40},
                 {axis:"Genomsnittlig meningslängd", value: avgSentenceLength/14},
                 {axis:"Genomsnittlig ordlängd", value: avgWordLength/5},
                 {axis:"ratio SubClauses", value: ratioSubClauses/0.359},
                 {axis:"Menings- djup", value: avgSentenceDepth/7}
                ]];
    
    // Get the average of data values. Used with xScale() for bar chart.                
    for (var avg=0, i=0; i < data[0].length; i++) {
        avg += data[0][i].value;
    };
    
  ///////////////////////////////////////////////////////////////////////////
 // -------------------------- RADIAL GRADIENT -------------------------- //
///////////////////////////////////////////////////////////////////////////
    
    // Remove chart at id before drawing new one
	d3.select(id).select("svg").remove();
    
    // Create SVG canvas
    var svgContainer = d3.select("div"+id)
                                    .append("svg")
                                    .attr("viewBox", "-180 -200 400 400") // How "zoomed in" the content is. These values work well for 30% canvas size.
                                    .attr("preserveAspectRatio", "xMinYMin meet")
                                    .classed("svg-content", true)
                                    .style("border", "1px solid black"); // Added to see how big the canvas is
    console.log(id)

    
    // Create the radial gradient
        
    // Colour properties used in the radial gradient are created as objects in an array.
    // They go in order, so the first object is the colour in the center of the circle.
    // Is it possible to use d3.scale + rgb/hsl as range instead for smoother transition?
    var offsetData = [{offset: "5%", color: "rgb(255,0,0)", opacity: "0.7"},
                      {offset: "40%", color: "rgb(255,255,0)", opacity: "0.5"},
                      {offset: "47%", color: "rgb(0,255,0)", opacity: "0.6"},
                      {offset: "62%", color: "rgb(255,255,0)", opacity: "0.5"},
                      {offset: "99%", color: "rgb(255,0,0)", opacity: "0.6"}
                      ];    
    
    // About the variable radius:
    // If you change this all other elements will change with it! Neat.
    // 50% of the SVG viewBox will fill it - but leaving no room for labels.
    // As of now, the value must be in numbers/pixels and not percent.
    // Otherwise it can't be used to scale/compute the proportions of everything else.
    var radius = 110; 
    var defs = svgContainer.append("defs");
        
    defs.append("radialGradient")
        .attr("id", "dia-gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")
        .selectAll("stop")
        .data(offsetData)
        .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; })
        .attr("stop-opacity", function(d) { return d.opacity; });
        
    // Draw the radial gradient
    svgContainer.append("circle")
                .attr("r", radius)
                .attr("cx", "0%") // Changes position of center of the circle
                .attr("cy", "0%")
                .style("stroke", "black")
		        .style("stroke-width", "2px")
                .attr("stroke-opacity", 0.5)
                .style("fill", "url(#dia-gradient)");               


  ///////////////////////////////////////////////////////////////
 // ---------------------- CREATE AXES ---------------------- //
///////////////////////////////////////////////////////////////

    // Inspired by http://bl.ocks.org/nbremer/21746a9668ffdf6d8242
    
    var max = 2; // Used to scale data
    var angleDict = {};
    var rScale = d3.scaleLinear()
		           .range([0, radius])
		           .domain([0, max]);
    var wrapWidth = 45; // How many pixels one line of text is allowed to be
    var labelFactor = 1.25; // How far away the labels should be placed
    var axisGrid = svgContainer.append("g").attr("class", "axisWrapper");
    var allAxis = (data[0].map(function(i, j){return i.axis})), //Names of each axis
        total = allAxis.length,	// The number of different axes
        angleSlice = Math.PI * 2 / total; // The width in radians of each "slice"
    var axis = axisGrid.selectAll(".axis")
                       .data(allAxis)
                       .enter()
                       .append("g")
                       .attr("class", "axis");
                   
	axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ 
      angleDict[d] = angleSlice * i - Math.PI / 2;
      return rScale(max * 1.05) * Math.cos(angleSlice*i - Math.PI / 2); })
		.attr("y2", function(d, i){ return rScale(max * 1.05) * Math.sin(angleSlice*i - Math.PI / 2); })
		.attr("class", "line")
        .attr("stroke-opacity", 0.5)
		.style("stroke", "black")
		.style("stroke-width", "2px");
    
	axis.append("text")
		.attr("class", "legend")
		.style("font-size", "15px")
		.attr("text-anchor", "middle")
		.attr("dy", "0.35em")
		.attr("x", function(d, i){ return rScale(max * labelFactor) * Math.cos(angleSlice*i - Math.PI / 2); })
		.attr("y", function(d, i){ return rScale(max * labelFactor) * Math.sin(angleSlice*i - Math.PI / 2); })
		.text(function(d){return d})
		.call(wrap, wrapWidth); 


  ////////////////////////////////////////////////////////////      
 // ------------ HELPER FUNCTION | WRAP TEXT ------------- //
////////////////////////////////////////////////////////////
       
    // Wrap the label names (i.e. make line breaks) if they're too long.
    // Control length with variable wrapWidth.
    // Original: http://bl.ocks.org/mbostock/7555321
        
	function wrap(text, width) {
	  text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr("y"),
			x = text.attr("x"),
			dy = parseFloat(text.attr("dy")),
			tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
			
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width) {
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		  }
		}
	  });
	}


  /////////////////////////////////////////////////////////////
 // ---------------------- BAR CHART ---------------------- //
/////////////////////////////////////////////////////////////
               
    var barData = [{offset: "0%", color: "rgb(255,0,0)", opacity: "0.7"},
                   {offset: "40%", color: "rgb(255,255,0)", opacity: "0.7"},
                   {offset: "50%", color: "rgb(0,255,0)", opacity: "0.5"},
                   {offset: "60%", color: "rgb(255,255,0)", opacity: "0.6"},
                   {offset: "99%", color: "rgb(255,0,0)", opacity: "0.6"}
                      ];             
   
    defs.append("linearGradient")
               .attr("id", "linGradient")
               .attr("x1", "0%")
               .attr("y1", "100%")
               .attr("x2", "0%")
               .attr("y2", "0%")
               .selectAll("stop")
               .data(barData)
               .enter().append("stop")
               .attr("offset", function(d) {return d.offset; })
               .attr("stop-color", function(d) { return d.color; })
               .attr("stop-opacity", function(d) { return d.opacity; });
               
    svgContainer.append("rect")
                .attr("x", radius*1.6) // Distance from circle
                .attr("y", 0-radius/2)
                .attr("width", 15)
                .attr("height", radius)
                .style("stroke", "black")
		        .style("stroke-width", "2px")
                .attr("stroke-opacity", 0.5)
                .style("fill", "url(#linGradient)");

    var pos = avg/total // Ellipse position
    var xScale = d3.scaleLinear()
                   .range([radius/2, 0-radius/2])
                   .domain([0, max])          
    var ellipse = svgContainer.append("ellipse")
                              .data(data[0])
                              .attr("cx", (radius*1.6)+7) // Distance from circle
                              .attr("cy", xScale(pos))
                              .attr("rx", 15) // Length of ellipse
                              .attr("ry", 3); // Height of ellipse
            

  ////////////////////////////////////////////////////////////////
 // ------------------------ DRAW CURVE ---------------------- //
////////////////////////////////////////////////////////////////
       
    // Plot the points from data for the curve.
    var curveFunction = d3.line()
                          .x(function(d) { return Math.cos(angleDict[d.axis]) * d.value*radius/2; })
                          .y(function(d) { return Math.sin(angleDict[d.axis]) * d.value*radius/2; })
                          .curve(d3.curveLinearClosed); // Typ of curve can be changed. Rec: CatmullRom and Linear             

    // Draw the curve                                                      
    var curveGraph = svgContainer.append("path")
                                 .attr("d", curveFunction(data[0]))
                                 .attr("stroke", "black")
                                 .attr("stroke-width", "2")
                                 .attr("fill", "none");
    }