//create anonymous function and call it for scope
(function(){
  var this_div = d3.select("#vanishing_moments");
  var width = Math.min(Math.max(this_div.node().getBoundingClientRect().width, 300), 680),
      height = width * 0.6,
      margin = {top: 20, right: 20, bottom: 20, left: 20};
  var sumDuration = 1000,
      fadeOutDuration = 4000;
  var optionsDiv = this_div.append("div"),
      constr_svg = this_div.append("svg")
          .attr("width", width)
          .attr("height", height);

  var coefficients = [];

  d3.json("/../../scripts/daubechies.json", function(error, daubechiesData) {
  //d3.json("daubechies.json", function(error, daubechiesData) {
    var data = daubechiesData["Coefficients"];
    coefficients = data;

    var selectCoeff = optionsDiv.append("select")
        .attr("class", "coeffSelect")
        .attr("style", "margin-right:10px")
        .on("change", newWavelet);

    var button = optionsDiv.append("button")
        .attr("class", "drawNew")
        .attr("style", "margin-right:10px")
        .text("draw")
        .on("click", newWavelet);

    selectCoeff.selectAll("option")
        .data(data)
      .enter().append("option")
        .attr("value", function(d, i) {return i; })
        .text(function(d) { return d.name; });

    optionsDiv.append("text")
        .attr("class", "vm_label")
        .text("vanishing momens");

    selectCoeff.property("value", "1");
    newWavelet();

  });

  function newWavelet() {
    constr_svg.selectAll("*").transition();
    constr_svg.selectAll("*").remove();

    var wavelet = coefficients[+this_div.select(".coeffSelect").property("value")];
    optionsDiv.select(".vm_label")
        .text("vanishing moments: " + wavelet.vanishing_moments);
    constructVanishingMoment(wavelet.coefficients, wavelet.vanishing_moments);
  }

  function polynomialValues(positions, coefficients) {
    var p = Array(positions.length).fill(0);
    for (var d = 0; d < coefficients.length; d++) {
      var c = coefficients[d];
      p = p.map(function(v, i) {return v + Math.pow(positions[i], d)*c; });
    }
    return p;
  }

  function sineTaylor(degree) {
    var coeff = [1]
    for (var d = 1; d < degree; d++) {
      var factorial = 1
      for (var i = 1; i <= d; i++) {
        factorial = factorial * i;
      }
      var sign = 1
      if(Math.floor(d/2) % 2 == 1) {
        sign = -1
      }
      coeff[d] = sign / factorial;
    }
    return coeff;
  }

  function constructVanishingMoment(waveletCoeff, vanishing_moments) {
    var h_0 = waveletCoeff.map(function(v) { return v*Math.pow(2, 0.5)});

    var offset = (Math.random()-0.5) * vanishing_moments * 2;
    var scale = (Math.random()-0.5) * 2;
    var coeffPositions = Array(4+vanishing_moments).fill(0).map(function(v, i) { return i*scale - offset; })
    //var polynomialCoeff = Array(vanishing_moments).fill(0).map(function(v, i) { return Math.random()*2 - 1; });
    var polynomialCoeff = sineTaylor(vanishing_moments);
    var coeff = polynomialValues(coeffPositions, polynomialCoeff);

    var num_approx = 7;
    var resolution = Math.pow(2, num_approx);
    var scalingFunction = scaling_approximation(h_0, num_approx);
    var data = shift_and_scale(scalingFunction, coeff, num_approx);
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

    function calcDelay() {
      //calculate the delay of a reconstructed signal using the scaling function
      //reconstruct a line with slope one and compare it to the desired value
      var r = 0
      for (var i = 0; i < h_0.length-1; i++) {
        var f = h_0.length-1-i;
        var v = scalingFunction[i*resolution];
        r = r + f*v;
      }
      return h_0.length-1 - r;
    }

    var delay = calcDelay();

    var polyPositions = Array(result.length).fill(0).map(function(v, i) { return i*scale / resolution - offset; });
    var polynomial = polynomialValues(polyPositions, polynomialCoeff);
    var polyOffset = x(resolution * delay) - margin.right;
    var polyLine = d3.line()
        .x(function(d, i) { return x(i) + polyOffset; })
        .y(function(d) { return y(d); });

    constr_svg.selectAll(".polynomial")
        .data([polynomial])
      .enter().append("path")
        .attr("class", "polynomial")
        .attr("fill", "none")
        .attr("stroke", "lightSlateGray")
        .attr("stroke-opacity", "0.5")
        .attr("stroke-width", "6px")
        .attr("d", polyLine);


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
        .duration(sumDuration)
        .delay(function(d, i) { return sumDuration*i; })
        .on("end", function(d, i) {
          constr_svg.append("g")
              .data([remaining_data[i]])
              .attr("class", "result")
            .append("path")
              .attr("d", function(d) { return area_stacked(d); })
              .attr("fill", function(d) { return z_r(d)})
              .attr("opacity", "0.0")
              .transition().duration(sumDuration)
              .attr("opacity", "1.0");

          if(i == data.length - 1) {
            constr_svg.selectAll(".component").select("path")
                .transition().duration(fadeOutDuration)
                .attr("opacity", "0.")
          }
        })
        .attr("d", function(d) { return area_stacked(d); })
  }
})();
