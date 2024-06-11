local targets = import './parser/targets.json';
local g = import 'github.com/grafana/grafonnet/gen/grafonnet-latest/main.libsonnet';

local panel = {
  datasource: {
    uid: 'P5697886F9CA74929',
    type: 'influxdb',
  },
  gridPos: {
    h: 18,
    w: 24,
    x: 0,
    y: 14,
  },
  title: 'Palindrome.js Influxdb',
  type: 'palindrome-js-panel',
};

g.dashboard.new('Nephele dashboard')
+ g.dashboard.withDescription('Dashboard for Palindrome.js')
+ g.dashboard.withPanels([
  panel + targets,
])
