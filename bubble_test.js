import { calculateMedian } from "./lib/median.js";
export function BubbleFilter(container, data, update) {
  // let brandSales = d3.rollup(
  //   data,
  //   (v) => ({
  //     size: v.length,
  //     mean:
  //       v.reduce(function (total, i) {
  //         return total + +i.sellingprice;
  //       }, 0) / v.length,
  //     sum: v.reduce(function (total, i) {
  //       return total + +i.sellingprice;
  //     }, 0),
  //     median: calculateMedian(v.map((d) => +d.sellingprice)),
  //   }),
  //   (d) => d.make
  // );
  // // Convert brandSales map to array of objects
  // let brandSalesArray = Array.from(
  //   brandSales,
  //   ([make, { size, mean, sum, median }]) => ({
  //     make,
  //     size,
  //     mean,
  //     sum,
  //     median,
  //   })
  // );

  let selectBrand = new Set(),
    simulation,
    brandSales;
  // let selectBrand = new Set(brandSales.keys());

  // Set up the SVG

  const main_width = container.node().clientWidth;
  const main_height = container.node().clientHeight;
  const margin = { top: 40, right: 30, bottom: 30, left: 30 },
    width = +main_width - margin.left - margin.right,
    height = +main_height - margin.top - margin.bottom;
  const rect = container.node().getBoundingClientRect();
  const svg = container
    .append("svg")
    .attr("width", "100%")
    // .attr("width", width + margin.left + margin.right)

    // .attr("height", height + margin.top + margin.bottom)
    .attr("height", "100%")

    .attr("style", "max-width: 100%; max-height: 100%;")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Set a minimum radius for bubbles
  var minRadius = 5; // Adjust as needed
  const r = {};
  const dimensions = ["size", "mean", "sum", "median"];
  let target = "size";
  const colors = {
    size: d3.interpolateBlues(0.5),
    mean: d3.interpolateGreens(0.5),
    sum: d3.interpolateReds(0.5),
    median: d3.interpolateRdPu(0.5),
  };

  const tooltip = d3.select(".brand_tooltip");
  // dimensions.forEach((c) => {
  //   r[c] = d3.scaleLinear(
  //     // d3.extent(brandSalesArray, (d) => d.size), //calc(d.size)
  //     [0, d3.max(brandSalesArray, (d) => calc(d, c))], //calc(d.size)
  //     [minRadius, (Math.min(width, height) / 2) * 0.35]
  //   );
  // });

  // // Create simulation for bubbles
  // var simulation = d3
  //   .forceSimulation(brandSalesArray)
  //   .force("center", d3.forceCenter(width / 2, height / 2))
  //   .force(
  //     "collide",
  //     d3.forceCollide().radius((d) => r[target](calc(d, target)) * 0.99)
  //   )
  //   .force("charge", d3.forceManyBody().strength(-10))
  //   .force("attract", d3.forceManyBody().strength(20))
  //   .on("tick", ticked);

  // Append groups for bubbles and labels

  const controlContainer = document.querySelector(".brand-control");
  const agg_options = controlContainer.querySelectorAll(".dropdown-item");
  const dropdownBrandBtn = document.getElementById("dropdownBrandBtn");
  const resetBtn = document.getElementById("brand-reset");
  const allBtn = document.getElementById("brand-all");

  agg_options.forEach((d) => {
    d.addEventListener("click", (e) => {
      const value = e.target.dataset.brandColor.split("_")[1];
      dropdownBrandBtn.textContent = value;
      updateRadius(value);
    });
  });

  resetBtn.addEventListener("click", (e) => {
    svg.selectAll(".bubble").classed("selected", false);
    selectBrand.clear();
    e.target.disabled = true;
    allBtn.disabled = false;
    update("RESET");
  });

  allBtn.addEventListener("click", (e) => {
    svg.selectAll(".bubble").classed("selected", true);
    selectBrand = new Set(brandSales.keys());
    e.target.disabled = true;
    resetBtn.disabled = false;
    update();
  });

  updateBubble(data);
  function updateBubble(data) {
    brandSales = d3.rollup(
      data,
      (v) => ({
        size: v.length,
        mean:
          v.reduce(function (total, i) {
            return total + +i.sellingprice;
          }, 0) / v.length,
        sum: v.reduce(function (total, i) {
          return total + +i.sellingprice;
        }, 0),
        median: calculateMedian(v.map((d) => +d.sellingprice)),
      }),
      (d) => d.make
    );

    let brandSalesArray = Array.from(
      brandSales,
      ([make, { size, mean, sum, median }]) => ({
        make,
        size,
        mean,
        sum,
        median,
      })
    );

    let _selectedBrand = new Set(brandSales.keys());

    const newElem = _selectedBrand.difference(selectBrand);
    const oldElem = selectBrand.difference(_selectedBrand);

    if (selectBrand.size == 0) newElem.forEach((d) => selectBrand.add(d));
    oldElem.forEach((d) => selectBrand.delete(d));

    handleControlBtn();

    dimensions.forEach((c) => {
      r[c] = d3.scaleLinear(
        [0, d3.max(brandSalesArray, (d) => calc(d, c))],
        [minRadius, (Math.min(width, height) / 2) * 0.35]
      );
    });

    let bubbleGroups = svg
      .selectAll(".bubble-group")
      .data(brandSalesArray, (d) => d.make)
      .join(
        (enter) => {
          let group = enter.append("g").attr("class", "bubble-group");

          group
            .append("circle")
            .attr(
              "class",
              (d) => `bubble ${selectBrand.has(d.make) ? "selected" : ""}`
            )
            .attr("r", (d) => r[target](calc(d, target)))
            .style("fill", (d) => colors[target])
            .on("click", bubbleClick)
            .on("mouseenter", showTooltip)
            .on("mouseout", hideTooltip);

          group
            .append("text")
            .attr("class", "brand-label")
            .attr("dy", ".35em")
            .style("pointer-events", "none")
            .text((d) => {
              let radius = r[target](calc(d, target));
              let textLength = d.make.length * 6; // Approximate text length in pixels
              return textLength < radius * 2 ? d.make : "";
            });

          return group;
        },
        (update) => {
          update
            .select(".bubble")
            .attr("r", (d) => r[target](calc(d, target)))
            .style("fill", (d) => colors[target]);

          update.select(".brand-label").text((d) => {
            let radius = r[target](calc(d, target));
            let textLength = d.make.length * 6; // Approximate text length in pixels
            return textLength < radius * 2 ? d.make : "";
          });

          return update;
        },
        (exit) => {
          exit.remove();
        }
      );

    simulation = d3
      .forceSimulation(brandSalesArray)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => r[target](calc(d, target)) * 0.99)
      )
      .force("charge", d3.forceManyBody().strength(-10))
      .force("attract", d3.forceManyBody().strength(20))
      .on("tick", ticked);

    function ticked() {
      bubbleGroups.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    function showTooltip(e, d) {
      const lists = dimensions.reduce((acc, col) => {
        const name = col;
        return (
          acc +
          `<li class="${name} ${col == target ? "highlight" : ""}">${name}: 
        ${Math.round(d[col]).toLocaleString()}</li>`
        );
      }, ``);

      tooltip
        .classed("active", true)
        .style("left", `calc(${e.pageX - rect.x}px `)
        .style("top", `calc(${e.pageY - rect.y}px `)
        .select(".brand-name")
        .text(d.make);

      tooltip.select("ul").html(lists);
    }
    function hideTooltip(e, d) {
      tooltip.classed("active", false);
    }

    function bubbleClick(e, d) {
      if (selectBrand.has(d.make)) {
        d3.select(this).classed("selected", false).lower();
        selectBrand.delete(d.make);
      } else {
        d3.select(this).classed("selected", true);
        selectBrand.add(d.make);
      }

      // if (selectBrand.size >= _selectedBrand.size) {
      //   allBtn.disabled = true;
      // } else if (selectBrand.size == 0) {
      //   resetBtn.disabled = true;
      // } else {
      //   allBtn.disabled = false;
      //   resetBtn.disabled = false;
      // }
      handleControlBtn();
      update();
    }

    function handleControlBtn() {
      console.log(selectBrand);
      if (data.length == 0) {
        resetBtn.disabled = true;
        allBtn.disabled = true;
      } else if (selectBrand.size == 0) {
        resetBtn.disabled = true;
      } else if (selectBrand.size >= _selectedBrand.size) {
        allBtn.disabled = true;
        resetBtn.disabled = false;
      } else {
        allBtn.disabled = false;
        resetBtn.disabled = false;
      }
    }
  }

  function updateRadius(value) {
    target = value;
    svg
      .selectAll(".bubble")
      .attr("r", (d) => {
        return r[value](calc(d, value));
      })
      .style("fill", (d) => colors[value]);

    svg
      .selectAll(".brand-label")
      .text((d) =>
        d.make.length * 2 < r[target](calc(d, value)) ? d.make : ""
      );

    simulation
      .force(
        "collide",
        d3.forceCollide().radius((d) => r[value](calc(d, value)) * 0.99)
      )
      .alpha(1)
      .restart();
  }

  // let bubbleGroups = svg
  //   .selectAll(".bubble-group")
  //   .data(brandSalesArray)
  //   .enter()
  //   .append("g")
  //   .attr("class", "bubble-group");

  // // Append bubbles
  // let bubbles = bubbleGroups
  //   .append("circle")
  //   .attr("class", "bubble selected")
  //   .attr("r", (d) => r[target](calc(d, target))) //Math.max(calc(d.size) * 0.5, minRadius)
  //   .style("fill", (d) => colors[target])
  //   .on("click", bubbleClick)
  //   // .on("mouseenter", (e, d) => d3.select(e.currentTarget).style("opacity", 1))
  //   // .on("mouseout", (e, d) =>
  //   //   d3
  //   //     .select(e.currentTarget)
  //   //     .style("opacity", (d) => (d.selected ? 0.8 : 0.5))
  //   // );

  //   .on("mouseenter", showTooltip)
  //   .on("mouseout", hideTooltip);
  // const tooltip = d3.select(".brand_tooltip");

  // var labels = bubbleGroups
  //   .append("text")
  //   .attr("class", "brand-label")
  //   .attr("dy", ".35em")
  //   .style("pointer-events", "none") // Make text non-interactive
  //   .text((d) =>
  //     d.make.length * 2 < r[target](calc(d, target)) ? d.make : ""
  //   );
  // function showTooltip(e, d) {
  //   const lists = dimensions.reduce((acc, col) => {
  //     const name = col;
  //     return (
  //       acc +
  //       `<li class="${name} ${col == target ? "highlight" : ""}">${name}:
  //     ${Math.round(d[col]).toLocaleString()}</li>`
  //     );
  //   }, ``);

  //   tooltip
  //     .classed("active", true)
  //     .style("left", `calc(${e.pageX - rect.x}px `)
  //     .style("top", `calc(${e.pageY - rect.y}px `)
  //     .select(".brand-name")
  //     .text(d.make);

  //   tooltip.select("ul").html(lists);
  // }
  // function hideTooltip(e, d) {
  //   tooltip.classed("active", false);
  // }
  // Function to update bubble positions
  // function ticked() {
  //   bubbleGroups.attr("transform", (d) => `translate(${d.x},${d.y})`);
  // }

  // function bubbleClick(e, d) {
  //   if (selectBrand.has(d.make)) {
  //     d3.select(this).classed("selected", false).lower();
  //     selectBrand.delete(d.make);
  //   } else {
  //     d3.select(this).classed("selected", true);
  //     selectBrand.add(d.make);
  //   }
  //   if (selectBrand.size >= brandSales.length) {
  //     allBtn.disabled = true;
  //   } else if (selectBrand.size == 0) {
  //     resetBtn.disabled = true;
  //   } else {
  //     allBtn.disabled = false;
  //     resetBtn.disabled = false;
  //   }

  //   update();
  // }

  // const controlContainer = document.querySelector(".brand-control");
  // const agg_options = controlContainer.querySelectorAll(".dropdown-item");
  // const dropdownBrandBtn = document.getElementById("dropdownBrandBtn");
  // const resetBtn = document.getElementById("brand-reset");
  // const allBtn = document.getElementById("brand-all");

  // agg_options.forEach((d) => {
  //   d.addEventListener("click", (e) => {
  //     const value = e.target.dataset.brandColor.split("_")[1];
  //     dropdownBrandBtn.textContent = value;
  //     updateRadius(value);
  //   });
  // });

  // resetBtn.addEventListener("click", (e) => {
  //   bubbles.classed("selected", false);
  //   selectBrand.clear();
  //   e.target.disabled = true;
  //   allBtn.disabled = false;
  //   update();
  // });

  // allBtn.addEventListener("click", (e) => {
  //   bubbles.classed("selected", true);
  //   selectBrand = new Set(brandSales.keys());
  //   e.target.disabled = true;
  //   resetBtn.disabled = false;
  //   update();
  // });

  function calc(d, c) {
    // return Math.sqrt(d[c]);
    return c == "mean" || c == "median" ? d[c] * 0.8 : Math.sqrt(d[c]);
  }
  function getBrands() {
    return selectBrand;
  }

  // function updateRadius(value) {
  //   target = value;
  //   bubbles
  //     .attr("r", (d) => {
  //       return r[value](calc(d, value));
  //     })
  //     .style("fill", (d) => colors[value]);

  //   labels.text((d) =>
  //     d.make.length * 2 < r[target](calc(d, value)) ? d.make : ""
  //   );

  //   simulation
  //     .force(
  //       "collide",
  //       d3.forceCollide().radius((d) => r[value](calc(d, value)) * 0.99)
  //     )
  //     .alpha(1)
  //     .restart();
  // }

  function updateBrands(_data) {
    let _brandSales = d3.rollup(
      _data,
      (v) => ({
        size: v.length,
        mean:
          v.reduce(function (total, i) {
            return total + +i.sellingprice;
          }, 0) / v.length,
        sum: v.reduce(function (total, i) {
          return total + +i.sellingprice;
        }, 0),
        median: calculateMedian(v.map((d) => +d.sellingprice)),
      }),
      (d) => d.make
    );

    const newElem = new Set(_brandSales.keys()).difference(
      new Set(brandSales.keys())
    );
    const oldElem = new Set(brandSales.keys()).difference(
      new Set(_brandSales.keys())
    );

    newElem.forEach((d) => selectBrand.add(d));
    oldElem.forEach((d) => selectBrand.delete(d));

    brandSales = _brandSales;
    // Convert brandSales map to array of objects
    brandSalesArray = Array.from(
      brandSales,
      ([make, { size, mean, sum, median }]) => ({
        make,
        size,
        mean,
        sum,
        median,
      })
    );

    // simulation.on("tick", null).alpha(1);
    // r.domain([0, d3.max(brandSalesArray, (d) => calc(d.size))]);

    dimensions.forEach((c) => {
      r[c].domain([0, d3.max(brandSalesArray, (d) => calc(d, c))]);
    });

    bubbleGroups.remove();
    bubbleGroups = svg
      .selectAll(".bubble-group")
      .data(brandSalesArray)
      .enter()
      .append("g")
      .attr("class", "bubble-group");

    bubbles = bubbleGroups
      .append("circle")
      .attr(
        "class",
        (d) => `bubble ${selectBrand.has(d.make) ? "selected" : ""}`
      )
      .attr("r", (d) => {
        return r[target](calc(d, target));
      }) //Math.max(calc(d.size) * 0.5, minRadius)
      .style("fill", (d) => colors[target])
      .on("click", bubbleClick);

    labels = bubbleGroups
      .append("text")
      .attr("class", "brand-label")
      .attr("dy", ".35em")
      .style("pointer-events", "none") // Make text non-interactive
      .text((d) =>
        d.make.length * 2 < r[target](calc(d, target)) ? d.make : ""
      );

    simulation = d3
      .forceSimulation(brandSalesArray)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => r[target](calc(d, target)) * 0.95)
      )
      .force("charge", d3.forceManyBody().strength(-10))
      .force("attract", d3.forceManyBody().strength(20))
      .on("tick", ticked);
  }

  return { getBrands, updateBrands, updateBubble };
}
