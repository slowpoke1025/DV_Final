// d3.csv("./dataset/car_prices_cleaned.csv").then(data => {
//     console.log(data);
// })
import { MapFilter } from "./MapFilter.js";
import { Parallel_coordinate } from "./parallel_coordinate.js";



d3.csv("./dataset/car_prices_cleaned.csv").then(data => {

    const parallel_coordinate = document.querySelector(".pc-container")
    Parallel_coordinate(parallel_coordinate, data)


    const map = d3.select(".left>.map-container").node()
    const map_control = d3.select(".left>.map-control").node()
    MapFilter(map, map_control)

})