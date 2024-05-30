export function Scatter(container, data) {
  let { width, height } = container.getBoundingClientRect();
  const rect = container.getBoundingClientRect();
  console.log(width, height);
  var margin = { top: 50, right: 50, bottom: 50, left: 70 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  var svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const dimensions = [
    "mmr",
    "sellingprice",
    "year",
    "odometer",
    "sp-mmr",
    "condition",
    "age",
  ];

  let xaxis = "sellingprice",
    yaxis = "mmr";
  // const { x, y, x_axis, y_axis, circles } = setUp(data, xaxis, yaxis);
  let __dimensions = ["saledate", "sellingprice", "trim", "state"];
  let _dimensions;

  const x_options = document.querySelectorAll("[data-xaxis]");
  const dropdownScatterXBtn = document.getElementById("dropdownScatterXBtn");
  x_options.forEach((d) => {
    d.addEventListener("click", (e) => {
      const value = e.target.dataset.xaxis;
      dropdownScatterXBtn.textContent = value;
      xaxis = value;
      // changeAxis(data, xaxis, yaxis);
      setUp(data, xaxis, yaxis);
    });
  });

  const y_options = document.querySelectorAll("[data-yaxis]");
  const dropdownScatterYBtn = document.getElementById("dropdownScatterYBtn");
  y_options.forEach((d) => {
    d.addEventListener("click", (e) => {
      const value = e.target.dataset.yaxis;
      dropdownScatterYBtn.textContent = value;
      yaxis = value;
      // changeAxis(data, xaxis, yaxis);
      setUp(data, xaxis, yaxis);
    });
  });

  [dropdownScatterXBtn.textContent, dropdownScatterYBtn.textContent] = [
    xaxis,
    yaxis,
  ];

  const x_axis = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")");

  const y_axis = svg.append("g").attr("class", "axis");

  const x = d3
    .scaleLinear()
    //   .domain(d3.extent(data, (d) => +d[xaxis]))
    .domain([0, d3.max(data, (d) => +d[xaxis])])

    .range([0, width]);

  const y = d3
    .scaleLinear()
    //   .domain(d3.extent(data, (d) => +d[yaxis]))
    .domain([0, d3.max(data, (d) => +d[yaxis])])

    .range([height, 0]);

  let _key,
    _selectedList = new Set(),
    _color;
  setUp(data, xaxis, yaxis);

  function setUp(data) {
    x.domain(d3.extent(data, (d) => +d[xaxis]));

    y.domain(d3.extent(data, (d) => +d[yaxis]));

    x_axis.transition().call(d3.axisBottom(x).tickFormat(d3.format("d")));

    y_axis.transition().call(d3.axisLeft(y).tickFormat(d3.format("d")));
    const circles = svg
      .selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("class", (d) => `dot ${d?.[_key] ?? ""}`)
      .classed("deactive", (d) => !_selectedList.has(d[_key]))
      .each(function (d) {
        if (_selectedList.has(d[_key])) {
          d3.select(this)
            .classed("deactive", false)
            .style("fill", _color(d[_key]));
          // .raise();
        } else {
          d3.select(this).classed("deactive", true).lower();
        }
      })
      .attr("r", 1)
      .attr("cx", function (d) {
        return x(+d[xaxis]);
      })
      .attr("cy", function (d) {
        return y(+d[yaxis]);
      })
      .attr("opacity", 0.8)
      .on("mouseenter", showTooltip)
      .on("mouseout", hideTooltip)
      .transition()
      .attr("r", 5);

    // Customizing the axis line

    x_axis.transition().call(d3.axisBottom(x).tickFormat(d3.format("d")));

    y_axis.transition().call(d3.axisLeft(y).tickFormat(d3.format("d")));
    styleAxis(svg);

    _dimensions = [...new Set([xaxis, yaxis, _key, ...__dimensions])];
  }
  function styleAxis(svg) {
    // Customizing the axis line
    svg
      .selectAll(".axis line")
      .style("stroke", "#333")
      .style("stroke-width", "2px");

    // Customizing the axis path
    svg
      .selectAll(".axis path")
      .style("stroke", "#333")
      .style("stroke-width", "5px");

    svg
      .selectAll(".axis text")
      .style("font-size", "14px")
      .style("fill", "#000");
  }

  const tooltip = d3.select(".sc_tooltip");

  // [ 'make', 'model', 'trim', 'body','saledate', 'sellingprice', 'year','state', 'color', 'interior', 'mmr', 'age']

  function showTooltip(e, d) {
    e.stopPropagation();
    const lists = _dimensions.reduce((acc, col) => {
      const name = col;
      let value = d[col];
      if (name == "sellingprice" || name == "mmr" || name == "sp-mmr")
        value = `${Math.round(d[col]).toLocaleString()}`;
      else if (name == "saledate") {
        value = d3.timeFormat("%Y-%m-%d")(d[col]);
      }
      if (name == null) return acc;
      return (
        acc +
        `<li  class="${
          col == xaxis || col == yaxis ? "highlight" : ""
        }">${name}: 
        ${value}</li>`
      );
    }, ``);

    let [left, top] = [e.pageX - rect.x, e.pageY - rect.y];
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

      .select(".sc-name")
      .text(d.make + " " + d.model);

    tooltip.select("ul").html(lists);
  }
  function hideTooltip(e, d) {
    tooltip.classed("active", false);
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
    _dimensions = [...new Set([xaxis, yaxis, _key, ...__dimensions])];

    return {
      colorAll,
      colorReset,
      colorClick,
      colorOver,
      colorOut,
    };
  }
  return { updateColor, updateScatter: setUp };
  // d3.selectAll(".color-select").property("checked", true);
  // d3.select("#all-colors").property("checked", true);

  // //   updateChart();

  // d3.select("#all-colors").on("change", function () {
  //   var isChecked = d3.select(this).property("checked");
  //   d3.selectAll(".color-select").property("checked", isChecked);
  //   updateChart();
  // });

  // d3.selectAll(".color-select").on("change", function () {
  //   var allChecked = d3
  //     .selectAll(".color-select")
  //     .nodes()
  //     .every(function (d) {
  //       return d.checked;
  //     });
  //   d3.select("#all-colors").property("checked", allChecked);
  //   // updateChart();
  // });

  function updateChart() {
    var xFeature = d3.select("#x-axis-select").property("value");
    var yFeature = d3.select("#y-axis-select").property("value");

    var selectedColors = [];
    var colorMap = {};

    if (d3.select("#all-colors").property("checked")) {
      d3.selectAll(".color-select").each(function () {
        var checkbox = d3.select(this);
        selectedColors.push(checkbox.property("value"));
        colorMap[checkbox.property("value")] = checkbox.attr("color");
      });
    } else {
      d3.selectAll(".color-select:checked").each(function () {
        var checkbox = d3.select(this);
        selectedColors.push(checkbox.property("value"));
        colorMap[checkbox.property("value")] = checkbox.attr("color");
      });
    }

    var x = d3
      .scaleLinear()
      .domain([
        d3.min(data, function (d) {
          return +d[xFeature];
        }),
        d3.max(data, function (d) {
          return +d[xFeature];
        }),
      ])
      .range([0, width]);

    var y = d3
      .scaleLinear()
      .domain([
        d3.min(data, function (d) {
          return +d[yFeature];
        }),
        d3.max(data, function (d) {
          return +d[yFeature];
        }),
      ])
      .range([height, 0]);

    svg.selectAll("*").remove();

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g").call(d3.axisLeft(y));

    // Draw unselected
    svg
      .append("g")
      .selectAll("dot")
      .data(
        data.filter(function (d) {
          var color = d.color.toLowerCase();
          if (
            color !== "black" &&
            color !== "silver" &&
            color !== "white" &&
            color !== "gray"
          ) {
            color = "others";
          }
          return !selectedColors.includes(color);
        })
      )
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return x(d[xFeature]);
      })
      .attr("cy", function (d) {
        return y(d[yFeature]);
      })
      .attr("r", 5)
      .style("fill", "#FFCCE5");

    // Draw selected with thier colors
    svg
      .append("g")
      .selectAll("dot")
      .data(
        data.filter(function (d) {
          var color = d.color.toLowerCase();
          if (
            color !== "black" &&
            color !== "silver" &&
            color !== "white" &&
            color !== "gray"
          ) {
            color = "others";
          }
          return selectedColors.includes(color);
        })
      )
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return x(d[xFeature]);
      })
      .attr("cy", function (d) {
        return y(d[yFeature]);
      })
      .attr("r", 5)
      .style("fill", function (d) {
        var color = d.color.toLowerCase();
        if (
          color !== "black" &&
          color !== "silver" &&
          color !== "white" &&
          color !== "gray"
        ) {
          color = "others";
        }
        return colorMap[color];
      });

    svg.selectAll("*").remove();
  }

  return function updateScatter(data) {};

  //   d3.select("#x-axis-select").on("change", updateChart);
  //   d3.select("#y-axis-select").on("change", updateChart);
  //   d3.selectAll(".color-select").on("change", updateChart);
}
