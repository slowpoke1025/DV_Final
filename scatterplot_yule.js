var margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

var svg = d3.select(".scatterplot-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data;

d3.csv("./car_prices_cleaned.csv", function (csvData) {
    data = csvData;

    d3.selectAll(".color-select").property("checked", true);
    d3.select("#all-colors").property("checked", true);

    updateChart();

    d3.select("#all-colors").on("change", function () {
        var isChecked = d3.select(this).property("checked");
        d3.selectAll(".color-select").property("checked", isChecked);
        updateChart();
    });

    d3.selectAll(".color-select").on("change", function () {
        var allChecked = d3.selectAll(".color-select").nodes().every(function (d) {
            return d.checked;
        });
        d3.select("#all-colors").property("checked", allChecked);
        updateChart();
    });
});

function updateChart() {
    var xFeature = d3.select("#x-axis-select").property("value");
    var yFeature = d3.select("#y-axis-select").property("value");
    var subset = data.slice(0, 10000);

    var selectedColors = [];
    var colorMap = {};

    if (d3.select("#all-colors").property("checked")) {
        d3.selectAll(".color-select").each(function() {
            var checkbox = d3.select(this);
            selectedColors.push(checkbox.property("value"));
            colorMap[checkbox.property("value")] = checkbox.attr("color");
        });
    } else {
        d3.selectAll(".color-select:checked").each(function() {
            var checkbox = d3.select(this);
            selectedColors.push(checkbox.property("value"));
            colorMap[checkbox.property("value")] = checkbox.attr("color");
        });
    }

    var x = d3.scaleLinear()
        .domain([d3.min(subset, function (d) { return +d[xFeature]; }), d3.max(subset, function (d) { return +d[xFeature]; })])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([d3.min(subset, function (d) { return +d[yFeature]; }), d3.max(subset, function (d) { return +d[yFeature]; })])
        .range([height, 0]);

    svg.selectAll("*").remove();

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Draw unselected
    svg.append('g')
        .selectAll('dot')
        .data(subset.filter(function(d) {
            var color = d.color.toLowerCase();
            if (color !== "black" && color !== "silver" && color !== "white" && color !== "gray") {
                color = "others";
            }
            return !selectedColors.includes(color);
        }))
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[xFeature]); })
        .attr("cy", function (d) { return y(d[yFeature]); })
        .attr("r", 5)
        .style("fill", "#FFCCE5");

    // Draw selected with thier colors
    svg.append('g')
        .selectAll('dot')
        .data(subset.filter(function(d) {
            var color = d.color.toLowerCase();
            if (color !== "black" && color !== "silver" && color !== "white" && color !== "gray") {
                color = "others";
            }
            return selectedColors.includes(color);
        }))
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[xFeature]); })
        .attr("cy", function (d) { return y(d[yFeature]); })
        .attr("r", 5)
        .style("fill", function(d) {
            var color = d.color.toLowerCase();
            if (color !== "black" && color !== "silver" && color !== "white" && color !== "gray") {
                color = "others";
            }
            return colorMap[color];
        });
}

d3.select("#x-axis-select").on("change", updateChart);
d3.select("#y-axis-select").on("change", updateChart);
d3.selectAll(".color-select").on("change", updateChart);


// var margin = { top: 30, right: 30, bottom: 70, left: 60 },
//     width = 1000 - margin.left - margin.right,
//     height = 1000 - margin.top - margin.bottom;

// var svg = d3.select(".scatterplot-container")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// var data;

// d3.csv("./car_prices_cleaned.csv", function (csvData) {
//     data = csvData;


//     d3.selectAll(".color-select").property("checked", true);
//     d3.select("#all-colors").property("checked", true);

//     updateChart();

//     d3.select("#all-colors").on("change", function () {
//         var isChecked = d3.select(this).property("checked");
//         d3.selectAll(".color-select").property("checked", isChecked);
//         updateChart();
//     });

//     d3.selectAll(".color-select").on("change", function () {
//         var allChecked = d3.selectAll(".color-select").nodes().every(function (d) {
//             return d.checked;
//         });
//         d3.select("#all-colors").property("checked", allChecked);
//         updateChart();
//     });
// });

// function updateChart() {
//     var xFeature = d3.select("#x-axis-select").property("value");
//     var yFeature = d3.select("#y-axis-select").property("value");
//     var selectedColors = [];
//     var subset=data.slice(0,10000)
//     if (d3.select("#all-colors").property("checked")) {
//         selectedColors = ["black", "white", "silver", "gray", "others"];
//     } else {
//         selectedColors = d3.selectAll(".color-select:checked").nodes().map(function (d) { return d.value; });
//     }

//     var x = d3.scaleLinear()
//         .domain([d3.min(subset, function (d) { return +d[xFeature]; }), d3.max(subset, function (d) { return +d[xFeature]; })])
//         .range([0, width]);

//     var y = d3.scaleLinear()
//         .domain([d3.min(subset, function (d) { return +d[yFeature]; }), d3.max(subset, function (d) { return +d[yFeature]; })])
//         .range([height, 0]);

//     svg.selectAll("*").remove();

//     svg.append("g")
//         .attr("transform", "translate(0," + height + ")")
//         .call(d3.axisBottom(x).tickFormat(d3.format("d")));

//     svg.append("g")
//         .call(d3.axisLeft(y));

    
//     var otherColorsData = [];
//     var selectedColorsData = [];

//     subset.forEach(function (d) {
//         var color = d.color.toLowerCase();
//         if (color !== "black" && color !== "silver" && color !== "white" && color !== "gray") {
//             color = "others";
//         }
//         if (selectedColors.includes(color)) {
//             selectedColorsData.push(d);
//         } else {
//             otherColorsData.push(d);
//         }
//     });

//     // Draw unselected 
//     svg.append('g')
//         .selectAll('dot')
//         .data(otherColorsData)
//         .enter()
//         .append("circle")
//         .attr("cx", function (d) { return x(d[xFeature]); })
//         .attr("cy", function (d) { return y(d[yFeature]); })
//         .attr("r", 5)
//         .style("fill", "#d3d3d3");

//     // Draw selected 
//     svg.append('g')
//         .selectAll('dot')
//         .data(selectedColorsData)
//         .enter()
//         .append("circle")
//         .attr("cx", function (d) { return x(d[xFeature]); })
//         .attr("cy", function (d) { return y(d[yFeature]); })
//         .attr("r", 5)
//         .style("fill", "#69b3a2");
// }

// d3.select("#x-axis-select").on("change", updateChart);
// d3.select("#y-axis-select").on("change", updateChart);
// d3.selectAll(".color-select").on("change", updateChart);




