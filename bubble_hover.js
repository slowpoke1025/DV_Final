// Load data from CSV file
d3.csv("dataset/car_prices_cleaned.csv").then(function(data) {
    // Count sales for each brand
    var brandSales = d3.rollup(data, v => v.length, d => d.make);

    // Convert brandSales map to array of objects
    var brandSalesArray = Array.from(brandSales, ([make, count]) => ({ make, count }));

    // Set up the SVG
    var svg = d3.select("#bubble"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    // Set a minimum radius for bubbles
    var minRadius = 15; // Adjust as needed

    // Create simulation for bubbles
    var simulation = d3.forceSimulation(brandSalesArray)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => Math.max(Math.sqrt(d.count) * 0.5, minRadius)))
        .force("charge", d3.forceManyBody().strength(-10))
        .force("attract", d3.forceManyBody().strength(18))
        .on("tick", ticked);

    // Append groups for bubbles and labels
    var bubbleGroups = svg.selectAll(".bubble-group")
        .data(brandSalesArray)
        .enter().append("g")
        .attr("class", "bubble-group");

    // Append bubbles
    var bubbles = bubbleGroups.append("circle")
        .attr("class", "bubble")
        .attr("r", d => Math.max(Math.sqrt(d.count) * 0.5, minRadius))
        .style("fill", "steelblue")
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip)
        .on("click", clickBubble);

    // Append brand labels inside the bubbles
    var labels = bubbleGroups.append("text")
        .attr("class", "brand-label")
        .attr("dy", ".35em")
        .style("pointer-events", "none") // Make text non-interactive
        .text(d => d.make);

    // Function to update bubble positions
    function ticked() {
        bubbleGroups
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    // Show tooltip function
    function showTooltip(event, d) {
        var tooltip = d3.select("#tooltip");
        tooltip.style("display", "block");

        // Load and display the line chart
        loadLineChart(d.make);
    }

    function moveTooltip(event, d) {
        var tooltip = d3.select("#tooltip");
        tooltip.style("top", (event.pageY - 210) + "px").style("left", (event.pageX + 10) + "px");
    }

    // Hide tooltip function
    function hideTooltip(event, d) {
        var tooltip = d3.select("#tooltip");
        tooltip.style("display", "none");
    }

    // Click bubble function
    function clickBubble(event, d) {
        // Update the makes array
        updateMakes(d.make);
    
        // Get the current fill color of the clicked bubble
        var currentColor = d3.select(this).style("fill");
    
        // Toggle the bubble color
        if (currentColor === "orange") {
            // Return to original color
            d3.select(this).style("fill", "steelblue");
        } else {
            // Highlight the clicked bubble
            d3.select(this).style("fill", "orange");
        }
    
        // Re-render the bar chart
        updateBarChart();
    }

    // Load line chart function
    function loadLineChart(make) {
        d3.csv("dataset/car_prices_cleaned.csv").then(function(data) {
            // Filter data for the specific car make
            var filteredData = data.filter(function(d) {
                return d.make === make;
            });

            // Parse dates
            var parseDate = d3.timeParse("%Y-%m-%d");
            filteredData.forEach(function(d) {
                d.saledate = parseDate(d.saledate);
            });

            // Group data by year and month and count the number of transactions for each month
            var groupedData = d3.group(filteredData, function(d) {
                var date = d.saledate;
                return d3.timeFormat("%Y-%m")(date);
            });

            // Convert the grouped data to an array
            var nestedData = Array.from(groupedData, ([key, value]) => ({ key: new Date(key + "-01"), value: value.length }));

            // Sort nestedData by date
            nestedData.sort(function(a, b) {
                return d3.ascending(a.key, b.key);
            });

            // Clear the previous chart
            d3.select(".chart").selectAll("*").remove();

            // Set up SVG dimensions for the line chart
            var margin = { top: 20, right: 10, bottom: 50, left: 30 },
                width = 400 - margin.left - margin.right,
                height = 200 - margin.top - margin.bottom;

            // Append SVG to the chart div
            var svg = d3.select(".chart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Define scales
            var x = d3.scaleTime()
                .domain(d3.extent(nestedData, function (d) { return d.key; }))
                .range([0, width]);

            var y = d3.scaleLinear()
                .domain([0, d3.max(nestedData, function (d) { return d.value; })])
                .nice()
                .range([height, 0]);

            // Define axes
            var xAxis = d3.axisBottom(x)
                .ticks(d3.timeMonth)
                .tickFormat(d3.timeFormat("%b"));

            var yAxis = d3.axisLeft(y)
                .tickFormat(() => "");;

            // Append axes
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("transform", "rotate(-90)")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            // Add y-axis label
            svg.append("text")
                .attr("class", "y axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 20)
                .style("text-anchor", "middle")
                .text("Sales Count");

            // Define line function
            var line = d3.line()
                .x(function (d) { return x(d.key); })
                .y(function (d) { return y(d.value); });

            // Append path
            svg.append("path")
                .datum(nestedData)
                .attr("class", "line")
                .attr("d", line);
        }).catch(function (error) {
            console.log("Error loading the data: " + error);
        });
    }
});
