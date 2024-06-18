local targets = import './parser/targets.json';
local timeSeries = import './parser/timeSeries.json';
local row = import './parser/numberOfObjects.json';
local g = import 'github.com/grafana/grafonnet/gen/grafonnet-latest/main.libsonnet';

local panel = {
  datasource: {
    uid: 'P5697886F9CA74929',
    type: 'influxdb',
  },
  gridPos: {
    h: 12,
    w: 12,
    x: 0,
    y: 12,
  },
  title: 'Palindrome.js Influxdb',
  type: 'palindrome-js-panel',
};

g.dashboard.new('Nephele dashboard')
+ g.dashboard.withDescription('Dashboard for Palindrome.js')
+ g.dashboard.withPanels(
  [row] +
  [panel + targets] +
  timeSeries
)
