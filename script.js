// d3.csv("./dataset/car_prices_cleaned.csv").then(data => {
//     console.log(data);
// })
import { MapFilter } from "./MapFilter.js";
import { Parallel_coordinate } from "./parallel_coordinate.js";
import { Parallel_Sets } from "./parallel_sets.js";
import { BubbleFilter } from "./bubble_test.js";
import { Scatter } from "./scatter_test.js";
import { Bar } from "./bar_test.js";
import { Box } from "./box_test.js";
import { Radar } from "./radar_test.js";

const LOADED = {};

d3.csv("./dataset/car_prices_cleaned.csv").then(async (data) => {
  const columns = data.columns;
  data = data.slice(0, 1000);
  data.columns = columns;
  let __data = data;
  let currentPage = null;
  let pc, ps, mp, bf, sc, bx, rd, br;

  document
    .getElementById("parallel_coordinate-tab")
    .addEventListener("click", (e) => {
      currentPage = pc;
      if (LOADED["parallel_coordinate"]) return;

      setTimeout(() => {
        //

        const parallel_coordinate = document.querySelector(".pc-container");
        pc = Parallel_coordinate(parallel_coordinate, __data);
        LOADED["parallel_coordinate"] = true;
        currentPage = pc;
      }, 300);
    });

  document
    .getElementById("parallel_sets-tab")
    .addEventListener("click", (e) => {
      currentPage = ps;
      if (LOADED["parallel_sets"]) return;

      setTimeout(() => {
        //
        const parallel_sets = document.querySelector(".ps-container");
        ps = Parallel_Sets(parallel_sets, __data);
        LOADED["parallel_sets"] = true;
        currentPage = ps;
      }, 300);
    });

  const map = d3.select(".left>.map-container").node();
  const map_control = d3.select(".left>.map-control").node();
  const { getStates, updateMap } = await MapFilter(
    map,
    map_control,
    data,
    function (flag) {
      const _data = data.filter((d) => getStates().has(d.state));
      updateBubble(_data);
      __data = _data.filter((d) => getBrands().has(d.make));

      // updateMap(_data);
      // updateBrands(_data);
      bx?.updateBoxPlot(__data, flag);
      sc?.updateScatter(__data, flag);
      br?.updateBarChart(__data);
      pc?.updatePC(__data);

      if (flag) {
        console.log(flag);
        resetBtn.click();
      }
    }
  );

  const color_options = document.querySelectorAll("[data-color]");
  const dropdownColorVarBtn = document.getElementById("dropdownColorVarBtn");
  const resetBtn = document.getElementById("pc-reset");
  const allBtn = document.getElementById("pc-all");
  const lengends = d3.select(".color-legend");

  color_options.forEach((d) => {
    d.addEventListener("click", (e) => {
      const value = e.target.dataset.color;
      dropdownColorVarBtn.textContent = value;
      const unique = new Set();
      data.forEach((d) => {
        if (!unique.has(d[value])) {
          unique.add(d[value]);
        }
      });
      let selectList = new Set(unique);

      const color = d3.scaleOrdinal([...unique], d3.schemeTableau10);
      resetBtn.disabled = false;
      const legend = lengends
        .html("")
        .style("display", "grid")
        .selectAll()
        .data([...unique])
        .join("div")
        .classed("box", true)
        .on("click", (e, d) => {
          if (selectList.has(d)) {
            selectList.delete(d);
            d3.select(e.currentTarget).classed("deactive", true);
          } else {
            selectList.add(d);
            d3.select(e.currentTarget).classed("deactive", false);
          }
          if (selectList.size == unique.size) {
            allBtn.disabled = true;
          } else if (selectList.size == 0) {
            resetBtn.disabled = true;
          } else {
            allBtn.disabled = false;
            resetBtn.disabled = false;
          }
          colorClick?.(e, d);
        });

      legend
        .append("div")
        .classed("rect", true)
        .style("background", (d) => color(d))
        .on("mouseover", (e, d) => {
          colorOver?.(e, d);
        })
        .on("mouseout", (e, d) => {
          colorOut?.(e, d);
        });

      legend.append("text").text((d) => d);

      resetBtn.onclick = (e) => {
        d3.selectAll(".box").classed("deactive", true);
        selectList.clear();
        e.target.disabled = true;
        allBtn.disabled = false;
        colorReset?.(e);
      };

      allBtn.onclick = (e) => {
        d3.selectAll(".box").classed("deactive", false);
        unique.forEach((d) => {
          if (!selectList.has(d)) {
            selectList.add(d);
          }
        });
        e.target.disabled = true;
        resetBtn.disabled = false;
        colorAll?.(e);
      };
      // let colorAll, colorReset, colorOut, colorOver, colorClick;
      console.log(currentPage);
      const { colorAll, colorReset, colorClick, colorOver, colorOut } =
        currentPage.updateColor(color, value, unique, selectList);
    });
  });

  const bubble_container = d3.select(".brand-container");
  const { getBrands, updateBrands, updateBubble } = BubbleFilter(
    bubble_container,
    data,
    (flag) => {
      const _data = data.filter((d) => getBrands().has(d.make));
      updateMap(_data);

      __data = _data.filter((d) => getStates().has(d.state));
      bx?.updateBoxPlot(__data);
      sc?.updateScatter(__data);
      br?.updateBarChart(__data);
      pc?.updatePC(__data);
      if (flag) {
        console.log(flag);
        resetBtn.click();
      }

      // updateBrands(_data);
    }
  );

  document.getElementById("scatter-tab").addEventListener("click", (e) => {
    currentPage = sc;
    if (LOADED["scatter"]) return;
    setTimeout(() => {
      //
      const scatter_container = document.querySelector(".scatter-container");
      sc = Scatter(scatter_container, __data);
      LOADED["scatter"] = true;
      currentPage = sc;
    }, 300);
  });

  document.getElementById("bar-tab").addEventListener("click", (e) => {
    currentPage = br;
    if (LOADED["bar"]) return;
    setTimeout(() => {
      //
      const bar_container = document.querySelector(".bar-container");
      br = Bar(bar_container, __data);
      LOADED["bar"] = true;
      currentPage = br;
    }, 300);
  });

  document.getElementById("box-tab").addEventListener("click", (e) => {
    currentPage = bx;
    if (LOADED["box"]) return;
    setTimeout(() => {
      //
      const box_container = document.querySelector(".box-container");
      bx = Box(box_container, __data);
      LOADED["box"] = true;
      currentPage = bx;
    }, 300);
  });

  document.getElementById("radar-tab").addEventListener("click", (e) => {
    currentPage = rd;

    if (LOADED["radar"]) return;
    setTimeout(() => {
      //
      const radar_container = document.querySelector(".radar-container");
      rd = Radar(radar_container, __data);

      LOADED["radar"] = true;
      currentPage = rd;
    }, 300);
  });
});
