d3.csv("data/spotify_songs.csv").then(function(data) {

    // Convert release date to year & popularity to number
    data.forEach(d => {
        d.year = +d.track_album_release_date.substring(0, 4);
        d.track_popularity = +d.track_popularity;
    });

    // Filter invalid years
    data = data.filter(d => d.year > 0 && d.year < 3000);

    // Compute average popularity per year
    const popularityByYear = d3.rollups(
        data,
        v => d3.mean(v, d => d.track_popularity),
        d => d.year
    ).map(d => ({ year: d[0], popularity: d[1] }))
     .sort((a, b) => a.year - b.year);

    // ================================
    // ⭐ FIND MIN & MAX YEAR
    // ================================
    const minYear = d3.min(popularityByYear, d => d.year);
    const maxYear = d3.max(popularityByYear, d => d.year);

    const slider = document.getElementById("yearSlider");
    const yearValue = document.getElementById("yearValue");

    // Set slider range dynamically
    slider.min = minYear;
    slider.max = maxYear;
    slider.value = maxYear;
    yearValue.textContent = maxYear;

    // ================================
    // SVG SETUP
    // ================================
    const width = 900, height = 500;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // ================================
    // SCALES
    // ================================
    const x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(popularityByYear, d => d.popularity)])
        .range([height - margin.bottom, margin.top]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.popularity))
        .curve(d3.curveMonotoneX);

    // ================================
    // PATH & CIRCLE GROUPS
    // ================================
    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#4AB3F4")
        .attr("stroke-width", 3);

    const circleGroup = svg.append("g");

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("display", "none");

    // ================================
    // ⭐ UPDATE FUNCTION (slider)
    // ================================
    function updateChart(maxY) {

        const filteredData = popularityByYear.filter(d => d.year <= maxY);

        // Update X axis domain dynamically
        x.domain([minYear, maxY]);

        // Update X axis visually
        svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        // Update line path
        path.datum(filteredData)
            .transition()
            .duration(800)
            .attr("d", line);

        // Update circles
        const circles = circleGroup.selectAll("circle")
            .data(filteredData, d => d.year);

        circles.enter()
            .append("circle")
            .merge(circles)
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

        circles.exit().remove();
    }

    // Load chart for full range initially
    updateChart(maxYear);

    // ================================
    // ⭐ SLIDER LISTENER
    // ================================
    slider.addEventListener("input", function () {
        const selectedYear = +slider.value;
        yearValue.textContent = selectedYear;
        updateChart(selectedYear);
    });

    // ================================
    // AXES
    // ================================
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("x", width/2)
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
