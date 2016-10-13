import * as d3 from 'd3';

// use to build a chart for the hazium data.
module.exports = (id, data) => {
  const svg = d3.select(`#${id}`);
  const margin = { top: 20, right: 80, bottom: 30, left: 50 };
  const width = svg.attr('width') - margin.left - margin.right;
  const height = svg.attr('height') - margin.top - margin.bottom;
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // initialize the time parser
  const timeParser = d3.timeParse('%Y-%m-%d %H:%M:%S');

  // initialize the scales
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const z = d3.scaleOrdinal().range(d3.schemeCategory10);

  // function for the line
  const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => x(d.time))
    .y(d => y(d.hazium));

  // manipulate data
  data = data.map(item => {
    return {
      code: item.code,
      time: timeParser(item.time),
      hazium: item.hazium,
      floor: item.floor,
      zone: item.zone,
    };
  });
  const sensorNames = getSensors(data);
  const sensors = sensorNames.map(code => {
    return { code, values: groupBySensor(data, code, timeParser) };
  });

  // setup the domains
  x.domain(d3.extent(data, d => d.time));
  y.domain([
    d3.min(sensors, s => d3.min(s.values, d => d.hazium)),
    d3.max(sensors, s => d3.max(s.values, d => d.hazium))
  ]);
  z.domain(sensors.map(s => s.code));

  // append the axis
  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  g.append('g')
    .attr('class', 'axis axis--y')
    .call(d3.axisLeft(y))
  .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '0.71em')
    .attr('fill', '#000')
    .text('Hazium concentration');

  // add a group for each sensor
  var series = g.selectAll('.sensor')
    .data(sensors)
    .enter()
    .append('g')
    .attr('class', 'sensor');

  // add the path for each sensor
  series.append('path')
    .attr('class', 'line')
    .attr('d', d => line(d.values))
    .attr('stroke-opacity', 0.4)
    .style('stroke', d => z(d.code));

  // append the text of the sensor
  series.append('text')
    .datum(d => { return { code: d.code, value: d.values[d.values.length - 1] }; })
    .attr('transform', d => `translate(${x(d.value.time)},${y(d.value.hazium)})`)
    .attr('x', 3)
    .attr('dy', '0.35em')
    .style('font', '10px sans-serif')
    .text(d => d.code);
};

function getSensors(list) {
  return list
    .map(item => item.code)
    .filter((item, index, all) => all.indexOf(item) === index);
}

function groupBySensor(list, sensor, timeParser) {
  return list
    .filter(item => item.code === sensor);
}
