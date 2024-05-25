// d3.csv("./dataset/car_prices_cleaned.csv").then(data => {
//     console.log(data);
// })
import { MapFilter } from "./MapFilter.js";
import { Parallel_coordinate } from "./parallel_coordinate.js";
import { Parallel_Sets } from "./parallel_sets.js";

const LOADED = {};
d3.csv("./dataset/car_prices_cleaned.csv").then(async (data) => {
  const columns = data.columns;
  data = data.slice(0, 1000);
  data.columns = columns;

  const parallel_coordinate = document.querySelector(".pc-container");
  const { updateColor_PC } = Parallel_coordinate(parallel_coordinate, data);
  LOADED["parallel_coordinate"] = true;

  document
    .getElementById("parallel_sets-tab")
    .addEventListener("click", (e) => {
      if (LOADED["parallel_sets"]) return;

      setTimeout(() => {
        //
        const parallel_sets = document.querySelector(".ps-container");
        Parallel_Sets(parallel_sets, data);
        LOADED["parallel_sets"] = true;
      }, 300);
    });

  const map = d3.select(".left>.map-container").node();
  const map_control = d3.select(".left>.map-control").node();
  const { getStates, updateMap } = await MapFilter(
    map,
    map_control,
    data,
    function () {
      const _data = data.filter((d) => getStates().has(d.state));
      console.log(getStates());
      updateMap(_data);
    }
  );

  const color_options = document.querySelectorAll("[data-color]");
  const dropdownColorVarBtn = document.getElementById("dropdownColorVarBtn");
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
      const color = d3.scaleOrdinal([...unique], d3.schemeTableau10);
      updateColor_PC(color, value);
    });
  });
});
