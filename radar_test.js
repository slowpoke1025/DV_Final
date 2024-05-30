//https://gist.github.com/alandunning/4c36eb1abdb248de34c64f5672afd857 link

var RadarChart = {
  draw: function (id, d, options) {
    var cfg = {
      radius: 5,
      w: 800,
      h: 800,
      factor: 1,
      factorLegend: 0.85,
      levels: 3,
      maxValue: 100000,
      radians: 2 * Math.PI,
      opacityArea: 0.5,
      ToRight: 10,
      TranslateX: 0,
      TranslateY: 0,
      ExtraWidthX: 0,
      ExtraWidthY: 0,
      color: d3.scaleOrdinal().range(["#6F257F", "#CA0D59"]),
    };

    cfg = { ...cfg, ...options };
    console.log(d);

    var allAxis = d[0].map(function (i, j) {
      return i.axis;
    });
    var total = allAxis.length;
    var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
    var Format = d3.format("%");
    d3.select(id).select("svg").remove();

    var g = d3
      .select(id)
      .append("svg")
      .attr("width", cfg.w + cfg.ExtraWidthX)
      .attr("height", cfg.h + cfg.ExtraWidthY)
      .append("g")
      .attr(
        "transform",
        "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")"
      );

    /* grid */
    for (var j = 0; j < cfg.levels; j++) {
      var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
      g.selectAll(".levels")
        .data(allAxis)
        .enter()
        .append("svg:line")
        .attr("x1", function (d, i) {
          return (
            levelFactor * (1 - cfg.factor * Math.sin((i * cfg.radians) / total))
          );
        })
        .attr("y1", function (d, i) {
          return (
            levelFactor * (1 - cfg.factor * Math.cos((i * cfg.radians) / total))
          );
        })
        .attr("x2", function (d, i) {
          return (
            levelFactor *
            (1 - cfg.factor * Math.sin(((i + 1) * cfg.radians) / total))
          );
        })
        .attr("y2", function (d, i) {
          return (
            levelFactor *
            (1 - cfg.factor * Math.cos(((i + 1) * cfg.radians) / total))
          );
        })
        .attr("class", "line")
        .style("stroke", "red")
        .style("stroke-opacity", "0.75")
        .style("stroke-width", "0.3px")
        .attr(
          "transform",
          "translate(" +
            (cfg.w / 2 - levelFactor) +
            ", " +
            (cfg.h / 2 - levelFactor) +
            ")"
        );
    }

    for (var j = 0; j < cfg.levels; j++) {
      var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
      g.selectAll(".levels")
        .data([1])
        .enter()
        .append("svg:text")
        .attr("x", function (d) {
          return levelFactor * (1 - cfg.factor * Math.sin(0));
        })
        .attr("y", function (d) {
          return levelFactor * (1 - cfg.factor * Math.cos(0));
        })
        .attr("class", "legend")
        .style("font-family", "sans-serif")
        .style("font-size", "10px")
        .attr(
          "transform",
          "translate(" +
            (cfg.w / 2 - levelFactor + cfg.ToRight) +
            ", " +
            (cfg.h / 2 - levelFactor) +
            ")"
        )
        .attr("fill", "#737373")
        .text(((j + 1) * 100000) / cfg.levels);
    }

    let series = 0;

    var axis = g
      .selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", cfg.w / 2)
      .attr("y1", cfg.h / 2)
      .attr("x2", function (d, i) {
        // let radius = Math.min(cfg.w, cfg.h) / 2; // Use the minimum of width and height to ensure uniform length
        return (
          cfg.w / 2 + radius * cfg.factor * Math.sin((i * cfg.radians) / total)
        );
      })
      .attr("y2", function (d, i) {
        // let radius = Math.min(cfg.w, cfg.h) / 2; // Use the minimum of width and height to ensure uniform length
        return (
          cfg.h / 2 - radius * cfg.factor * Math.cos((i * cfg.radians) / total)
        );
      });
    // .attr("x2", function (d, i) {
    //   return (
    //     (cfg.w / 2) * (1 - cfg.factor * Math.sin((i * cfg.radians) / total))
    //   );
    // })
    // .attr("y2", function (d, i) {
    //   return (
    //     (cfg.h / 2) * (1 - cfg.factor * Math.cos((i * cfg.radians) / total))
    //   );
    // })
    // .attr("class", "line")
    // .style("stroke", "green")
    // .style("stroke-width", "2px");
    const gap = 20;
    axis
      .append("text")
      .attr("class", "legend")
      .text(function (d, i) {
        return d;
      })
      .style("font-family", "sans-serif")
      .style("font-size", "15px")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .attr("transform", function (d, i) {
        return "translate(0, -10)";
      })
      .attr("x", function (d, i) {
        return cfg.w / 2 + (radius + gap) * Math.sin((i * cfg.radians) / total);
      })
      .attr("y", function (d, i) {
        return cfg.h / 2 - (radius + gap) * Math.cos((i * cfg.radians) / total);
      });
    // .attr("x", function (d, i) {
    //   return (
    //     (cfg.w / 2) *
    //       (1 - cfg.factorLegend * Math.sin((i * cfg.radians) / total)) -
    //     60 * Math.sin((i * cfg.radians) / total)
    //   );
    // })
    // .attr("y", function (d, i) {
    //   return (
    //     (cfg.h / 2) * (1 - Math.cos((i * cfg.radians) / total)) -
    //     20 * Math.cos((i * cfg.radians) / total)
    //   );
    // });

    const dataValues = [];
    d.forEach(function (y, x) {
      g.selectAll(".nodes").data(y, function (j, i) {
        dataValues.push([
          (cfg.w / 2) *
            (1 -
              (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                cfg.factor *
                Math.sin((i * cfg.radians) / total)),
          (cfg.h / 2) *
            (1 -
              (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                cfg.factor *
                Math.cos((i * cfg.radians) / total)),
        ]);
      });
      dataValues.push(dataValues[0]);
      g.selectAll(".area")
        .data([dataValues])
        .enter()
        .append("polygon")
        .attr("class", "radar-chart-serie" + series)
        .style("stroke-width", "2px")
        .style("stroke", cfg.color(series))
        .attr("points", function (d) {
          var str = "";
          for (var pti = 0; pti < d.length; pti++) {
            str = str + d[pti][0] + "," + d[pti][1] + " ";
          }
          return str;
        })
        .style("fill", function (j, i) {
          return cfg.color(series);
        })
        .style("fill-opacity", cfg.opacityArea)
        .on("mouseover", function (d) {
          const z = "polygon." + d3.select(this).attr("class");
          g.selectAll("polygon").transition(200).style("fill-opacity", 0.1);
          g.selectAll(z).transition(200).style("fill-opacity", 0.7);
        })
        .on("mouseout", function () {
          g.selectAll("polygon")
            .transition(200)
            .style("fill-opacity", cfg.opacityArea);
        });
      series++;
    });
    series = 0;

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    d.forEach(function (y, x) {
      g.selectAll(".nodes")
        .data(y)
        .enter()
        .append("svg:circle")
        .attr("class", "radar-chart-serie" + series)
        .attr("r", cfg.radius)
        .attr("alt", function (j) {
          return Math.max(j.value, 0);
        })
        .attr("cx", function (j, i) {
          dataValues.push([
            (cfg.w / 2) *
              (1 -
                (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                  cfg.factor *
                  Math.sin((i * cfg.radians) / total)),
            (cfg.h / 2) *
              (1 -
                (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) *
                  cfg.factor *
                  Math.cos((i * cfg.radians) / total)),
          ]);
          return (
            (cfg.w / 2) *
            (1 -
              (Math.max(j.value, 0) / cfg.maxValue) *
                cfg.factor *
                Math.sin((i * cfg.radians) / total))
          );
        })
        .attr("cy", function (j, i) {
          return (
            (cfg.h / 2) *
            (1 -
              (Math.max(j.value, 0) / cfg.maxValue) *
                cfg.factor *
                Math.cos((i * cfg.radians) / total))
          );
        })
        .attr("data-id", function (j) {
          return j.axis;
        })
        .style("fill", "#fff")
        .style("stroke-width", "2px")
        .style("stroke", cfg.color(series))
        .style("fill-opacity", 0.9)
        .on("mouseover", function (e, d) {
          tooltip
            .style("left", e.pageX - 40 + "px")
            .style("top", e.pageY - 80 + "px")
            .style("display", "inline-block")
            .html(d.make + "<br><span>" + d.value + "</span>");
        })
        .on("mouseout", function (d) {
          tooltip.style("display", "none");
        });

      series++;
    });
  },
};

/************************************************ */

export function Radar(container, data) {
  let { width, height } = container.getBoundingClientRect();

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  // const svg = d3
  //   .select(container)
  //   .append("svg")
  //   .attr("width", width + margin.left + margin.right)
  //   .attr("height", height + margin.top + margin.bottom)
  //   .append("g")
  //   .attr("transform", `translate(${margin.left},${margin.top})`);

  const makes = Array.from(new Set(data.map((d) => d.make))).sort();
  const makeSelect = d3.select("#make");
  makeSelect
    .selectAll("option")
    .data(makes)
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  makeSelect.on("change", updateChart);

  updateChart();

  /**** */
  function updateChart() {
    const selectedMakes = makeSelect
      .selectAll("option:checked")
      .nodes()
      .map((d) => d.value);
    const selectedData = selectedMakes
      .map((make) => {
        const filteredData = data.filter((d) => d.make === make);
        if (filteredData.length > 0) {
          return [
            {
              axis: "SP-MMR",
              make: filteredData[0].make,
              value: Math.abs(
                d3.mean(filteredData, (d) => +d.sellingprice - +d.mmr)
              ),
            }, // top
            {
              axis: "Total",
              make: filteredData[0].make,
              value: filteredData.length * 100,
            }, // left
            {
              axis: "MMR",
              make: filteredData[0].make,
              value: +filteredData[0].mmr,
            }, // bottom
            {
              axis: "SP",
              make: filteredData[0].make,
              value: +filteredData[0].sellingprice,
            }, // right
          ];
        }
        return null;
      })
      .filter((d) => d !== null);
    console.log(selectedData);
    if (selectedData.length > 0) {
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(selectedMakes);
      updateLegend(selectedData, colorScale);
      drawRadarChart(selectedData, colorScale);
    } else {
      d3.select(".radar-container").selectAll("*").remove();
      d3.select("#legend").selectAll("*").remove();
    }
  }

  function drawRadarChart(data, colorScale) {
    const chartConfig = {
      w: width,
      h: height,
      levels: 5,
      roundStrokes: true,
      color: colorScale,
      TranslateX: margin.left,
      TranslateY: margin.top,
      ExtraWidthX: margin.left + margin.right,
      ExtraWidthY: margin.top + margin.bottom,
    };
    RadarChart.draw(".radar-container", data, chartConfig);
  }
  function updateLegend(data, colorScale) {
    const legendContainer = d3.select("#legend");
    legendContainer.selectAll("*").remove();

    const svg = legendContainer
      .append("svg")
      .attr("width", data.length * 150)
      .attr("height", 20);

    const legend = svg
      .selectAll(".legend")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate( ${i * 150}, 0)`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", (d, i) => colorScale(i));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("dy", "0.35em")
      .text((d) => d[0].make);
  }
}
