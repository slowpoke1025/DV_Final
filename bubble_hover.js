// Load data from CSV file
d3.csv("dataset/car_prices_cleaned.csv").then(function(data) {
    // Filter data for a specific car make
    var make = "Bmw";
    var filteredData = data.filter(function(d) {
      return d.make === make;
    });

    // Parse dates
    var parseDate = d3.timeParse("%Y-%m-%d");
    filteredData.forEach(function(d) {
      d.saledate = parseDate(d.saledate);
    });

    // Group data by date and count the number of transactions for each day
    var groupedData = d3.group(filteredData, function(d) { return d.saledate; });

    // Convert the grouped data to an array
    var nestedData = Array.from(groupedData, ([key, value]) => ({ key, value: value.length }));

    // Sort nestedData by date
    nestedData.sort(function(a, b) {
      return d3.ascending(a.key, b.key);
    });

    // Set up SVG dimensions
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Append SVG to the chart div
    var svg = d3.select(".chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scales
    var x = d3.scaleTime()
      .domain(d3.extent(nestedData, function(d) { return new Date(d.key); }))
      .range([0, width]);
    
    var y = d3.scaleLinear()
      .domain([0, d3.max(nestedData, function(d) { return d.value; })])
      .nice()
      .range([height, 0]);

    // Define axes
    var xAxis = d3.axisBottom(x)
      .tickFormat(d3.timeFormat("%Y-%m-%d"));

    var yAxis = d3.axisLeft(y);

    // Append axes
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Transaction Count");

    // Define line function
    var line = d3.line()
      .x(function(d) { return x(new Date(d.key)); })
      .y(function(d) { return y(d.value); });

    // Append path
    svg.append("path")
      .datum(nestedData)
      .attr("class", "line")
      .attr("d", line);
  }).catch(function(error) {
    console.log("Error loading the data: " + error);
  });