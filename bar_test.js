export function Bar(container, data) {
  // Define the margin, width, and height
  const parseDate = d3.timeParse("%Y-%m-%d");

  data.forEach((d) => {
    d.saledate = parseDate(d.saledate);
    d.sellingprice = +d.sellingprice;
  });

  const margin = { top: 20, right: 30, bottom: 40, left: 75 };
  let { width, height } = container.getBoundingClientRect();
  let rect = container.getBoundingClientRect();

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  // Append the SVG element
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create a tooltip div
  const tooltip = d3.select(".bar_tooltip");
  const dimensions = ["saledate", "sellingprice", "trim", "body", "state"];
  const names = [];

  // [ 'make', 'model', 'trim', 'body','saledate', 'sellingprice', 'year','state', 'color', 'interior', 'mmr', 'age']

  const formatDate = d3.timeFormat("%Y-%m-%d");
  function showTooltip(e, d) {
    const lists = dimensions.reduce((acc, col) => {
      const name = col;
      let value = d[col];
      if (name == "saledate") {
        value = d3.timeFormat("%Y-%m-%d")(d[col]);
      }
      return (
        acc +
        `<li  ${col == "median" ? "highlight" : ""}">${name}: 
        ${value}</li>`
      );
    }, ``);

    let [left, top] = [e.pageX - rect.x + 10, e.pageY - rect.y + 10];
    //   let flag = top + tooltip_h * 2 > rect.y + rect.height;
    //   let flag = top - tooltip_h - 100 <= rect.y;
    let flag = e.pageY < rect.y + height / 2;
    let flagX = e.pageX < rect.x + width / 2;
    if (flag) {
      top += 10;
    } else {
      top -= 10;
    }

    if (flagX) {
      left += 10;
    } else {
      left -= 10;
    }
    tooltip
      .style("left", `calc(${left}px)`)
      .style("top", `calc(${top}px)`)
      .style(
        "transform",
        (d) =>
          (flag ? `translateY(0)` : `translateY(-100%)`) +
          " " +
          (flagX ? `translateX(0)` : `translateX(-100%)`)
      )
      .classed("active", true)

      .select(".bar-name")
      .text(d.make + " " + d.model);

    tooltip.select("ul").html(lists);
  }
  function hideTooltip(e, d) {
    tooltip.classed("active", false);
  }

  const x_axis = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")");

  const y_axis = svg.append("g").attr("class", "axis");

  function updateBarChart(data) {
    const nestedData = d3.group(data, (d) => d.saledate);
    console.log(nestedData);
    // Flatten the nested data into a stacked dataset
    let stackedData = Array.from(nestedData, ([key, values]) => {
      let y0 = 0;

      values.sort((a, b) => b.sellingprice - a.sellingprice);
      return values.map((d) => {
        const entry = {
          saledate: key,
          sellingprice: +d.sellingprice,
          y0: y0,
          ...d,
        };
        y0 += d.sellingprice;

        return entry;
      });
    }).flat();

    const dateRange = d3.extent(nestedData.keys(), (d) => d);
    let dates = generateDateArray(dateRange[0], dateRange[1]);
    let months = generateMonthArray(dateRange[0], dateRange[1]);
    console.log(dates);
    const domainX = [...nestedData.keys()].sort((a, b) => a - b);
    domainX.shift();

    const x = d3.scaleBand().domain(dates).rangeRound([0, width]).padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(stackedData, (d) => d.y0 + d.sellingprice)])
      .rangeRound([height, 0]);

    // .attr("transform", "rotate(0)") // Rotate the tick labels for better visibility
    // .style("text-anchor", "end"); // Align the rotated labels

    // Add y-axis

    function generateDateArray(startDate, endDate) {
      let dateArray = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Push a copy of the current date to the array
        dateArray.push(new Date(currentDate));
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dateArray;
    }
    function generateMonthArray(startDate, endDate) {
      let dateArray = [];
      let currentDate = new Date(startDate);

      while (currentDate <= new Date(endDate).setDate(1)) {
        // Push a copy of the current date to the array
        currentDate.setDate(1);
        dateArray.push(new Date(currentDate));
        // Move to the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // currentDate.setDate(1);
      }

      return dateArray;
    }
    console.log(months);
    // data = data.filter((d) => d.saledate.getFullYear() == 2014);
    const xAxis = d3
      .axisBottom(x)
      .tickValues(months)
      .tickFormat(d3.timeFormat("%Y-%m")); // Adjust the number of ticks as needed
    const yAxis = d3.axisLeft(y);

    const bars = svg
      .selectAll(".bar")
      .data(stackedData)
      .join("rect")
      .attr("class", "bar")
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .transition()
      .attr("x", (d) => x(d.saledate))
      .attr("y", (d) => y(d.y0 + d.sellingprice))
      .attr("height", (d) => y(d.y0) - y(d.y0 + d.sellingprice))
      .attr("width", x.bandwidth());

    x_axis.transition().call(xAxis);
    y_axis.transition().call(d3.axisLeft(y).ticks(6));
  }

  function updateColor(color, key, unique, selectList) {
    _key = key;
    _selectedList = selectList;
    _color = color;
    svg
      .selectAll(".dot")
      .attr("class", (d) => `dot ${d[key]}`)
      // .transition()
      .style("fill", (d) => color(d[key]));

    function colorAll(e, d) {
      svg
        .selectAll(".dot")
        // .transition()
        .classed("deactive", false)
        .style("fill", (n) => color(n[key]));
      // .attr("stroke-width", 1);
    }
    function colorReset(e, d) {
      svg
        .selectAll(".dot")
        // .transition()
        .classed("deactive", true);
      // .attr("fill", "lightgray")
      // .attr("stroke-width", "0px");
    }

    function colorClick(e, d) {
      if (selectList.has(d)) {
        svg
          .selectAll(`.dot.${d}`)
          // .transition()
          .style("fill", color(d))
          .classed("deactive", false)
          .raise();

        svg.selectAll(`.dot:not(.${d})`).classed("deactive", true);

        // .attr("stroke-width", 1);
      } else {
        svg
          .selectAll(`.dot.${d}`)
          .lower()
          // .transition()
          .classed("deactive", true);
        svg
          .selectAll(`.dot:not(.${d})`)
          .filter((n) => selectList.has(n[key]))
          .classed("deactive", false)
          .transition()
          .style("fill", (n) => color(n[key]))
          .raise();
        // .attr("fill", "lightgray")
        // .attr("stroke-width", "0px");
      }
    }
    function colorOver(e, d) {
      svg
        .selectAll(`.dot:not(.${d})`)
        .lower()
        // .transition()
        .classed("deactive", true);
      // .attr("fill", (d) => "lightgray")
      // .attr("stroke-width", "0px");

      svg
        .selectAll(`.dot.${d}`)
        // .transition()
        .classed("deactive", false)
        .style("fill", color(d));

      // .attr("stroke-width", 1);
    }
    function colorOut(e, d) {
      svg.selectAll(".dot").each(function (n) {
        if (selectList.has(n[key]))
          d3.select(this)
            // .transition()
            .style("fill", color(n[key]))
            .classed("deactive", false);
        // .attr("stroke-width", 1);
        else
          d3.select(this)
            .lower()
            // .transition()
            .classed("deactive", true);

        // .attr("fill", "lightgray")
        // .attr("stroke-width", "0px");
      });
    }

    return {
      colorAll,
      colorReset,
      colorClick,
      colorOver,
      colorOut,
    };
  }

  updateBarChart(data);
  return { updateColor, updateBarChart };

  // Function to update the bar chart
  // function updateBarChart() {
  //   // Filter data by multiple makes
  //   // const filteredData = data.filter((d) => makes.includes(d.make));
  //   const filteredData = data;

  //   // Sort filteredData by date
  //   filteredData.sort((a, b) => a.saledate - b.saledate);

  //   // Set the domains
  //   // x.domain(filteredData.map((d) => d.saledate));
  //   x.domain(d3.extent(data, (d) => d.saledate));
  //   y.domain([0, d3.max(filteredData, (d) => d.sellingprice)]);

  //   // Join the data
  //   const bars = svg.selectAll(".bar").data(filteredData);

  //   // Remove exiting bars
  //   bars.exit().remove();

  //   // Update existing bars
  //   bars
  //     .attr("x", (d) => x(d.saledate) - barWidth / 2)
  //     // .attr("width", x.bandwidth())
  //     .attr("width", barWidth - 1)

  //     .attr("y", (d) => y(d.sellingprice))
  //     .attr("height", (d) => height - y(d.sellingprice));

  //   // Add new bars
  //   bars
  //     .enter()
  //     .append("rect")
  //     .attr("class", "bar")
  //     .attr("x", (d) => x(d.saledate) - barWidth / 2)
  //     // .attr("width", x.bandwidth())
  //     .attr("width", barWidth - 1)

  //     .attr("y", (d) => y(d.sellingprice))
  //     .attr("height", (d) => height - y(d.sellingprice))
  //     .on("mouseover", (event, d) => {
  //       tooltip.transition().duration(200).style("opacity", 0.9);
  //       tooltip
  //         .html(
  //           `Date: ${d3.timeFormat("%Y-%m-%d")(d.saledate)}<br>Price: $${
  //             d.sellingprice
  //           }`
  //         )
  //         .style("left", event.pageX + 5 + "px")
  //         .style("top", event.pageY - 28 + "px");
  //     })
  //     .on("mouseout", () => {
  //       tooltip.transition().duration(500).style("opacity", 0);
  //     });

  //   // Update the X Axis
  //   svg.select(".axis-x").remove();
  //   svg
  //     .append("g")
  //     .attr("class", "axis-x")
  //     .attr("transform", `translate(0,${height})`)
  //     .call(
  //       xAxis
  //       // .tickValues([
  //       //   filteredData[0]?.saledate,
  //       //   filteredData[filteredData.length - 1]?.saledate,
  //       // ])
  //       // .tickFormat(d3.timeFormat("%Y-%m-%d"))
  //     );

  //   // Update the Y Axis
  //   svg.select(".axis-y").remove();
  //   svg.append("g").attr("class", "axis-y").call(yAxis);
  // }

  // // Initial render
  // // updateBarChart();

  // // Update makes array and re-render the chart
  // window.updateMakes = function (make) {
  //   const index = makes.indexOf(make);
  //   if (index > -1) {
  //     // Make already in the array, remove it
  //     makes.splice(index, 1);
  //   } else {
  //     // Make not in the array, add it
  //     makes.push(make);
  //   }
  //   updateBarChart();
  // };
}
