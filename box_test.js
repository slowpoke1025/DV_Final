export function Box(container, data) {
  let { width, height } = container.getBoundingClientRect();
  let rect = container.getBoundingClientRect();
  const margin = { top: 20, right: 30, bottom: 40, left: 110 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select(".box_tooltip");
  const sortSwitch = d3.select("#box-sort-switch").on("change", (e, d) => {
    by = sortSwitch.property("checked") ? "median" : "mean";
    updateBoxPlot(data);
  });

  let category = "state";
  let by = "median";
  let summaryStats = summarize(data);

  const y = d3
    .scaleBand()
    .range([height, 0])
    .domain(data.map((d) => d.state))
    .padding(0.5);

  const x = d3
    .scaleLinear()
    .range([0, width])
    .domain([0, d3.max(summaryStats, (d) => d[1].max)]);

  const y_axis = svg.append("g").attr("class", "y axis").call(d3.axisLeft(y));

  const x_axis = svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  updateBoxPlot(data);

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

  function updateBoxPlot(data) {
    const DURATION = 750;
    summaryStats = summarize(data);

    y.domain(summaryStats.map((d) => d[0]));
    x.domain([0, d3.max(summaryStats, (d) => d[1].max)]);

    y_axis.transition().duration(DURATION).call(d3.axisLeft(y));
    x_axis.transition().duration(DURATION).call(d3.axisBottom(x));

    let vertLines = svg
      .selectAll(".vertLines")
      .data(summaryStats, (d) => d[0])
      .join("line")
      .attr("class", "vertLines")
      .attr("x1", (d) => x(d[1].min))
      .transition()
      .duration(DURATION)
      .attr("x2", (d) => x(d[1].max))
      .attr("y1", (d) => y(d[0]) + y.bandwidth() / 2)
      .attr("y2", (d) => y(d[0]) + y.bandwidth() / 2)
      .attr("stroke", "black");

    let boxes = svg
      .selectAll(".box")
      .data(summaryStats, (d) => d[0])
      .join("rect", null, (exit) =>
        exit
          .transition()
          .duration(DURATION)
          .style("opacity", 0)
          .attr("width", 0)
          .attr("height", 0)
          .remove()
      )
      .attr("class", "box")
      .on("mousemove", showTooltip)
      .on("mouseout", hideTooltip)
      .transition()
      .duration(DURATION)
      .attr("x", (d) => x(d[1].q1))
      .attr("y", (d) => y(d[0]))
      .attr("width", (d) => x(d[1].q3) - x(d[1].q1))

      .attr("height", y.bandwidth())
      .attr("stroke", "black")
      .attr("fill", "teal");

    let point = svg
      .selectAll(".point")
      .data(summaryStats, (d) => d[0])
      .join("circle")
      .attr("class", "point")
      .transition()
      .attr("cx", (d) => x(d[1].mean))
      .attr("cy", (d) => y(d[0]) + y.bandwidth() / 2)
      .attr("r", 3)
      .attr("fill", "orange");

    let medianLines = svg
      .selectAll(".medianLines")
      .data(summaryStats, (d) => d[0])
      .join("line")
      .attr("class", "medianLines")
      .transition()
      .duration(DURATION)
      .attr("y1", (d) => y(d[0]))
      .attr("y2", (d) => y(d[0]) + y.bandwidth())
      .attr("x1", (d) => x(d[1].median))
      .attr("x2", (d) => x(d[1].median))
      .attr("stroke", "black");

    const dimensions = ["min", "q1", "median", "mean", "q3", "IQR", "max"];
    function showTooltip(e, d) {
      const lists = dimensions.reduce((acc, col) => {
        const name = col;
        return (
          acc +
          `<li class="${name} ${col == "median" ? "highlight" : ""}">${name}: 
          ${Math.round(d[1][col]).toLocaleString()}</li>`
        );
      }, ``);

      const { height: tooltip_h } = tooltip.node().getBoundingClientRect();
      let [left, top] = [e.pageX - rect.x + 10, e.pageY - rect.y + 10];
      //   let flag = top + tooltip_h * 2 > rect.y + rect.height;
      //   let flag = top - tooltip_h - 100 <= rect.y;
      let flag = e.pageY < rect.y + height / 2;

      tooltip
        .style("left", `calc(${left}px)`)
        .style("top", `calc(${top}px)`)
        .style("transform", (d) =>
          flag ? `translateY(0)` : `translateY(-100%)`
        )
        .classed("active", true)

        .select(".box-name")
        .text(d[0]);

      tooltip.select("ul").html(lists);
    }
    function hideTooltip(e, d) {
      tooltip.classed("active", false);
    }

    const agg_options = document.querySelectorAll(
      ".box-control .dropdown-item"
    );
    const dropdownBoxBtn = document.getElementById("dropdownBoxBtn");

    agg_options.forEach((d) => {
      d.addEventListener("click", (e) => {
        const value = e.target.dataset.box;
        dropdownBoxBtn.textContent = value;
        category = value;
        updateBoxPlot(data);
      });
    });
    styleAxis(svg);
    // let boxes = svg
    //   .selectAll(".box")
    //   .data(summaryStats)
    //   .join(
    //     (enter) => {
    //       console.log(enter);
    //       return enter
    //         .append("rect")
    //         .attr("class", "box")

    //         .attr("x", (d) => x(d[1].q1))
    //         .transition()

    //         .attr("width", (d) => x(d[1].q3) - x(d[1].q1))
    //         .attr("y", (d) => y(d[0]))
    //         .attr("height", y.bandwidth())
    //         .attr("stroke", "black")
    //         .attr("fill", "#ffde00");
    //     },
    //     (update) => {
    //       update
    //         .transition()
    //         .duration(500)
    //         .attr("x", (d) => x(d[1].q1))
    //         .attr("width", (d) => x(d[1].q3) - x(d[1].q1))
    //         .attr("y", (d) => y(d[0]))
    //         .attr("height", y.bandwidth())
    //         .attr("fill", "teal");
    //     },
    //     (exit) => {
    //       console.log(exit);
    //       exit
    //         .transition()
    //         .attr("fill", "#333")
    //         .attr("width", 0)
    //         .attr("height", 0)
    //         .remove();
    //     }
    //   );
  }

  function summarize(data) {
    return Array.from(
      d3.rollup(
        data,
        (v) => {
          let q1 = d3.quantile(
            v.map((g) => g.sellingprice).sort(d3.ascending),
            0.25
          );
          let median = d3.quantile(
            v.map((g) => g.sellingprice).sort(d3.ascending),
            0.5
          );
          let q3 = d3.quantile(
            v.map((g) => g.sellingprice).sort(d3.ascending),
            0.75
          );
          let IQR = q3 - q1;
          let min = Math.max(0, q1 - 1.5 * IQR);
          let max = q3 + 1.5 * IQR;
          let mean = d3.mean(v, (g) => +g.sellingprice);

          return { min, q1, median, q3, IQR, max, mean };
        },
        (d) => d[category]
      )
    ).sort((b, a) => a[1][by] - b[1][by]);
  }

  return { updateBoxPlot };
}
