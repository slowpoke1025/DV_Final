export default function Colorbar(
  size,
  extent,
  w,
  {
    vertical = true,
    interpolater = d3.interpolateBlues,
    margin = { top: 10, right: 35, bottom: 30, left: 30 },
    update = function () {},
    pad = 8,
    rotate = -35,
    ticks = 4,
    titles = ["title"],
    titleSize = 16,
    fontSize = 11,
    flag = false,
    dark = false,
  }
) {
  const width = (vertical ? w : size) - margin.left - margin.right;
  const height = (vertical ? size : w) - margin.top - margin.bottom;

  const main = vertical ? height : width;
  const y = d3.scaleLinear(extent, vertical ? [main, 0] : [0, main]);
  const color = d3.scaleSequential([0, main], interpolater);
  console.log(main, extent);
  const colorbar_container = d3
    .create("div")
    .classed("colorbar_container", true);

  // const select = colorbar_container
  //     .append("select")
  //     .style("position", "absolute")
  let select, getSelect;
  if (flag) {
    [select, getSelect] = Dropdown(colorbar_container, titles, handleSelect);
  }
  function handleSelect() {
    const title = getSelect();
    extent = update(title);
    y.domain(extent);
    t.range(extent);

    tickValues = new Array(ticks).fill(0).map((_, i) => Math.round(t(i)));
    if (!vertical) axis.call(d3.axisBottom(y).tickValues(tickValues));
    if (dark) {
      axis.selectAll("text").attr("fill", "#fff");
      axis.select(".domain").attr("stroke", "#fff");
      axis.selectAll("line").attr("stroke", "#fff");
    }
  }

  const svg = colorbar_container
    .append("svg")
    .classed("colorbar", true)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("style", "max-width: 100%; height: auto;");
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  function updateColorScale(extent) {
    y.domain(extent);
    t.range(extent);
    tickValues = new Array(ticks).fill(0).map((_, i) => Math.round(t(i)));
    if (!vertical) axis.call(d3.axisBottom(y).tickValues(tickValues));
    axis.selectAll("text").attr("font-size", fontSize);
    if (dark) {
      axis.selectAll("text").attr("fill", "#fff");
      axis.select(".domain").attr("stroke", "#fff");
      axis.selectAll("line").attr("stroke", "#fff");
    }
  }
  // const options = select
  //     .selectAll("options")
  //     .data(titles)
  //     .join("option")
  //     .attr("value", (d, i) => i)
  //     .text(d => d)

  let delta = 1;
  const rects = g
    .append("g")
    .selectAll("rects")
    .data(Array.from({ length: main * delta }, (_, i) => i))
    .join("rect")
    .attr("x", (d) => (vertical ? 0 : d / delta))
    .attr("y", (d) => (vertical ? d / delta : 0))
    .attr("width", vertical ? width : 1 / delta)
    .attr("height", vertical ? 1 / delta : height)
    .style("fill", (d) => color(vertical ? main - d / delta : d / delta));

  let t = d3.scaleLinear([0, ticks - 1], extent);
  let tickValues = new Array(ticks).fill(0).map((_, i) => t(i));

  let axis;
  if (vertical) {
    axis = g
      .append("g")
      .attr("transform", `translate(${-pad})`)
      .call(d3.axisLeft(y).tickValues(tickValues));

    axis.selectAll("text").attr("font-size", fontSize);

    const title = g
      .append("text")
      .text(titles[0])
      .attr("font-weight", "bold")
      .style("text-transform", "capitalize")
      .attr("font-size", titleSize);

    title
      .attr("text-anchor", "middle")
      .attr("transform", (d, i) => `translate(${width / 2}, ${-pad})`);
  } else {
    axis = g
      .append("g")
      .attr("transform", "translate(0," + (height + pad) + ")")
      .call(d3.axisBottom(y).tickValues(tickValues));

    if (dark) {
      axis.select(".domain").attr("stroke", "#fff");
      axis.selectAll("line").attr("stroke", "#fff");
    }
    axis
      .selectAll("text")
      .attr("transform", (d, i) => `rotate(${rotate})`)
      .attr("font-size", fontSize)
      .attr("fill", (d) => (dark ? "#fff" : "#000"))
      .attr("text-anchor", (d) => (rotate > 0 ? "end" : "middle"));

    if (flag) {
      select.style(
        "transform",
        // `translate(${margin.left}px, calc(${margin.top}px - ${100 / (titles.length + 1)}% - ${pad}px))`)
        `translate(${margin.left}px, ${0}px)`
      );
      // `translate(0, 0)`)
    }

    // title
    //     .attr("text-anchor", "start")
    //     .attr("transform", (d, i) => `translate(${0}, ${-pad})`)
  }

  return [colorbar_container.node(), updateColorScale];

  // d3.select("#svg-container").node().append(Colorbar(200, [0, 10000], 100, vertical = false))
}

function Dropdown(container, data, callback = function () {}) {
  const select = container.append("div").attr("class", "select");

  let open = false,
    selected_option = data[0];
  const selected_container = select
    .append("div")
    .attr("class", "selected-container");

  const selected = selected_container
    .append("div")
    .attr("class", "selected")
    .text(selected_option ?? "None")
    .on("click", (e) => {
      if (!open)
        // options_container.style("visibility", "visible")
        options_container.style("display", "block");
      // options_container.style("visibility", "hidden")
      else options_container.style("display", "none");

      open = !open;

      let i = 0;
      const handleGlobalClick = (e) => {
        if (i++ == 0) return;
        if (!e.target.matches([".option", ".selected"])) {
          open = !open;
          // options_container.style("visibility", "hidden")
          options_container.style("display", "none");
        }
        document.removeEventListener("click", handleGlobalClick);
      };
      if (open) document.addEventListener("click", handleGlobalClick);
    });
  selected_container
    .append("div")
    .classed("hidden", true)
    .datum(data)
    .text((d) => {
      let str = "";
      for (let i of d) {
        str = i.length > str.length ? i : str;
      }

      return str;
    });

  const options_container = select
    .append("div")
    .classed("options", true)
    .style("transform", ` translate(0, ${100 / data.length}%)`);

  const options = options_container
    .selectAll()
    .data(data)
    .join("div")
    .attr("class", "option")
    .text((d) => d)
    .attr("value", (d) => d)
    .on("click", (e, d) => {
      options_container
        // .style("visibility", "hidden")
        .style("display", "none");

      open = false;
      selected_option = d;
      selected.text(d);
      callback();
    });

  // let maxWidth = 0;

  // // Iterate through each option to find the maximum width
  // data.forEach(option => {
  //     selected
  //     hiddenOption.textContent = option.textContent;
  //     const optionWidth = hiddenOption.offsetWidth;
  //     if (optionWidth > maxWidth) {
  //         maxWidth = optionWidth;
  //     }
  // });

  // // Set the select box width to the maximum option width
  // select.style.width = `${maxWidth}px`;

  return [select, () => selected_option];
}
