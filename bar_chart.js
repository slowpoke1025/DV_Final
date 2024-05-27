// Define the margin, width, and height
const margin = { top: 20, right: 30, bottom: 40, left: 75 };
const width = 1000 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append the SVG element
const svg = d3.select("#barchart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "minitooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("pointer-events", "none");

// Parse the date / time
const parseDate = d3.timeParse("%Y-%m-%d");

// Define the scales and axes
const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleLinear().range([height, 0]);
const xAxis = d3.axisBottom().scale(x);
const yAxis = d3.axisLeft().scale(y).ticks(10);

// Initial array of makes to show
let makes = []; // Add or remove makes as needed

// Load the data
d3.csv("dataset/car_prices_cleaned.csv").then(data => {
    data.forEach(d => {
        d.saledate = parseDate(d.saledate);
        d.sellingprice = +d.sellingprice;
    });

    // Function to update the bar chart
    function updateBarChart() {
        // Filter data by multiple makes
        const filteredData = data.filter(d => makes.includes(d.make));

        // Sort filteredData by date
        filteredData.sort((a, b) => a.saledate - b.saledate);

        // Set the domains
        x.domain(filteredData.map(d => d.saledate));
        y.domain([0, d3.max(filteredData, d => d.sellingprice)]);

        // Join the data
        const bars = svg.selectAll(".bar")
            .data(filteredData);

        // Remove exiting bars
        bars.exit().remove();

        // Update existing bars
        bars.attr("x", d => x(d.saledate))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.sellingprice))
            .attr("height", d => height - y(d.sellingprice));

        // Add new bars
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.saledate))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.sellingprice))
            .attr("height", d => height - y(d.sellingprice))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.saledate)}<br>Price: $${d.sellingprice}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Update the X Axis
        svg.select(".axis-x").remove();
        svg.append("g")
            .attr("class", "axis-x")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis.tickValues([filteredData[0]?.saledate, filteredData[filteredData.length - 1]?.saledate]).tickFormat(d3.timeFormat("%Y-%m-%d")));

        // Update the Y Axis
        svg.select(".axis-y").remove();
        svg.append("g")
            .attr("class", "axis-y")
            .call(yAxis);
    }

    // Initial render
    updateBarChart();

    // Update makes array and re-render the chart
    window.updateMakes = function(make) {
        const index = makes.indexOf(make);
        if (index > -1) {
            // Make already in the array, remove it
            makes.splice(index, 1);
        } else {
            // Make not in the array, add it
            makes.push(make);
        }
        updateBarChart();
    }
}).catch(error => {
    console.error("Error loading the data: ", error);
});
