//create anonymous function and call it for scope
(function(){
  var this_div = d3.select("#wavelet_construction");
  var width = Math.min(Math.max(this_div.node().getBoundingClientRect().width, 300), 680),
      height = width * 0.6,
      margin = {top: 20, right: 20, bottom: 20, left: 20};
  var optionsDiv = this_div.append("div"),
      constr_svg = this_div.append("svg")
          .attr("width", width)
          .attr("height", height);

  var coefficients = []
  var drawOptions = ["Scaling", "Wavelet"];
  var drawFunctions = [function(v) { return v; }, calculate_h_1];

  d3.json("/../../scripts/daubechies.json", function(error, daubechiesData) {
    var data = daubechiesData["Coefficients"];
    coefficients = data;

    var selectCoeff = optionsDiv.append("select")
        .attr("class", "coeffSelect")
        .attr("style", "margin-right:10px")
        .on("change", newCoefficients)

    selectCoeff.selectAll("option")
        .data(data)
      .enter().append("option")
        .attr("value", function(d, i) {return i; })
        .text(function(d) { return d.name; });

    optionsDiv.append("select")
        .attr("class", "funcSelect")
        .on("change", newCoefficients)
      .selectAll("option")
        .data(drawOptions)
        .enter().append("option")
          .attr("value", function(d, i) { return i; })
          .text(function(d) { return d});

    selectCoeff.property("value", "1");
    newCoefficients();

  });

  function newCoefficients() {
    constr_svg.selectAll("*").transition();
    constr_svg.selectAll("*").remove();

    var coeff = coefficients[+d3.select(".coeffSelect").property("value")].coefficients;
    var drawFunc = drawFunctions[d3.select(".funcSelect").property("value")];
    constructWavelets(coeff, drawFunc);
  }

  function constructWavelets(new_coefficients, modeFunc) {
    var h_0 = new_coefficients;
    //var coeff = Array(10).fill(0).map(function(v, i) {return Math.pow((i-3.7), 2) - 9});
    //var coeff = Array(6).fill(0).map(function(v, i) {return i*0.3 - 0.8});
    var coeff = modeFunc(h_0);
    var num_approx = 7;
    var data = scaling_approximation(h_0, num_approx);
    data = shift_and_scale(data, coeff, num_approx);
    var stacked_data = stack_data(data);
    var result = stacked_data[stacked_data.length-1].map(function(d) { return d[1]; });
    var flat_data = [].concat.apply([], data).concat(result);
    var remaining_data = remaining_components(stacked_data, result);

    var y = d3.scaleLinear().range([height - margin.bottom, margin.top]),
        x = d3.scaleLinear().range([margin.left, width - margin.right]);
    x.domain([0, data[0].length]);
    y.domain([d3.min(flat_data), d3.max(flat_data)]);
    var z = d3.scaleOrdinal(d3.schemeDark2);
    var z_r = d3.scaleOrdinal(d3.schemeDark2);

    var area = d3.area()
        .x(function(d, i) { return x(i);})
        .y1(function(d) { return y(d);})
        .y0(y(0));

    var area_stacked = d3.area()
        .x(function(d, i) { return x(i);})
        .y1(function(d) { return y(d[1]);})
        .y0(function(d) { return y(d[0]);});

    constr_svg.selectAll(".component")
        .data(data)
      .enter().append("g")
        .attr("class", "component")
      .append("path")
        .attr("class", "area")
        .attr("d", function(d) { return area(d); })
        .attr("fill", function(d) { return z(d)})
        .attr("opacity", "0.7");

    constr_svg.selectAll(".component")
        .data(stacked_data)
      .select("path")
        .transition()
        .duration(1500)
        .delay(function(d, i) { return 1500*i; })
        .on("end", function(d, i) {
          constr_svg.append("g")
              .data([remaining_data[i]])
              .attr("class", "result")
            .append("path")
              .attr("d", function(d) { return area_stacked(d); })
              .attr("fill", function(d) { return z_r(d)})
              .attr("opacity", "0.0")
              .transition().delay(1500).duration(1500)
              .attr("opacity", "1.0");

          if(i == data.length - 1) {
            constr_svg.selectAll(".component").select("path")
                .transition().delay(1500).duration(3000)
                .attr("opacity", "0.")
          }
        })
        .attr("d", function(d) { return area_stacked(d); })
  }
})();
