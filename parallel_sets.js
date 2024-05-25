// set the dimensions and margins of the graph
export function Parallel_Sets(main, data) {
  let {
    width: main_width,
    height: main_height,
    x: _x,
    y: _y,
  } = main.getBoundingClientRect();
  console.log(main_width, main_height);
  const margin = { top: 60, right: 80, bottom: 30, left: 80 },
    width = +main_width - margin.left - margin.right,
    height = +main_height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3
    .select(main)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("style", "max-width: 100%; height: auto;");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
  //     .style("font-family", "Georgia, serif");

  function generateGraph(data, columns) {
    const keys = columns; //.slice(0, -1);
    let index = -1;
    const nodes = [];
    const nodeByKey = new d3.InternMap([], JSON.stringify);
    const indexByKey = new d3.InternMap([], JSON.stringify);

    const links = [];
    for (const k of keys) {
      for (const d of data) {
        const key = [k, d[k]];
        if (nodeByKey.has(key)) continue;
        const node = { name: k, val: d[k] };

        nodes.push(node);
        nodeByKey.set(key, node);
        indexByKey.set(key, ++index);
      }
    }

    for (let i = 1; i < keys.length; ++i) {
      const a = keys[i - 1];
      const b = keys[i];
      const prefix = keys.slice(0, i + 1);
      const linkByKey = new d3.InternMap([], JSON.stringify);
      for (const d of data) {
        const names = prefix.map((k) => d[k]);
        const value = d.value || 1;
        let link = linkByKey.get(names);
        if (link) {
          link.value += value;
          continue;
        }
        link = {
          source: indexByKey.get([a, d[a]]),
          target: indexByKey.get([b, d[b]]),
          names,
          value,
        };
        links.push(link);
        linkByKey.set(names, link);
      }
    }

    return { nodes, links };
  }

  //用 promise, 不用 callback
  data.forEach((d) => {
    d.saledate = new Date(d.saledate).getFullYear();
    // d.sellingprice = Math.round(d.sellingprice / 10000);
  });

  const columns = ["body", "transmission", "interior", "color"];

  let nodesByKey = {};
  let graph = generateGraph(data, columns);

  const { nodes: _nodes } = d3.sankey()({
    nodes: graph.nodes,
    links: graph.links,
  });

  for (let n of _nodes) {
    if (nodesByKey[n.name] == null) nodesByKey[n.name] = [];
    nodesByKey[n.name].push(n);
  }

  const ords = {};
  columns.forEach((d) => {
    nodesByKey[d].sort((a, b) => {
      return b.value - a.value;
    });
    ords[d] = d3.scaleBand(
      nodesByKey[d].map((d) => d.val),
      [0, 1]
    );
  });
  const NODE_WIDTH = 4;
  let sankey = d3
    .sankey()
    .nodeSort((a, b) => {
      return +b.value - +a.value;
    })
    .linkSort((a, b) => {
      return ords[columns[0]](a.names[0]) - ords[columns[0]](b.names[0]);
    })
    .nodeWidth(NODE_WIDTH)
    .nodePadding(8)
    .extent([
      [0, 0],
      [width, height],
    ]);

  const color = d3.scaleOrdinal(d3.schemeCategory10); //d3.schemePaired
  const x = d3.scalePoint(columns, [0, width]);

  let { nodes, links } = sankey({
    nodes: graph.nodes, //.map((d) => Object.create(d)),
    links: graph.links, //.map((d) => Object.create(d)),
  });

  // bars
  //     .append("text")
  //     .attr("x", d => d.x1)
  //     .attr("y", d => d.y0)
  //     .text(d => { console.log(d); return d.name })

  // bars
  //     .append("title")
  //     .text(d => `${d.name}\n${d.value.toLocaleString()}`)

  // const linksbykey = new d3.InternMap([], JSON.stringify);
  function downstream(d, flag) {
    const arr = d.target.sourceLinks.filter((e) => {
      for (let i in d.names) {
        if (d.names[i] != e.names[i]) return false;
      }
      return true;
    });
    arr.forEach((d) => {
      d3.select("." + d.names.join("_")).classed("deactive", !flag);
      downstream(d, flag);
    });
  }

  function upstream(d, flag) {
    const arr = d.source.targetLinks.filter((e) => {
      for (let i in e.names) {
        if (d.names[i] != e.names[i]) return false;
      }
      return true;
    });
    arr.forEach((d) => {
      d3.select("." + d.names.join("_")).classed("deactive", !flag);
      // .attr("stroke", flag ? "red" : color(d.names[0]));
      upstream(d, flag);
    });
  }

  console.log(links);

  const tooltip = d3.select(".ps_tooltip");
  let link = g
    .selectAll()
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal()) //sankeyLinkHorizontal
    .attr("fill", "none")
    .attr("stroke", (d) => color(d.names[0]))
    .attr("opacity", 0.7)
    .attr("stroke-width", (d) => d.width)
    .style("mix-blend-mode", "multiply")
    .attr("class", (d) => ` link ${d.names.join("_")}`)
    .on("mouseover", (e, d) => {
      link.classed("deactive", true);
      upstream(d, true);
      d3.select(e.target).classed("deactive", false);
      downstream(d, true);

      tooltip
        .classed("active", true)
        .style("left", `${e.pageX - _x + 10}px`)
        .style("top", `${e.pageY - _y + 10}px`)
        .html(
          `<text>${d.names.join(
            "<span class='arrow'> → </span> "
          )} <span class='total' style="color:${color(
            d.names[0]
          )};">&nbsp;${d.value.toLocaleString()}</span></text>`
        );
    })
    .on("mouseout", (e, d) => {
      downstream(d, false);
      upstream(d, false);
      link.classed("deactive", false);
    });

  const titles = link
    // .attr("class", (d) => " ".join(d.names))
    .append("title")
    .text((d) => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

  const values = g
    .append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
    .text((d) => d.val)
    .attr("font-size", 15)
    .attr("fill", "#000")
    // .style("filter", "drop-shadow(0 0 5px #fff)")

    .attr("class", (d) => `label ${d.name}`)
    .style("font-weight", "bold");

  const counts = values
    .append("tspan")
    .attr("fill-opacity", 0.7)
    .style("display", "none")
    .text((d) => ` ${d.value.toLocaleString()}`);

  console.log(nodes);

  const isDraggedX = {};
  const texts = g
    .append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(columns)
    .join("text")
    .attr("class", (d) => d)
    .attr("x", (d) => x(d))
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text((d) => d)
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .attr("cursor", "pointer")

    .call(
      d3
        .drag()
        .on("start", function () {})
        .on("drag", dragmoveX)
        .on("end", dragendX)
    )
    .on("mouseenter", (e, d) => {
      d3.selectAll("text." + d + " tspan").style("display", "inline");
    })
    .on("mouseout", (e, d) => {
      d3.selectAll("text." + d + " tspan").style("display", "none");
    });

  let node = g
    .append("g")
    .selectAll(".node")
    .data(nodes)
    .join("rect")
    .attr("class", (d) => `node ${d.name}`)
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .call(
      d3
        .drag()
        .subject(function (e, d) {
          return e.y - d3.select(this).attr("y");
        })
        .on("start", function () {
          // this.parentNode.appendChild(this);
        })
        .on("drag", dragmoveY)
    );

  let _columns = [...columns];

  function Swap() {
    for (let i in columns) {
      if (_columns[i] != columns[i]) {
        _columns = [...columns];
        return true;
      }
    }
    return false;
  }

  function dragmoveX(e, d) {
    // drag x and y
    const _x = Math.min(width + NODE_WIDTH, Math.max(0 - NODE_WIDTH, e.x));
    isDraggedX[d] = _x;
    columns.sort((a, b) => pos(a) - pos(b));

    x.domain(columns);

    //   columns.forEach((i) => {
    //     g.selectAll("." + i).attr("x", pos(i));
    //     nodesByKey[i].forEach((n) => {
    //       n.x0 = pos(i);
    //       n.x1 = pos(i) + NODE_WIDTH;
    //     });
    //   });
    values.attr("opacity", 0);
    if (Swap()) {
      e.sourceEvent.preventDefault();
      e.sourceEvent.stopPropagation();
      texts.on(".drag", null);
      updateLayout();
    } else {
      texts.attr("x", (d) => pos(d));
      node
        .attr("x", (n) => pos(n.name))
        .each((n) => {
          n.x0 = pos(n.name);
          n.x1 = pos(n.name) + NODE_WIDTH;
        });
      sankey.update(graph);
      link.attr("d", d3.sankeyLinkHorizontal());
    }
  }

  function updateLayout() {
    graph = generateGraph(data, columns);

    let { nodes: n, links: l } = sankey({
      nodes: graph.nodes, //.map((d) => Object.create(d)),
      links: graph.links, //.map((d) => Object.create(d)),
    });

    sankey = d3
      .sankey()
      .nodeSort((a, b) => {
        return +b.value - +a.value;
      })
      .linkSort((a, b) => {
        return ords[columns[0]](a.names[0]) - ords[columns[0]](b.names[0]);
      })
      .nodeWidth(NODE_WIDTH)
      .nodePadding(8)
      .extent([
        [0, 0],
        [width, height],
      ]);

    nodes = n;
    links = l;
    //   x.domain(columns);

    texts.transition().attr("x", (d) => pos(d));

    link // update the attr with d
      .data(links)
      .transition()
      .attr("d", d3.sankeyLinkHorizontal()) //sankeyLinkHorizontal
      .attr("stroke", (d) => color(d.names[0]))
      .attr("stroke-width", (d) => d.width);

    link
      .attr("class", (d) => ` link ${d.names.join("_")}`)
      .on("mouseenter", (e, d) => {
        link.classed("deactive", true);
        upstream(d, true);
        d3.select(e.target).classed("deactive", false);
        downstream(d, true);
      })
      .on("mouseout", (e, d) => {
        downstream(d, false);
        upstream(d, false);
        link.classed("deactive", false);
      });

    // .selectAll("title")
    // .text((d) => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);
    titles
      .data(links)
      .text((d) => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

    node
      .data(nodes)
      .transition()
      .attr("class", (d) => `node ${d.name}`)
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => d.x1 - d.x0);
  }

  function dragendX(e, d) {
    delete isDraggedX[d];

    //   counts
    //     .attr("fill-opacity", 0.7)
    //     .text((d) => ` ${d.value.toLocaleString()}`);

    if (Swap()) {
      e.sourceEvent.preventDefault();
      e.sourceEvent.stopPropagation();
      updateLayout();
    } else {
      texts
        .transition()
        .delay(400)
        .attr("x", (d) => pos(d));
      node
        .transition()
        .delay(400)
        .attr("x", (n) => pos(n.name))
        .each((n) => {
          n.x0 = pos(n.name);
          n.x1 = pos(n.name) + NODE_WIDTH;
        });
      sankey.update(graph);

      link.transition().delay(400).attr("d", d3.sankeyLinkHorizontal());
      texts.call(d3.drag().on("drag", dragmoveX).on("end", dragendX));
    }

    values
      .data(nodes)
      .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
      .text((d) => d.val)
      .attr("opacity", 1)
      .attr("class", (d) => `label ${d.name}`)
      .append("tspan")
      .attr("fill-opacity", 0.7)
      .style("display", "none")
      .text((d) => ` ${d.value.toLocaleString()}`);
  }

  function dragmoveY(e, d) {
    // drag x and y
    let h = d.y1 - d.y0;
    const y = Math.min(height - h, Math.max(0, e.y - e.subject));
    d.y0 = y;
    d.y1 = y + h;
    d3.select(this).attr("y", y);
    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
  }
  // !!!!drag x and y
  function dragmove(e, d) {
    let w = d.x1 - d.x0;
    let h = d.y1 - d.y0;
    const x = Math.min(width - w, Math.max(0, e.x));
    const y = Math.min(height - h, Math.max(0, e.y - e.subject));
    var rectY = d3.select(this).attr("y");
    var rectX = d3.select(this).attr("X");

    d.x1 = x + w;
    d.x0 = x;
    d.y0 = y;
    d.y1 = y + h;

    d3.select(this).attr("x", x).attr("y", y);
    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
  }

  function pos(d) {
    return isDraggedX[d] ?? x(d);
  }

  return svg.node();
}

//   d3.csv("./car_prices_cleaned.csv").then((data) => {
//     const container = document.querySelector("#brush");
//     Parallel_Sets(container, data);
//   });
