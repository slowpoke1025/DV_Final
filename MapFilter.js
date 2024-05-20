import Colorbar from "./colorbar.js";

export function MapFilter(container, controlContainer) {

    const obj = {}, colors = {}, extents = {}
    let target, states
    return d3.csv("./dataset/states_agg.csv").then(data => {
        const dimensions = data.columns.filter(d => d !== "state")

        dimensions.forEach(col => {
            extents[col] = d3.extent(data, d => +d[col])
            colors[col] = d3.scaleSequential(extents[col], d3.interpolateBlues);
        })
        data.forEach(d => {
            const { state, ...v } = d
            obj[state] = v
        })
        function update(col) {
            target = col
            states.attr("fill", d => {
                return obj[d.properties.name] ? colors[col](+obj[d.properties.name][col]) : "lightgray"
            })
            states.select("title").text(d => d.properties["name"] + " " + Math.round(obj[d.properties["name"]]?.[target] ?? ''))

            return extents[col]
        }

        target = dimensions[0]
        controlContainer.append(Colorbar(300, extents[target], 80, { vertical: false, rotate: 0, titles: dimensions, update }))
        return d3.json("./map/states-10m.json")

    }).then(data => {

        const margin = { top: 0, right: 0, bottom: 0, left: 0 },
            width = container.clientWidth - margin.left - margin.right,
            height = container.clientHeight - margin.top - margin.bottom

        // append the svg object to the body of the page
        let svg = d3
            .select(container)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("style", "max-width: 100%; height: auto;")


        function zoomed(event) {
            return svg.attr("transform", event.transform)
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

        let minZoom = 0.8, maxZoom = 10;
        let zoom = d3.zoom()
            .scaleExtent([minZoom, maxZoom])
            .filter(event => event.type !== "dblclick")
            .translateExtent([[0, 0], [width, height]]) // 限制不可拖曳範圍
            .on("zoom", zoomed);

        // 应用缩放行为到SVG元素
        svg.call(zoom)

        const svgg = svg
        svg = svg
            .append("g")
            // .attr("transform", `translate(${margin.left}, ${margin.top}) rotate(90, ${width / 2}, ${height / 2})`)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)


        const projection = d3.geoMercator()
            .center([-100, 40])

        const path = d3.geoPath(projection)

        const geometries = topojson.feature(data, data.objects["states"])
        geometries.features = geometries.features.filter(d => ![2, 72, 15, 78, 69, 60, 66].includes(+d.id))
        console.log(geometries)
        const g = geometries.features.filter(d => ![2, 72, 15, 78, 69, 60, 66].includes(+d.id))

        const reflectY = d3.geoTransform({
            point(x, y) {
                this.stream.point(x, -y);
            }
        });
        const reflectX = d3.geoTransform({
            point(x, y) {
                this.stream.point(-x, y);
            }
        });

        projection
            // .scale(700)
            // .translate([width / 2, height / 2])
            .angle(-90)
            // .reflectY(reflectY)
            .fitSize([width, height], geometries)
            .scale(projection.scale() * 0.85)
        // .fitExtent([[0, 0], [width, height]], geometries)

        const color = d3.scaleSequential([0, 15000], d3.interpolateBlues);
        states = svg
            // .append("g")
            .selectAll("path")
            .data(g) //geometries.features
            .join("path")
            // draw each country
            .attr("d", d3.geoPath(projection)
                // .projection(projection)
            )
            .attr("class", "state")
            // 加上簡易版本 tooltip
            // .on("mouseover", function (e, d) {
            //     d3.select(this).classed("active", true);
            // })
            // .on("mouseout", function (e, d) {
            //     d3.select(this).classed("active", false);
            // })

            .on("dblclick", function (e, d) {
                boxZoom(path.bounds(d), path.centroid(d), 100)
                // svgg.transition().duration(750).call(zoom.transform, d3.zoomIdentity); // zoom back to default
                // svgg.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")")
            })


        states.attr("fill", d => {
            return obj[d.properties.name] ? colors[target](+obj[d.properties.name][target]) : "lightgray"
        })
            .classed("invalid", (d) => obj[d.properties.name] == null)
            .on("click", function (e, d) {
                if (obj[d.properties.name] == null) return
                let flag = d3.select(this).classed("active")
                d3.select(this).classed("active", !flag);
            })
        states
            .append("title")
            .text(d => d.properties["name"] + " " + obj[d.properties["name"]]?.[target])


        function boxZoom(box, centroid, padd) {

            let [minXY, maxXY] = box // [x0, y0], [x1, y1]
            // find size of map area defined
            let zoomWidth = Math.abs(minXY[0] - maxXY[0]);
            let zoomHeight = Math.abs(minXY[1] - maxXY[1]);
            // find midpoint of map area defined
            let [zoomMidX, zoomMidY] = centroid

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
            svgg
                .transition()
                .duration(750)
                .call(
                    zoom.transform,
                    d3.zoomIdentity
                        .translate(dleft, dtop) // 以原中心移動，故座標方向正負相反，ex: (width/2, height2) 會將中心移到右下角
                        .scale(zoomScale)
                );
        }

        return svgg.node()
    })



}
