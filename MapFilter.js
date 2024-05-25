import Colorbar from "./colorbar.js";

export function MapFilter(
  container,
  controlContainer,
  data,
  updateDashboard = function () {}
) {
  const obj = {},
    colors = {},
    extents = {},
    states_list = new Set();

  let target, states, selected_states;
  const dimensions = [
    "sellingprice_size",
    "sellingprice_mean",
    "sellingprice_sum",
  ]; //data.columns.filter((d) => d !== "state");
  //   return d3
  //     .csv("./dataset/car_prices_cleaned.csv")
  //     .then((data) => {

  function setUp(data) {
    states_list.clear();
    data.forEach((d) => states_list.add(d.state));
    states_list.forEach((s) => {
      obj[s] = dimensions.reduce((acum, d) => ({ ...acum, [d]: 0 }), {});
    });

    data.forEach((d) => {
      ++obj[d.state]["sellingprice_size"];
      obj[d.state]["sellingprice_sum"] += +d.sellingprice;
    });

    Object.keys(obj).forEach((k) => {
      obj[k]["sellingprice_mean"] =
        obj[k]["sellingprice_sum"] / obj[k]["sellingprice_size"];
    });

    //   dimensions.forEach((col) => {
    //     extents[col] = d3.extent(data, (d) => +d[col]);
    //     colors[col] = d3.scaleSequential(extents[col], d3.interpolateBlues);
    //   });
    dimensions.forEach((col) => {
      extents[col] = d3.extent(Object.values(obj), (d) => +d[col]);
      colors[col] = d3.scaleSequential(extents[col], d3.interpolateBlues);
    });

    //   data.forEach((d) => {
    //     const { state, ...v } = d;
    //     obj[state] = v;
    //   });
    //   console.log(obj);
    selected_states = new Set(states_list);
  }

  function update(col) {
    target = col;
    states.attr("fill", (d) => {
      return obj[d.properties.name]
        ? colors[col](+obj[d.properties.name][col])
        : "lightgray";
    });
    states
      .selectAll("title")
      .text(
        (d) =>
          d.properties["name"] +
          " " +
          (obj[d.properties["name"]]
            ? Math.round(obj[d.properties["name"]][target])
            : 0)
      );

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
      titles: dimensions,
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
      updateColorBar(extents[value]);
    });
  });
  resetBtn.addEventListener("click", (e) => {
    states.classed("active", false);
    selected_states.clear();
    e.target.disabled = true;
    allBtn.disabled = false;

    updateDashboard();
  });

  allBtn.addEventListener("click", (e) => {
    states.classed("active", true);
    selected_states = new Set(Object.keys(obj));
    // for (let i of Object.keys(obj)) selected_states.add(i);
    e.target.disabled = true;
    resetBtn.disabled = false;

    updateDashboard();
  });

  controlContainer.append(colorbar);

  return d3.json("./map/states-10m.json").then((data) => {
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
      });

    states
      .attr("fill", (d) => {
        return obj[d.properties.name]
          ? colors[target](+obj[d.properties.name][target])
          : "lightgray";
      })
      .attr("opacity", 0.5)
      .classed("invalid", (d) => obj[d.properties.name] == null)
      .on("click", function (e, d) {
        const name = d.properties.name;
        if (obj[name] == null) return;
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

    states
      .append("title")
      .text(
        (d) =>
          d.properties["name"] +
          " " +
          (obj[d.properties["name"]]
            ? Math.round(obj[d.properties["name"]][target])
            : 0)
      );

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
    function updateMap() {
      return console.log("update map");
    }

    return { getStates, updateMap }; //svgg.node();
  });
}
