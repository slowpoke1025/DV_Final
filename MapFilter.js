import Colorbar from "./colorbar.js";
import { calculateMedian } from "./lib/median.js";
export function MapFilter(
  container,
  controlContainer,
  data,
  updateDashboard = function () {}
) {
  let obj = {},
    colors = {},
    extents = {},
    states_list = new Set();

  const tooltip = d3.select(".map_tooltip");

  let target, states, selected_states;
  const dimensions = [
    "sellingprice_size",
    "sellingprice_mean",
    "sellingprice_sum",
    "sellingprice_median",
  ]; //data.columns.filter((d) => d !== "state");
  //   return d3
  //     .csv("./dataset/car_prices_cleaned.csv")
  //     .then((data) => {
  const interpolaters = {
    sellingprice_size: d3.interpolateGnBu,
    sellingprice_mean: d3.interpolateGreens,
    sellingprice_sum: d3.interpolateReds,
    sellingprice_median: d3.interpolateBlues,
  };
  // states_list.clear();
  data.forEach((d) => states_list.add(d.state));
  selected_states = new Set(states_list);

  function setUp(data) {
    // obj = {};
    // states_list.forEach((s) => {
    //   obj[s] = dimensions.reduce((acum, d) => ({ ...acum, [d]: 0 }), {});
    // });

    // data.forEach((d) => {
    //   ++obj[d.state]["sellingprice_size"];
    //   obj[d.state]["sellingprice_sum"] += +d.sellingprice;
    // });

    // Object.keys(obj).forEach((k) => {
    //   if (obj[k]["sellingprice_size"] == 0) return;
    //   obj[k]["sellingprice_mean"] =
    //     obj[k]["sellingprice_sum"] / obj[k]["sellingprice_size"];
    // });

    obj = d3.rollup(
      data,
      (v) => ({
        sellingprice_size: v.length,
        sellingprice_mean:
          v.reduce(function (total, i) {
            return total + +i.sellingprice;
          }, 0) / v.length,
        sellingprice_sum: v.reduce(function (total, i) {
          return total + +i.sellingprice;
        }, 0),
        sellingprice_median: calculateMedian(v.map((d) => +d.sellingprice)),
      }),
      (d) => d.state
    );
    if (data.length > 0) {
      dimensions.forEach((col) => {
        extents[col] = d3.extent(obj.values(), (d) => +d[col]);
        colors[col] = d3.scaleSequential(extents[col], interpolaters[col]);
      });
    } else {
      dimensions.forEach((col) => {
        extents[col] = [0, 0];
        colors[col] = d3.scaleSequential(extents[col], interpolaters[col]);
      });
    }

    //   data.forEach((d) => {
    //     const { state, ...v } = d;
    //     obj[state] = v;
    //   });
  }

  function update(col) {
    target = col;
    states.transition().attr("fill", (d) => {
      return obj.get(d.properties.name)
        ? colors[col](+obj.get(d.properties.name)[col])
        : "lightgray";
    });

    return extents[col];
  }

  setUp(data);
  target = dimensions[0];

  const [colorbar, updateColorBar] = Colorbar(
    controlContainer.clientWidth,
    extents[target],
    80,
    {
      vertical: false,
      rotate: 0,
      // titles: dimensions,
      update,
      dark: true,
    }
  );

  const agg_options = controlContainer.querySelectorAll(".dropdown-item");
  const dropdownColorStateBtn = document.getElementById(
    "dropdownColorStateBtn"
  );
  const resetBtn = document.getElementById("map-reset");
  const allBtn = document.getElementById("map-all");

  agg_options.forEach((d) => {
    d.addEventListener("click", (e) => {
      const value = e.target.dataset.stateColor;
      dropdownColorStateBtn.textContent = value.split("_")[1];
      update(value);
      updateColorBar(extents[value], interpolaters[value]);
    });
  });
  resetBtn.addEventListener("click", (e) => {
    states.classed("active", false);
    selected_states.clear();
    e.target.disabled = true;
    allBtn.disabled = false;

    updateDashboard("RESET");
  });

  allBtn.addEventListener("click", (e) => {
    states.classed("active", true);
    selected_states = new Set(obj.keys());
    // for (let i of Object.keys(obj)) selected_states.add(i);
    e.target.disabled = true;
    resetBtn.disabled = false;

    updateDashboard();
  });

  controlContainer.append(colorbar);

  return d3.json("./map/states-10m.json").then((data) => {
    const rect = container.getBoundingClientRect();

    const margin = { top: 0, right: 0, bottom: 0, left: 0 },
      width = container.clientWidth - margin.left - margin.right,
      height = container.clientHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("style", "max-width: 100%; height: auto;");

    function zoomed(event) {
      return svg.attr("transform", event.transform);
      // console.log(event);

      // if (event?.sourceEvent?.type == "mousemove")
      //     [event.transform.x, event.transform.y] = [event.transform.y, -event.transform.x]
      // return svg.attr("transform", event.transform)

      // const rotatedTransform = d3.zoomIdentity
      //     .translate(event.transform.y, -event.transform.x)
      //     .scale(event.transform.k)

      // if (event.sourceEvent.type == "mousemove") {
      //     return svg.attr('transform', `${rotatedTransform}`);
      // }

      // svg.attr("transform", event.transform)
    }

    let minZoom = 0.8,
      maxZoom = 10;
    let zoom = d3
      .zoom()
      .scaleExtent([minZoom, maxZoom])
      .filter((event) => event.type !== "dblclick")
      .translateExtent([
        [0, 0],
        [width, height],
      ]) // 限制不可拖曳範圍
      .on("zoom", zoomed);

    // 应用缩放行为到SVG元素
    svg.call(zoom);

    const svgg = svg;
    svg = svg
      .append("g")
      // .attr("transform", `translate(${margin.left}, ${margin.top}) rotate(90, ${width / 2}, ${height / 2})`)
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const projection = d3.geoMercator().center([-100, 40]);

    const path = d3.geoPath(projection);

    const geometries = topojson.feature(data, data.objects["states"]);
    geometries.features = geometries.features.filter(
      (d) => ![2, 72, 15, 78, 69, 60, 66].includes(+d.id)
    );
    console.log(geometries);
    const g = geometries.features.filter(
      (d) => ![2, 72, 15, 78, 69, 60, 66].includes(+d.id)
    );

    const reflectY = d3.geoTransform({
      point(x, y) {
        this.stream.point(x, -y);
      },
    });
    const reflectX = d3.geoTransform({
      point(x, y) {
        this.stream.point(-x, y);
      },
    });

    projection
      // .scale(700)
      // .translate([width / 2, height / 2])
      .angle(-90)
      // .reflectY(reflectY)
      .fitSize([width, height], geometries)
      .scale(projection.scale() * 0.85);
    // .fitExtent([[0, 0], [width, height]], geometries)

    states = svg
      // .append("g")
      .selectAll("path")
      .data(g) //geometries.features
      .join("path")
      // draw each country
      .attr(
        "d",
        d3.geoPath(projection)
        // .projection(projection)
      )
      .attr("class", "state active")
      // 加上簡易版本 tooltip
      // .on("mouseover", function (e, d) {
      //     d3.select(this).classed("active", true);
      // })
      // .on("mouseout", function (e, d) {
      //     d3.select(this).classed("active", false);
      // })

      .on("contextmenu ", function (e, d) {
        e.preventDefault();
        boxZoom(path.bounds(d), path.centroid(d), 100);
        // svgg.transition().duration(750).call(zoom.transform, d3.zoomIdentity); // zoom back to default
        // svgg.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")")
      })
      .on("mouseenter", (e, d) => {
        const lists = dimensions.reduce((acc, col) => {
          const name = col.split("_")[1];
          return (
            acc +
            `<li class="${name} ${col == target ? "highlight" : ""}">${name}: 
            ${Math.round(
              obj.get(d.properties.name)?.[col] ?? 0
            ).toLocaleString()}</li>`
          );
        }, ``);

        tooltip
          .classed("active", true)
          .style("left", `${e.pageX - rect.x + 10}px`)
          .style("top", `${e.pageY - rect.y + 10}px`)
          .select(".state-name")
          .text(d.properties.name);

        tooltip.select("ul").html(lists);
      })
      .on("mouseout", (e, d) => {
        tooltip.classed("active", false);
      });

    states
      .attr("fill", (d) => {
        return obj.get(d.properties.name)
          ? colors[target](+obj.get(d.properties.name)[target])
          : "lightgray";
      })
      .classed("invalid", (d) => obj.get(d.properties.name) == null)
      .on("click", function (e, d) {
        const name = d.properties.name;
        // if (obj.get(name) == null) return;
        if (d3.select(e.currentTarget).classed("invalid")) return;

        if (!selected_states.has(name)) selected_states.add(name);
        else selected_states.delete(name);

        d3.select(this).classed("active", selected_states.has(name));
        if (selected_states.size == states_list.size) {
          allBtn.disabled = true;
        } else if (selected_states.size == 0) {
          resetBtn.disabled = true;
        } else {
          allBtn.disabled = false;
          resetBtn.disabled = false;
        }

        updateDashboard();
      });

    function boxZoom(box, centroid, padd) {
      let [minXY, maxXY] = box; // [x0, y0], [x1, y1]
      // find size of map area defined
      let zoomWidth = Math.abs(minXY[0] - maxXY[0]);
      let zoomHeight = Math.abs(minXY[1] - maxXY[1]);
      // find midpoint of map area defined
      let [zoomMidX, zoomMidY] = centroid;

      // increase map area to include padding
      zoomWidth = zoomWidth * (1 + padd / 100);
      zoomHeight = zoomHeight * (1 + padd / 100);
      // find scale required for area to fill svg
      let maxXscale = svgg.attr("width") / zoomWidth; // zoomWidth 增加，放大倍率減少
      let maxYscale = svgg.attr("height") / zoomHeight;
      let zoomScale = Math.min(maxXscale, maxYscale); // scale x y 為等比，故取 min
      // handle some edge cases
      // limit to max zoom (handles tiny countries)
      console.log(maxXscale, maxYscale);

      zoomScale = Math.min(zoomScale, maxZoom);
      zoomScale = Math.max(zoomScale, minZoom);

      let offsetX = zoomScale * zoomMidX; // 面積放大 k 倍，座標亦然，(x,y) -> (kx, ky) // 往右
      let offsetY = zoomScale * zoomMidY;

      let dleft = Math.min(0, svgg.attr("width") / 2 - offsetX); //.translate(width/2, height2).translate(-x, -y) //往左
      let dtop = Math.min(0, svgg.attr("height") / 2 - offsetY); // min 0 限制左界與上界線

      // // Make sure no gap at bottom or right of holder
      // dleft = Math.max(svgg.attr("width") - width * zoomScale, dleft);
      // dtop = Math.max(svgg.attr("height") - height * zoomScale, dtop);
      // // set zoom
      svgg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(dleft, dtop) // 以原中心移動，故座標方向正負相反，ex: (width/2, height2) 會將中心移到右下角
          .scale(zoomScale)
      );
    }

    function getStates() {
      return selected_states;
    }
    function updateMap(data) {
      setUp(data);
      update(target);
      updateColorBar(extents[target], interpolaters[target]);
    }

    return { getStates, updateMap }; //svgg.node();
  });
}
