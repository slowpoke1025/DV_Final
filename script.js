// d3.csv("./dataset/car_prices_cleaned.csv").then(data => {
//     console.log(data);
// })
import { MapFilter } from "./MapFilter.js";
import { Parallel_coordinate } from "./parallel_coordinate.js";
import { Parallel_Sets } from "./parallel_sets.js";

const LOADED = {};
d3.csv("./dataset/car_prices_cleaned.csv").then((data) => {
  const parallel_coordinate = document.querySelector(".pc-container");
  Parallel_coordinate(parallel_coordinate, data);
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
  MapFilter(map, map_control);
});
