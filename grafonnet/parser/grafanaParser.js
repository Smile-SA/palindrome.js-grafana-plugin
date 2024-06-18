const axios = require('axios');
const YAML = require('yaml');
const convert = require('xml-js');
const fs = require('fs');
const config = require('./config.json');
const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });

const { InfluxDB } = require('@influxdata/influxdb-client');
const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const queryApi = new InfluxDB({ url, token }).getQueryApi(org);


const YAML_INFO = config.files;
const YAML_URLS = YAML_INFO.map(it => it.url);
const YAML_LAYERS = YAML_INFO.map(it => it.layerName);

const timeSeriesPanelTemplate = {
  "type": "timeseries",
  "title": "Panel Title",
  "gridPos": {
    "x": 0,
    "y": 0,
    "w": 12,
    "h": 12
  },
  "datasource": {
    "uid": "P5697886F9CA74929",
    "type": "influxdb"
  },
  "id": 2,
  "targets": [
    {
      "datasource": {
        "type": "influxdb",
        "uid": "P5697886F9CA74929"
      },
      "refId": "A",
      "query": "from(bucket: \"Nephele\")\n  |> range(start: 0)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"Temperature\")\n  |> filter(fn: (r) => r[\"_field\"] == \"5700\")\n  |> filter(fn: (r) => r[\"sensor_id\"] == \"3303\")\n  |> last()\n  //layer: yamlLayer1, ranges: [0,35,70]"
    }
  ],
  "options": {
    "tooltip": {
      "mode": "single",
      "sort": "none"
    },
    "legend": {
      "showLegend": true,
      "displayMode": "list",
      "placement": "bottom",
      "calcs": []
    }
  },
  "fieldConfig": {
    "defaults": {
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "linear",
        "barAlignment": 0,
        "lineWidth": 1,
        "fillOpacity": 0,
        "gradientMode": "none",
        "spanNulls": false,
        "showPoints": "auto",
        "pointSize": 5,
        "stacking": {
          "mode": "none",
          "group": "A"
        },
        "axisPlacement": "auto",
        "axisLabel": "",
        "axisColorMode": "text",
        "scaleDistribution": {
          "type": "linear"
        },
        "axisCenteredZero": false,
        "hideFrom": {
          "tooltip": false,
          "viz": false,
          "legend": false
        },
        "thresholdsStyle": {
          "mode": "off"
        }
      },
      "color": {
        "mode": "palette-classic"
      },
      "mappings": [],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {
            "value": null,
            "color": "green"
          },
          {
            "value": 80,
            "color": "red"
          }
        ]
      }
    },
    "overrides": []
  }
};

const metricLabels = [];

const prepareGetRequests = (urls) => {
  const requests = [];
  for (const url of urls) {
    requests.push(axios.get(url));
  }
  return requests;
}

const prepareXmlRequestsFromYaml = async (yamlRequests, yamlLayerNames) => {
  const yamlFiles = await Promise.allSettled(yamlRequests);
  const xmlLayerNames = [];
  const xmlRequests = [];
  const xmlUrlBase = 'https://gitlab.eclipse.org/eclipse-research-labs/nephele-project/vo-lwm2m/-/raw/main/vo/src/main/resources/models/';
  let i = 0;
  for (const yamlFile of yamlFiles) {
    const jsonFromYamlFile = YAML.parse(yamlFile?.value?.data);
    for (const objectLink of jsonFromYamlFile.vo.objectLinks) {
      const xmlFileName = objectLink.split('/')[0] + '.xml';
      xmlRequests.push(axios.get(xmlUrlBase + xmlFileName));
      xmlLayerNames.push(yamlLayerNames[i]);
    }
    i++;
  }
  return { xmlRequests, xmlLayerNames };
}

const fetchData = async (requests, type, yamlLayerNames) => {
  if (type === 'yaml') {
    const { xmlRequests, xmlLayerNames } = await prepareXmlRequestsFromYaml(requests, yamlLayerNames);
    const data = (await Promise.allSettled(xmlRequests)).map(item => {
      return item?.value?.data;
    });
    return { data, xmlLayerNames };
  }

  const data = (await Promise.allSettled(requests)).map(item => {
    return item?.value?.data;
  });
  return data;
}

const convertXmlDataToJson = (xmlData) => {
  const jsonData = [];
  for (const xml of xmlData) {
    jsonData.push(JSON.parse(convert.xml2json(xml, { compact: true })));
  }
  return jsonData;
}

const fetchParams = async (yamlRequests, yamlLayerNames) => {
  const result = await fetchData(yamlRequests, 'yaml', yamlLayerNames);
  const xmlLayerNames = result.xmlLayerNames;
  const data = convertXmlDataToJson(result.data);

  const dbParams = {};
  let i = 0;
  for (const pieceOfData of data) {
    const layerName = xmlLayerNames[i];
    const metricName = pieceOfData.LWM2M.Object.Name._text;
    if (!dbParams[layerName]) {
      dbParams[layerName] = {};
    }
    if (!dbParams[layerName]['metrics']) {
      dbParams[layerName]['metrics'] = {};
    }
    if (!dbParams[layerName]['metrics'][metricName]) {
      dbParams[layerName]['metrics'][metricName] = {};
    }
    const objectId = pieceOfData.LWM2M.Object.ObjectID._text;
    const resources = pieceOfData.LWM2M.Object.Resources.Item;

    const current = {
      id: '',
      name: 'Sensor Value'
    }
    const min = {
      id: '',
      name: 'Min Range Value'
    }
    const max = {
      id: '',
      name: 'Max Range Value'
    }
    const med = {
      id: 'not handled => (min+max)/2',
      name: 'not handled => (min+max)/2'
    };

    const unit = {
      id: '',
      name: 'Sensor Units'
    };

    for (const r of resources) {
      if (r.Name._text === current.name) {
        current.id = r._attributes.ID;
      }
      if (r.Name._text === min.name) {
        min.id = r._attributes.ID;
      }
      if (r.Name._text === max.name) {
        max.id = r._attributes.ID;
      }
      if (r.Name._text === unit.name) {
        unit.id = r._attributes.ID;
      }

    }

    dbParams[layerName]['metrics'][metricName]['label'] = metricName;
    dbParams[layerName]['metrics'][metricName]['object_id'] = objectId;
    dbParams[layerName]['metrics'][metricName]['min_db_data'] = min;
    dbParams[layerName]['metrics'][metricName]['max_db_data'] = max;
    dbParams[layerName]['metrics'][metricName]['med_db_data'] = med;
    dbParams[layerName]['metrics'][metricName]['current_db_data'] = current;
    dbParams[layerName]['metrics'][metricName]['unit_db_data'] = unit;
    dbParams[layerName]["layer"] = {};
    dbParams[layerName]["layer"][`${layerName}-layer`] = {};
    dbParams[layerName]["layer"][`${layerName}-layer`]['label'] = layerName;
    i++;
  }
  return dbParams;
}

const executeFluxQuery = async (fluxQuery, queryApi) => {
  const result = {};
  for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
    const o = tableMeta.toObject(values)
    const key = o[o._measurement] ?? o._measurement;
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(o._value);
  }
  return result;
}

const getRangeValues = async (dbParams) => {

  const fluxQueryHeader = 'from(bucket:"' + bucket + '") |> range(start: 0) ';

  for (const layerName in dbParams) {
    const metrics = dbParams[layerName].metrics;
    let result;
    for (const metricName in metrics) {
      const metric = metrics[metricName];
      minFluxQuery = fluxQueryHeader + '|> filter(fn: (r) => r["_measurement"] == "' + metric.label + '") |> filter(fn: (r) => r["_field"] == "' + metric.min_db_data.id + '") |> filter(fn: (r) => r["sensor_id"] == "' + metric.object_id + '")';
      result = (await executeFluxQuery(minFluxQuery, queryApi))[metric.label];
      metric["min_value"] = result[result.length - 1];

      maxFluxQuery = fluxQueryHeader + '|> filter(fn: (r) => r["_measurement"] == "' + metric.label + '") |> filter(fn: (r) => r["_field"] == "' + metric.max_db_data.id + '") |> filter(fn: (r) => r["sensor_id"] == "' + metric.object_id + '")';
      result = (await executeFluxQuery(maxFluxQuery, queryApi))[metric.label];
      metric["max_value"] = result[result.length - 1];
    }
  }

};

const generateQueries = (dbParams) => {
  const queries = [];
  for (const layerName in dbParams) {
    const metrics = dbParams[layerName].metrics;
    for (const metricName in metrics) {
      const metric = metrics[metricName];
      const min = metric.min_value;
      const max = metric.max_value;
      const med = (min + max) / 2;
      const label = metric.label;
      metricLabels.push(label)
      const currentId = metric.current_db_data.id;
      const objectId = metric.object_id;
      const query = "from(bucket: \"" + bucket + "\")\n  |> range(start: 0)\n  |> filter(fn: (r) => r[\"_measurement\"] == \"" + label + "\")\n  |> filter(fn: (r) => r[\"_field\"] == \"" + currentId + "\")\n  |> filter(fn: (r) => r[\"sensor_id\"] == \"" + objectId + "\")\n  |> last()\n  //layer: " + layerName + ", ranges: [" + min + "," + med + "," + max + "]";
      queries.push(query);
    }
  }
  return queries;
}

const buildTargets = (queries) => {
  const targets = [];
  let i = 0;
  for (const query of queries) {
    const target = {
      "datasource": {
        "type": "influxdb",
        "uid": "P5697886F9CA74929"
      },
      "hide": false,
      "query": query,
      "refId": i.toString()
    }
    targets.push(target);
    i++;
  }
  return { "targets": targets };
}

const writeJsonFile = (file, content) => {
  let jsonData = JSON.stringify(content, null, 2);
  fs.writeFileSync(file, jsonData)
}

const main = async () => {
  const yamlRequests = prepareGetRequests(YAML_URLS);
  const dbParams = await fetchParams(yamlRequests, YAML_LAYERS);
  await getRangeValues(dbParams);
  const queries = generateQueries(dbParams);
  const targets = buildTargets(queries);
  const timeSeriesPanels = [];
  let i = 0;
  let j = 0;
  let y = 0;
  let id = 2;
  let previousLabels = [];
  for (const target of targets.targets) {
    if (previousLabels.includes(metricLabels[j])) {
      j++;
      continue;
    }
    const panel = JSON.parse(JSON.stringify(timeSeriesPanelTemplate));
    panel.targets = [];
    panel.targets.push(target);
    panel.id = id;
    id++;
    if (i % 2 === 0) {
      panel.gridPos.x = 12;
      panel.gridPos.y = y;
    }
    else {
      panel.gridPos.x = 0;
      y += 12;
      panel.gridPos.y = y;
    }
    panel.title = metricLabels[j];
    timeSeriesPanels.push(panel);
    previousLabels.push(metricLabels[j]);
    i++;
    j++;
  }
  writeJsonFile('timeSeries.json', timeSeriesPanels);
  writeJsonFile('targets.json', targets);
}

main();