d3.csv("data/spotify_songs.csv").then(function(data) {

    // Extract year & convert popularity to number
    data.forEach(d => {
        d.year = +d.track_album_release_date.substring(0, 4);
        d.track_popularity = +d.track_popularity;
    });

    // Filter out invalid years (0 or NaN)
    data = data.filter(d => d.year > 0 && d.year < 2030);

    // Group by year → average popularity
    const popularityByYear = d3.rollups(
        data,
        v => d3.mean(v, d => d.track_popularity),
        d => d.year
    ).map(d => ({ year: d[0], popularity: d[1] }))
     .sort((a, b) => a.year - b.year);

    // SVG setup
    const width = 900, height = 500;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(popularityByYear, d => d.year))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(popularityByYear, d => d.popularity)])
        .range([height - margin.bottom, margin.top]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.popularity))
        .curve(d3.curveMonotoneX);

    // Line path
    svg.append("path")
        .datum(popularityByYear)
        .attr("fill", "none")
        .attr("stroke", "#4AB3F4")
        .attr("stroke-width", 3)
        .attr("d", line)
        .attr("stroke-dasharray", function() {
            const length = this.getTotalLength();
            return length + " " + length;
        })
        .attr("stroke-dashoffset", function() {
            return this.getTotalLength();
        })
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);

    // Circles for tooltip interaction
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("display", "none");

    svg.selectAll("circle")
        .data(popularityByYear)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.popularity))
        .attr("r", 4)
        .attr("fill", "#FF5733")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<b>Year:</b> ${d.year}<br><b>Avg Popularity:</b> ${d.popularity.toFixed(1)}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", event.pageY + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Average Popularity");

});
