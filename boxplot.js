// Load the data
d3.csv("dataset/car_prices_cleaned.csv").then(function(data) {
  // Unique values for filters
  let makes = Array.from(new Set(data.map(d => d.make)));
  let states = Array.from(new Set(data.map(d => d.state)));

  // Populate the make filter
  d3.select("#make-filter")
      .selectAll("option")
      .data(makes)
      .enter()
      .append("option")
      .text(d => d);

  // Populate the state checkboxes
  const stateFilterDiv = d3.select("#state-filter");
  states.forEach(state => {
      stateFilterDiv.append("input")
          .attr("type", "checkbox")
          .attr("class", "state-checkbox")
          .attr("value", state)
          .attr("id", `state-${state}`);
      stateFilterDiv.append("label")
          .attr("for", `state-${state}`)
          .text(state);
      stateFilterDiv.append("br");
  });

  // Create the initial box plot
  updateBoxPlot(data);

  // Add event listeners for filters
  d3.select("#make-filter").on("change", function() {
      applyFilters();
  });

  d3.selectAll(".state-checkbox").on("change", function() {
      applyFilters();
  });

  function applyFilters() {
      let selectedMake = d3.select("#make-filter").property("value");
      let selectedStates = [];
      d3.selectAll(".state-checkbox").each(function() {
          if (d3.select(this).property("checked")) {
              selectedStates.push(d3.select(this).property("value"));
          }
      });
      filterData(selectedMake, selectedStates);
  }

  function filterData(make, states) {
      let filteredData = data;
      if (make !== "All") {
          filteredData = filteredData.filter(d => d.make === make);
      }
      if (states.length > 0) {
          filteredData = filteredData.filter(d => states.includes(d.state));
      }
      updateBoxPlot(filteredData);
  }

  function updateBoxPlot(data) {
      // Clear existing plot
      d3.select("svg").selectAll("*").remove();

      // Dimensions and margins
      const margin = {top: 20, right: 30, bottom: 40, left: 150};
      const width = 960 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      // Append the svg object
      const svg = d3.select("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // Y axis
      const y = d3.scaleBand()
          .range([height, 0])
          .domain(data.map(d => d.state))
          .padding(0.1);
      svg.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(y));

      // X axis with padding
      const x = d3.scaleLinear()
          .domain([0, 45000])
          .range([0, width]);
      svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

      // Group and summarize the data
      let summaryStats = Array.from(d3.rollup(data,
          v => {
              let q1 = d3.quantile(v.map(g => g.sellingprice).sort(d3.ascending), .25);
              let median = d3.quantile(v.map(g => g.sellingprice).sort(d3.ascending), .5);
              let q3 = d3.quantile(v.map(g => g.sellingprice).sort(d3.ascending), .75);
              let interQuantileRange = q3 - q1;
              let min = Math.max(0, q1 - 1.5 * interQuantileRange);
              let max = q3 + 1.5 * interQuantileRange;
              return {q1, median, q3, interQuantileRange, min, max};
          },
          d => d.state
      ));

      // Vertical lines
      svg.selectAll("vertLines")
          .data(summaryStats)
          .enter()
          .append("line")
          .attr("x1", d => x(d[1].min) )
          .attr("x2", d => x(d[1].max) )
          .attr("y1", d => y(d[0]) + y.bandwidth()/2)
          .attr("y2", d => y(d[0]) + y.bandwidth()/2)
          .attr("stroke", "black");

      // Boxes
      svg.selectAll("boxes")
          .data(summaryStats)
          .enter()
          .append("rect")
          .attr("x", d => x(d[1].q1) )
          .attr("width", d => x(d[1].q3) - x(d[1].q1) )
          .attr("y", d => y(d[0]) )
          .attr("height", y.bandwidth() )
          .attr("stroke", "black")
          .style("fill", "#69b3a2");

      // Median lines
      svg.selectAll("medianLines")
          .data(summaryStats)
          .enter()
          .append("line")
          .attr("y1", d => y(d[0]))
          .attr("y2", d => y(d[0]) + y.bandwidth())
          .attr("x1", d => x(d[1].median))
          .attr("x2", d => x(d[1].median))
          .attr("stroke", "black");
  }
});