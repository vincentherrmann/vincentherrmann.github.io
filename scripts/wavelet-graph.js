var graph_div = d3.select("#wavelet_graph");
var width = Math.min(Math.max(graph_div.node().getBoundingClientRect().width, 300), 680),
    height = width * 0.35,
    margin = {top: 20, right: 20, bottom: 20, left: 20}

var coefficients = []
var levelsOptions = ["2 levels", "3 levels", "4 levels", "5 levels", "6 levels"];

d3.json("/../../scripts/daubechies.json", function(error, daubechiesData) {
  // console.log("json");
  // debugger;
  var data = daubechiesData["Coefficients"];
  coefficients = data;

  var optionsDiv = graph_div.append("div");

  var selectCoeff = optionsDiv.append("select")
      .attr("class", "coeffSelect")
      .attr("style", "margin-right:10px")
      .on("change", updateGraph);

  selectCoeff.selectAll("option")
      .data(data)
    .enter().append("option")
      .attr("value", function(d, i) {return i; })
      .text(function(d) { return d.name; });

  var selectLevels = optionsDiv.append("select")
      .attr("class", "levelsSelect")
      .on("change", updateGraph);

  selectLevels.selectAll("option")
      .data(levelsOptions)
      .enter().append("option")
        .attr("value", function(d, i) { return i; })
        .text(function(d) { return d});

  selectCoeff.property("value", "1");
  selectLevels.property("value", "3");
  updateGraph();

});

var nodeRadius = "5px",
    nodeColor = "lightSlateGray",
    nodeColorH = "black",
    linkStroke = "1.5px",
    linkStrokeH = "3px",
    linkOpacity = "0.3",
    linkOpacityH = "1";

var color_size = 15,
    color_margin_x = 8,
    color_margin_y = 1;

var removeDuration = 1000,
    updateDuration = 250;

function node_id(n) {
  return "n" + n.level + n.position * Math.pow(2, n.level)
}

function flat_range(data, f=function(v) { return v; }) {
  var flat_data = [].concat.apply([], data).map(f);
  return [d3.min(flat_data), d3.max(flat_data)];
};

function create_data(max_level, num_coefficients, new_position) {
  var first_node = {"level": 0, "position": 0}
  var nodes = {"n00": first_node};
  var links = []

  for (var l = 1; l <= max_level; l++) {
    var current_nodes = d3.values(nodes).filter(function(d) {return d.level == l-1});
    current_nodes.forEach(function(node) {
      var target_id = node_id(node);
      for (var c = 0; c < num_coefficients; c++) {
        p = new_position(node, c);
        var new_node = {"level": l, "position": p};
        var new_id = node_id(new_node);
        nodes[new_id] = new_node
        links.push({"source": new_id, "target": target_id, "value": c});
      }
    });
  }

  return [nodes, links]
}

function filterbank_connection(node, c) {
  var new_position = node.position + c / Math.pow(2, node.level+1);
  return new_position
}
function dilation_connection(node, c) {
  var new_position = (node.position + c) / 2;
  return new_position
}

function find_paths(source, target, path=[], links_data) {
  // find all links from the source
  next_links = links_data.filter(function(d) { return d.source == source });
  if(path.length == 0) {
    paths_to_target = [];
  }

  next_links.forEach(function(this_link) {
    new_path = path.slice(0);
    new_path.push(this_link);
    if(this_link.target == target) {
      paths_to_target.push(new_path);
    } else {
      find_paths(this_link.target, target, new_path, links_data);
    }
  });

  return paths_to_target
}

function link(d) {
  return "M" + d.source.x + "," + d.source.y
      + "C" + d.source.x + "," + (d.source.y + d.target.y) / 2
      + " " + d.target.x + "," + (d.source.y + d.target.y) / 2
      + " " + d.target.x + "," + d.target.y;
}

var max_level = 4;
var num_coeff = 4;

var color = d3.scaleOrdinal(d3.schemeCategory10);

function updateGraph() {
  graph_div.selectAll("*").transition();
  graph_div.selectAll(".graph").remove();

  var h_0 = coefficients[+graph_div.select(".coeffSelect").property("value")].coefficients;
  var num_levels = +graph_div.select(".levelsSelect").property("value") + 1;
  drawGraph(h_0, num_levels);
}

function drawGraph(h_0, max_level) {
  //debugger;
  var num_coeff = h_0.length;
  [nodes_data, links_data_1] = create_data(max_level, num_coeff, filterbank_connection);
  [nodes_data_2, links_data_2] = create_data(max_level, num_coeff, dilation_connection);
  var data = [[nodes_data, links_data_1], [nodes_data_2, links_data_2]];

  function node_position(n) {
    p = {"x": x(n.position), "y": y(n.level)};
    return p
  }

  var x = d3.scaleLinear()
            .range([width - margin.right, margin.left])
            .domain([0, d3.max(d3.values(nodes_data), function(d) { return d.position; })]),
      y = d3.scaleLinear()
            .range([height - margin.bottom, margin.top])
            .domain([0, d3.max(d3.values(nodes_data), function(d) { return d.level; })]);


  //calculated coefficients
  var h_0 = h_0.map(function(v) { return v*Math.pow(2, 0.5)});
  var coeff_height = width*0.3;
  //calculate coefficients
  var coefficients = [[{"level": 0, "value": 1}]];
  for (var i = 0; i < max_level; i++) {
    var c = next_approximation(coefficients[i].map(function(v) { return v.value; }), h_0);
    coefficients[i+1] = c.map(function(v) { return {"level": i+1, "value": v}; });
  }

  var coeff_y = d3.scaleLinear().range([coeff_height, margin.top])
      .domain(flat_range(coefficients, function(v) { return v.value; }));

  var line = d3.line()
      .x(function(d, i) { return x(i / Math.pow(2, d.level)); })
      .y(function(d) { return coeff_y(d.value); });

  var coeff_svg = graph_div.append("svg")
      .attr("class", "graph")
      .attr("width", width + margin.left + margin.right)
      .attr("height", coeff_height + margin.top + margin.bottom);

  coeff_svg.selectAll("g")
      .data(coefficients).enter()
    .append("g")
    .selectAll("circle")
      .data(function(d) { return d;}).enter()
    .append("circle")
      .attr("r", "0px")
      .attr("id", function(d, i) { return "n" + d.level + i})
      .attr("cx", function(d, i) { return x(i / Math.pow(2, d.level)); })
      .attr("cy", function(d) { return coeff_y(d.value); })

  coeff_svg.selectAll("g")
    .append("path")
      .attr("id", function(d, i) { return "l" + i; })
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "1.5px")
      .attr("stroke-opacity", "0.3")
      .attr("d", line);

  coeff_svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + (coeff_height + 20) + ")")
      .call(d3.axisBottom(x));

  coeff_svg.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", "translate(" + (width + 10) + ", 0)")
      .call(d3.axisRight(coeff_y));



  var svg = graph_div.selectAll("foo")
      .data(data)
    .enter().append("svg")
      .attr("class", "graph")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

  // svg.attr("id", function(d, i) {debugger;});

  var labels = Array(max_level+1).fill(0);
  var variableNames = ["x", "\\phi"];
  svg.selectAll(".label")
      .data(function(d, i) {return labels.fill(i)})
    .enter().append("foreignObject")
      .attr("class", "label")
      .attr("width", 100)
      .attr("height", 20)
      .attr("x", width)
      .attr("y", function(v, i) { return y(i) - 15; })
      .text(function(v, i) { return "$" + variableNames[v] + "_" + i + "$"; } );

  //call to render latex after each update
  MathJax.Hub.Queue(["Typeset", MathJax.Hub,]);

  //create links
  var links = svg.selectAll(".link")
      .data(function(d) { return d[1] })
    .enter().append("path")
      .attr("class", "link")
      .attr("id", function(d) { return d.source +  d.target })
      .attr("stroke", function(d) { return color(d.value) })
      .attr("fill", "none")
      .attr("stroke-opacity", linkOpacity)
      .attr("stroke-width", linkStroke)
      .attr("d", function(d) {
        return link({
          "source": node_position(nodes_data[d.source]),
          "target": node_position(nodes_data[d.target])
        })
      });

  // create nodes
  var node = svg.selectAll(".node")
    .data(function(d) { return d3.values(d[0]) })
    .enter().append("g")
      .attr("class", "node")
      .attr("id", function(d) { return node_id(d) })
      .attr("fill", nodeColor)
      .attr("transform", function(d) {
        p = node_position(d)
        return "translate(" + p.x + "," + p.y + ")";
      });

  node.append("circle")
      .attr("r", nodeRadius)
      .on("mouseover", function(d, i) {
        id = node_id(d);
        n = svg.selectAll("#" + id);
        n.each(function(d) {connect_node(this, id);})

        coeff_svg.selectAll("#" + id)
          .transition().duration(updateDuration)
          .attr("r", nodeRadius);
        coeff_svg.selectAll("#l" + d.level)
          .transition().duration(updateDuration)
          .attr("stroke-opacity", "1.0");
      })
      .on("mouseout", function(d, i) {
        graph_div.selectAll(".node-hover")
            .transition().duration(removeDuration)
            .attr("class", "node")
            .attr("fill", nodeColor);
        graph_div.selectAll(".link-highlight")
            .transition().duration(removeDuration)
            .attr("class", "link")
            .attr("stroke-width", linkStroke)
            .attr("stroke-opacity", linkOpacity);

        var color_paths = d3.selectAll(".color_path")
        color_paths.selectAll("rect")
            .transition().duration(removeDuration)
            .attr("opacity", "0.0");

        coeff_svg.selectAll("#" + node_id(d))
          .transition().duration(removeDuration)
          .attr("r", "0px");
        coeff_svg.selectAll("#l" + d.level)
          .transition().duration(removeDuration)
          .attr("stroke-opacity", "0.3");
      });

};



function connect_node(node, node_id) {
  d3.select(node)
    .transition().duration(updateDuration)
    .attr("class", "node-hover")
    .attr("fill", nodeColorH);
  var this_svg = d3.select(node.parentNode);
  paths = find_paths(node_id, "n00", [], this_svg.datum()[1]);

  draw_colors(paths.reverse(), this_svg);
  paths = [].concat.apply([], paths);
  path_ids = paths.reduce(function(t, c) {return t + ", #" + c.source + c.target}, "#foo");

  this_svg.selectAll(path_ids)
    .transition().duration(updateDuration)
    .attr("class", "link-highlight")
    .attr("stroke-width", linkStrokeH)
    .attr("stroke-opacity", linkOpacityH);
}

function draw_colors(paths, this_svg) {
  paths = paths.map(function(v, i) { return {"path": v.reverse(), "index": i}; });

  var color_paths = this_svg.selectAll(".color_path")
    .data(paths)

  var color_elements = color_paths.enter() //enter
    .append("g")
      .attr("class", "color_path")
      .attr("transform", function (d) {
        return "translate(" + (margin.left + d.index * (color_size + color_margin_x)) + "," + (height - margin.bottom) + ")"
      })
    .merge(color_paths) //update
    .selectAll("rect")
      .data(function(d) { return d.path});

  color_elements.enter() //enter
    .append("rect")
      .attr("width", color_size)
      .attr("height", color_size)
      .attr("y", function(d, i) { return -(color_size + color_margin_y) * i - color_size})
      .attr("fill", function(d) { return color(d.value) })
      .attr("opacity", "0.0")
    .merge(color_elements).transition().duration(updateDuration) //update
      .attr("opacity", "1.0")
      .attr("fill", function(d) { return color(d.value) });

  color_elements.exit()
      .transition().duration(removeDuration)
      .attr("opacity", "0.0")

  color_paths.exit().selectAll("rect")
      .transition().duration(removeDuration)
      .attr("opacity", "0.0");

}
