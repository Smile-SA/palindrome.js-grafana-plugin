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
  id: 2,
  options: {
    palindromeConfig: '{\n  "colorsBehavior": "dynamic",\n  "colorsDynamicDepth": 100,\n  "statusColorLow": "#319b31",\n  "statusColorMed": "#f3c60a",\n  "statusColorHigh": "#FF0000",\n  "spheresColorsBehavior": "dynamic",\n  "sphereColorLow": "#319b31",\n  "sphereColorMed": "#f3c60a",\n  "sphereColorHigh": "#FF0000",\n  "bicolorDisplay": false,\n  "transparentDisplay": false,\n  "transparencyHigh": 1,\n  "transparencyMed": 0.5,\n  "transparencyLow": 0,\n  "mainStaticColor": "#f3c60a",\n  "displayArea": "palindrome",\n  "palindromeSize": 3,\n  "cameraOptions": [\n    "Fit"\n  ],\n  "metricMagnifier": 10,\n  "layerDisplayMode": "dynamic",\n  "displayLayers": true,\n  "lineOpacity": 1,\n  "lineWidth": 0.5,\n  "lineColor": "#000000",\n  "displayMode": "dynamic",\n  "displaySides": true,\n  "gridSize": 100,\n  "gridDivisions": 100,\n  "displayGrid": false,\n  "zPlaneInitial": 0,\n  "zPlaneHeight": 40,\n  "zPlaneMultilayer": 20,\n  "metricsLabelsRenderingMode": "3D",\n  "metricsLabels3DRenderingMode": "Canvas",\n  "metricsLabelsRenderingFormat": "Text",\n  "metricsLabelsStructure": [\n    "Name",\n    "Type",\n    "Value",\n    "Unit",\n    "State"\n  ],\n  "metricsLabelsCharacterFont": "Arial",\n  "metricsLabelsSize": 15,\n  "metricsLabelsColor": "#ccccdc",\n  "metricsLabelsBackground": "#f0f0f0",\n  "metricsLabelsBold": true,\n  "metricsLabelsItalic": false,\n  "displayMetricsLabels": true,\n  "displayAllMetricsLabels": false,\n  "displayMetricSpheres": true,\n  "displayValuesOnSphereHover": false,\n  "layersLabelsRenderingMode": "3D",\n  "layersLabelsOrientation": "Sticky",\n  "layersLabelsCharacterFont": "Arial",\n  "layersLabelsSize": 15,\n  "layersLabelsColor": "#000000",\n  "layersLabelsBackground": "#ffffff",\n  "layersLabelsBold": true,\n  "layersLabelsItalic": false,\n  "displayLayersLines": false,\n  "displayLayersLabels": true,\n  "frameShape": "Rectangle",\n  "animateFrameDashedLine": false,\n  "frameBackgroundColor": "#ffffff",\n  "frameOpacity": 0.5,\n  "framePadding": 2,\n  "frameLineColor": "#FFFFFF",\n  "frameLineWidth": 1,\n  "frameDashLineSize": 3,\n  "displayFrames": true,\n  "displayFramesLine": true,\n  "displayFramesBackground": false,\n  "displayMetricsLabelsUnit": true,\n  "displayLabelLine": true,\n  "statusRangeLow": 0,\n  "statusRangeMed": 33,\n  "statusRangeHigh": 66,\n  "mockupData": false,\n  "liveData": false,\n  "webWorkersRendering": false,\n  "webWorkersHTTP": false,\n  "resourcesLevel": 50,\n  "sideLabelDisplay": false,\n  "rotatedMetricsAngle": 0,\n  "mergedMetricsNames": false,\n  "remoteDataFetchPace": 1000,\n  "layerMetricsUnits": "absolute",\n  "equalizeFrameLinks": false,\n  "labelToFrameLinkLength": 40,\n  "labelToFrameLinkType": "dynamic",\n  "negativeValuesMagnifier": 2,\n  "isGrafana": true,\n  "innerHeight": 626,\n  "innerWidth": 1870,\n  "grafanaZoom": 1.5,\n  "isDarkGrafana": true,\n  "grafanaColor": "#181b1f"\n}',
  },
  title: 'Palindrome.js Influxdb',
  type: 'palindrome-js-panel',
};
g.dashboard.new('Nephele dashboard')
+ g.dashboard.withDescription('Dashboard for Palindrome.js')
+ g.dashboard.withPanels([
  panel + targets,
])
