
const main = document.querySelector(".main")
let { width: main_width, height: main_height } = main.getBoundingClientRect()

const margin = { top: 30, right: 30, bottom: 30, left: 30 },
    width = +main_width - margin.left - margin.right,
    height = +main_height - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select(main)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("style", "max-width: 100%; height: auto;")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .style("font-family", "Georgia, serif")


d3.csv("./dataset/car_prices_cleaned.csv").then(data => {
    const columns = data.columns;
    console.log(columns);
    data = data.slice(0, 1000)
    const dimensions = columns.filter(d => [/*"age", */"condition", "year", "mmr", "odometer", "sellingprice"].includes(d))

    const y_l = {}
    for (let col of dimensions) {
        y_l[col] = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[col]))
            .range([height, 0])
    }

    const x_l = d3.scalePoint()
        .domain(dimensions)
        .padding(.1)
        .range([0, width])


    const draggedX = {}
    function path(d) {
        return d3.line()(dimensions.map(p => [pos(p), y_l[p](+d[p])]))
    }
    const color = d3.scaleSequential(y_l[dimensions[0]].domain(), d3.interpolateBrBG)
    const lines = svg
        .selectAll("lines")
        .data(data)
        .join("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", d => color(d[dimensions[0]]))//"#69b3a2"
        .attr("opacity", 1)
        .attr("stroke-width", 0.5)

    const axesMap = new Map()
    const axes = svg.selectAll("myAxis")

        .data(dimensions)
        .join("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; })
        // And I build the axis with the call function
        .each(function (d) {
            d3.select(this)
                .call(
                    d3.axisLeft(y_l[d])
                        .ticks(2)
                        .tickValues(d3.extent(data, p => +p[d]))
                )
                .call(self => axesMap.set(d, self))
                .selectAll("text")
                .style("font-size", "8px");
        })


    const texts = svg.selectAll("myText")
        .data(dimensions)
        .join("text")
        .attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; })
        .attr("y", -10)
        .text((d) => d)
        .attr("fill", "#888")

        .attr("font-size", 9)
        // .attr("transform", `rotate(${45})`)
        // .attr("transform", (d, i) => `rotate(45, 0, -10)`)
        .attr("text-anchor", "middle")
        .attr("cursor", "pointer")

        .call(drag())


    const brushHeight = 20;
    const brush = d3.brushY()
        .extent([
            [-(brushHeight / 2), 0],
            [brushHeight / 2, height]
        ])
        .on("brush end", brushed)
        .on("start", function (e) {
            e.sourceEvent.stopPropagation()
        })


    axes.call(brush)


    const selections = new Map();
    function brushed(obj, key) {
        if (obj.selection == null)
            selections.delete(key)
        else
            selections.set(key, obj.selection.map(y_l[key].invert))
        lines.each(lines_select)
    }

    function drag() {

        function dragstarted(e, d) {
            d3.select(this).raise()// raise() to move target visually to the top
            draggedX[d] = x_l(d)
            e.sourceEvent.stopPropagation()
        }

        function dragged(e, d) {
            draggedX[d] = Math.min(width, Math.max(0, e.x));
            dimensions.sort((a, b) => pos(a) - pos(b))
            x_l.domain(dimensions)
            color.domain(y_l[dimensions[0]].domain())
            lines.attr("d", path)
                // .attr("stroke", d => color(d[dimensions[0]]))
                .each(lines_select)
            axes./*filter(c => c !== d)*/attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; })
            texts.attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; })

            axesMap.get(d).attr("transform", function (d) { return `translate(${+ draggedX[d]}, 0)`; })

            d3.select(this).attr("transform", function (d) { return `translate(${draggedX[d]}, 0)`; })

        }

        function dragended(e, d) {
            delete draggedX[d]
            axes.transition().duration(1000).attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; }).ease(d3.easeBounce)
            texts.transition().duration(1000).attr("transform", function (d) { return `translate(${+ x_l(d)}, 0)`; }).ease(d3.easeBounce);
            lines.transition().duration(1000).attr("d", path).ease(d3.easeBounce)
        }
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    function pos(k) {
        return draggedX[k] ?? x_l(k)
    }
    function lines_select(d) {
        const active = Array.from(selections).every(([key, [max, min]]) => { return +d[key] >= min && +d[key] <= max })
        if (active) {
            d3.select(this).attr("stroke", color(+d[dimensions[0]]));
        } else {
            d3.select(this).attr("stroke", "#dddddddd").lower();
        }
    }
    // https://observablehq.com/@d3/circle-dragging-ii
    // https://gist.github.com/jasondavies/1341281


})