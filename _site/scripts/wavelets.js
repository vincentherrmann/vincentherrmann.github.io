var db2 = [0.48296291314469025, 0.836516303737469, 0.22414386804185735, -0.12940952255092145];
var db3 = [0.3326705529509569, 0.8068915093133388, 0.4598775021193313, -0.13501102001039084, -0.08544127388224149, 0.035226291882100656];
var db4 = [0.23037781330885523, 0.7148465705525415, 0.6308807679295904, -0.02798376941698385, -0.18703481171888114, 0.030841381835986965, 0.032883011666982945, -0.010597401784997278];
var db10 = [0.026670057900950818, 0.18817680007762133, 0.5272011889309198, 0.6884590394525921, 0.2811723436604265, -0.24984642432648865, -0.19594627437659665, 0.12736934033574265, 0.09305736460380659, -0.07139414716586077, -0.02945753682194567, 0.03321267405893324, 0.0036065535669883944, -0.010733175482979604, 0.0013953517469940798, 0.00199240529499085, -0.0006858566950046825, -0.0001164668549943862, 9.358867000108985e-05, -1.326420300235487e-05];
var bi1_3 = [-0.08838834764831845, 0.08838834764831845, 0.7071067811865476, 0.7071067811865476, 0.08838834764831845, -0.08838834764831845];
var co1 = [-0.0727326195128539, 0.3378976624578092, 0.8525720202122554, 0.38486484686420286, -0.0727326195128539, -0.01565572813546454];

function calculate_h_1(h_0) {
  return h_0.map(function(v, i) { return Math.pow(-1, i) * v}).reverse();
}

function next_approximation(x_n, h_0) {
  var new_value_count = 2*x_n.length + h_0.length - 2;
  var new_x = Array(new_value_count).fill(0);

  for (var j = 0; j < new_value_count; j++) {
    var current_value = 0;
    for (var k = 0; k < h_0.length; k++) {
      if ((j+k) % 2 == 0) {
        var i = (j-k) / 2;
        if(i >= 0 && i < x_n.length) {
          current_value = current_value + h_0[k] * x_n[i];
        }
      }
    }
    new_x[j] = current_value;
  }
  return new_x;
}

function scaling_approximation(coeff, num_approx) {
  var r = [1];
  for (var i = 0; i < num_approx; i++) {
    r = next_approximation(r, coeff);
  }
  return r
}

function shift_and_scale(phi, scale_coeff, num_approx) {
  var result = []
  var offset = Math.pow(2, num_approx);
  for (var i = 0; i < scale_coeff.length; i++) {
    var scaled = phi.map(function(d) { return d * scale_coeff[i]; })
    var start_buffer = Array(i*offset).fill(0);
    var end_buffer = Array((scale_coeff.length - 1 - i)*offset).fill(0);
    result.push(start_buffer.concat(scaled).concat(end_buffer));
  }

  return result;
}

function stack_data(data) {
  var length = data[0].length;
  var current_base = Array(length).fill(0);
  var result = []
  for (var i = 0; i < data.length; i++) {
    var sum = data[i].map(function(v, j) { return v + current_base[j]; })
    result[i] = sum.map(function(v, j) { return [current_base[j], v]; })
    current_base = sum;
  }
  return result;
}

function remaining_components(stacked_data, result) {
  var r = stacked_data.map( function(s) { return s.map( function(d, i) {
    var v0 = d[0];
    var v1 = d[1];

    var r = result[i];

    if (Math.sign(v0) != Math.sign(r)) {
      v0 = 0;
    }
    if (Math.sign(v1) != Math.sign(r)) {
      v1 = 0;
    }
    if (Math.abs(v0) > Math.abs(r)) {
      v0 = r;
    }
    if (Math.abs(v1) > Math.abs(r)) {
      v1 = r;
    }

    return [v0, v1];
  }); });

  return r;
}
