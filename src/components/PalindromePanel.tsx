import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { config } from "@grafana/runtime";
import palindrome, { devPalindrome } from '@smile/palindrome.js/src/index.js';
import axios from 'axios';
import YAML from 'yaml';
import convert from 'xml-js';

interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [ds, setDs] = useState<any>({});
  const canvasRef = useRef<any>(null);
  let dataStructure = {} as any;
  let configuration = {} as any;
  const container = document.createElement('div');
  container.setAttribute('id', 'palindrome');

  const getFileUrlsFromDataSource = (data: any) => {
    const yamlUrls = [];
    const jsonUrls = [];
    const jsonLayerNames = [];
    const yamlLayerNames = [];
    for (const serie of data.series) {
      for (const field of serie.fields) {
        if (field.values && field.values.length > 0 && field.values[0] !== '') {
          if (field.name === 'yaml_file_url') {
            yamlUrls.push(field.values[0]);
            yamlLayerNames.push(serie?.name ?? 'untitled');
          }
          else if (field.name === 'json_file_url') {
            jsonUrls.push(field.values[0]);
            jsonLayerNames.push(serie?.name ?? 'untitled')
          }
        }
      }
    }
    return { yamlUrls, jsonUrls, jsonLayerNames, yamlLayerNames };
  }

  const prepareGetRequests = (urls: any) => {
    const requests = [];
    for (const url of urls) {
      requests.push(axios.get(url));
    }
    return requests;
  }

  const prepareXmlRequestsFromYaml = async (yamlRequests: any, yamlLayerNames: any) => {
    const yamlFiles = await Promise.allSettled(yamlRequests);
    const xmlLayerNames = [];
    const xmlRequests = [];
    const xmlUrlBase = 'https://gitlab.eclipse.org/eclipse-research-labs/nephele-project/vo-lwm2m/-/raw/main/vo/src/main/resources/models/';
    let i = 0;
    for (const yamlFile of yamlFiles) {
      const jsonFromYamlFile = YAML.parse(((yamlFile as any)?.value?.data) as any);
      for (const objectLink of jsonFromYamlFile.vo.objectLinks) {
        const xmlFileName = objectLink.split('/')[0] + '.xml';
        xmlRequests.push(axios.get(xmlUrlBase + xmlFileName));
        xmlLayerNames.push(yamlLayerNames[i]);
      }
      i++;
    }
    return { xmlRequests, xmlLayerNames };
  }

  const fetchData = async (requests: any, type: any, yamlLayerNames: any) => {
    if (type === 'yaml') {
      const { xmlRequests, xmlLayerNames } = await prepareXmlRequestsFromYaml(requests, yamlLayerNames);
      const data = (await Promise.allSettled(xmlRequests)).map(item => {
        return (item as any)?.value?.data;
      });
      return { data, xmlLayerNames };
    }

    const data = (await Promise.allSettled(requests)).map(item => {
      return (item as any)?.value?.data;
    });
    return data;
  }

  const convertXmlDataToJson = (xmlData: any) => {
    const jsonData = [];
    for (const xml of xmlData) {
      jsonData.push(JSON.parse(convert.xml2json(xml, { compact: true })));
    }
    return jsonData;
  }

  const buildXmlDataStructure = async (yamlRequests: any, yamlLayerNames: any) => {
    const result = await fetchData(yamlRequests, 'yaml', yamlLayerNames);
    const xmlLayerNames = (result as any).xmlLayerNames;
    const data = convertXmlDataToJson((result as any).data);

    const xmlDataStructure: any = {};
    let i = 0;
    for (const pieceOfData of data) {
      const layerName = xmlLayerNames[i];
      const metricName = pieceOfData.LWM2M.Object.Name._text;
      if (!xmlDataStructure[layerName]) {
        xmlDataStructure[layerName] = {};
      }
      if (!xmlDataStructure[layerName]['metrics']) {
        xmlDataStructure[layerName]['metrics'] = {};
      }
      if (!xmlDataStructure[layerName]['metrics'][metricName]) {
        xmlDataStructure[layerName]['metrics'][metricName] = {};
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

      const minValue = Math.floor(Math.random() * 100); // Random number between 0 and 99
      const maxValue = Math.floor(Math.random() * (100 - minValue)) + minValue + 1; // Random number between min+1 and 100
      const currentValue = Math.floor(Math.random() * (maxValue - minValue - 1)) + minValue + 1; // Random number between min+1 and max-1
      const medValue = (minValue + maxValue) / 2;
      const unitValue = 'unit';

      xmlDataStructure[layerName]['metrics'][metricName]['label'] = metricName;
      xmlDataStructure[layerName]['metrics'][metricName]['object_id'] = objectId;
      xmlDataStructure[layerName]['metrics'][metricName]['min'] = minValue;
      xmlDataStructure[layerName]['metrics'][metricName]['min_db_data'] = min;
      xmlDataStructure[layerName]['metrics'][metricName]['max'] = maxValue;
      xmlDataStructure[layerName]['metrics'][metricName]['max_db_data'] = max;
      xmlDataStructure[layerName]['metrics'][metricName]['med'] = medValue;
      xmlDataStructure[layerName]['metrics'][metricName]['med_db_data'] = med;
      xmlDataStructure[layerName]['metrics'][metricName]['current'] = currentValue;
      xmlDataStructure[layerName]['metrics'][metricName]['current_db_data'] = current;
      xmlDataStructure[layerName]['metrics'][metricName]['unit'] = unitValue;
      xmlDataStructure[layerName]['metrics'][metricName]['unit_db_data'] = unit;
      xmlDataStructure[layerName]["layer"] = {};
      xmlDataStructure[layerName]["layer"][`${layerName}-layer`] = {};
      xmlDataStructure[layerName]["layer"][`${layerName}-layer`]['label'] = layerName;
      i++;
    }
    return xmlDataStructure;
  }

  const buildJsonDataStructure = async (jsonRequests: any, jsonLayerNames: any) => {
    const data = await fetchData(jsonRequests, 'json', null);
    const jsonDataStructure: any = {};
    let i = 0;
    for (const pieceOfData of data as any) {
      const layerName = jsonLayerNames[i];
      const properties = pieceOfData.properties;
      const entries = Object.entries(properties);
      for (const [key, value] of entries) {
        let property: any = value;
        if (property.type === 'object') {
          entries.push(...Object.entries(property.properties))
        }
        if (property.type === 'integer' || property.type === 'double' || property.type === 'unsignedInt') {

          const metricName = key;
          if (!jsonDataStructure[layerName]) {
            jsonDataStructure[layerName] = {};
          }
          if (!jsonDataStructure[layerName]['metrics']) {
            jsonDataStructure[layerName]['metrics'] = {};
          }
          if (!jsonDataStructure[layerName]['metrics'][metricName]) {
            jsonDataStructure[layerName]['metrics'][metricName] = {};
          }

          const minValue = property.minimum ?? Math.floor(Math.random() * 100);
          const maxValue = property.maximum ?? Math.floor(Math.random() * (100 - minValue)) + minValue + 1;
          const currentValue = Math.floor(Math.random() * (maxValue - minValue - 1)) + minValue + 1;
          const medValue = (minValue + maxValue) / 2;
          const unitValue = 'unit';

          jsonDataStructure[layerName]['metrics'][metricName]['label'] = metricName;
          jsonDataStructure[layerName]['metrics'][metricName]['min'] = minValue;
          jsonDataStructure[layerName]['metrics'][metricName]['max'] = maxValue;
          jsonDataStructure[layerName]['metrics'][metricName]['med'] = medValue;
          jsonDataStructure[layerName]['metrics'][metricName]['current'] = currentValue;
          jsonDataStructure[layerName]['metrics'][metricName]['unit'] = unitValue;
          jsonDataStructure[layerName]["layer"] = {};
          jsonDataStructure[layerName]["layer"][`${layerName}-layer`] = {};
          jsonDataStructure[layerName]["layer"][`${layerName}-layer`]['label'] = layerName;
        }

      }

      i++;
    }

    return jsonDataStructure;
  }

  const buildFinalDataStructure = async (yamlRequests: any, yamlLayerNames: any, jsonRequests: any, jsonLayerNames: any) => {
    const xmlDataStructure = await buildXmlDataStructure(yamlRequests, yamlLayerNames);
    const jsonDataStructure = await buildJsonDataStructure(jsonRequests, jsonLayerNames);
    const finalDataStructure = { ...xmlDataStructure, ...jsonDataStructure };
    return finalDataStructure;
  }

  const initPalindrome = (dataStructure: any, container: any) => {
    if (Object.keys(dataStructure).length >= 0) {
      setDs(dataStructure);

      const { palindromeConfig } = options;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      configuration = devPalindrome(true);

      if (palindromeConfig?.length > 0) {
        configuration = applyCustomConfig(palindromeConfig, configuration);
      }

      configuration.data = dataStructure;
      configuration.displayGrid = false;
      configuration.isGrafana = true;
      configuration.innerHeight = height;
      configuration.innerWidth = width;
      configuration.grafanaZoom = 1.5;

      if (config.theme2.isDark) {
        configuration.isDarkGrafana = true;
        configuration.grafanaColor = config.theme2.colors.background.primary;
        configuration.frameLineColor = "#FFFFFF";
        configuration.metricsLabelsColor = "#ccccdc";
      }
      else {
        delete configuration.isDarkGrafana;
        delete configuration.grafanaColor;
        configuration.frameLineColor = "#000000";
        delete configuration.metricsLabelsColor;
      }

      const configDeepCopied = JSON.parse(JSON.stringify(configuration));
      delete configDeepCopied.data;

      setPalindromeConfig(JSON.stringify(configDeepCopied, null, 2));
      configuration.keepControls = true;
      configuration.panelId = data.request?.panelId;
      palindrome(container, { ...configuration });

      setTimeout(() => {
        if (canvasRef.current) {
          if (canvasRef.current.children.length > 0) {
            for (let i = 0; i < canvasRef.current.children.length; i++) {
              canvasRef.current.removeChild(canvasRef.current.children[i]);
            }
          }
          canvasRef.current.appendChild(container);
        }
      }, 0);
    }
  }

  const setDataStructureInput = (dataStructure: any) => {
    if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
      (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(dataStructure, null, 2);
    }
  }

  const setPalindromeConfig = (refId: string) => {
    onOptionsChange({
      ...options,
      palindromeConfig: refId,
    });
  };

  const applyCustomConfig = (configurationInput: any, configurationOutput: any) => {
    const parsedJson = JSON.parse(configurationInput);
    for (const [key, value] of Object.entries(parsedJson)) {
      configurationOutput[key] = value;
    }
    return configurationOutput;
  }

  useEffect(() => {
    if (data.request?.targets[0].datasource?.type === "marcusolsson-static-datasource") {
      const { yamlUrls, jsonUrls, jsonLayerNames, yamlLayerNames } = getFileUrlsFromDataSource(data);
      const jsonRequests = prepareGetRequests(jsonUrls);
      const yamlRequests = prepareGetRequests(yamlUrls);
      buildFinalDataStructure(yamlRequests, yamlLayerNames, jsonRequests, jsonLayerNames).then((dataStructure) => {
        initPalindrome(dataStructure, container);
        setDataStructureInput(dataStructure);
      });
    }
    else {
      let i = 0;
      if (data.series.length > 0) {
        for (const serie of data.series) {
          let executedQueryString = serie.meta?.executedQueryString;
          if (!serie.meta) {
            executedQueryString = (data.request?.targets[i] as any).target;
          }
          const regex = /(?:#|\/\/)layer:\s*(.*?),\s*ranges:\s*\[(.*?)\]/;
          const match = executedQueryString?.match(regex);
          const parts = executedQueryString?.split(/#|\/\//);
          let metricName = parts![0].trim().replace('Expr: ', '') || '';
          let layerName, ranges;
          if (!match) {
            layerName = 'Untitled';
          }
          else {
            layerName = match![1];
            ranges = match![2].split(',').map(Number);
          }
          if (!layerName || !ranges) {
            break;
          }
          for (const field of serie.fields) {
            if (field.name !== 'Time') {
              const unit = "";
              const value = field?.values[field?.values.length - 1] ?? field?.values[field?.values.length - 2];
              if (field.name !== "Value") {
                metricName = serie.name ? serie.name + ' - ' + (field.labels ? (Object.values(field.labels)[0] ? Object.values(field.labels)[0] : field.name) : field.name) : field.name;
              }
              const [min, med, max] = ranges;
              if (!dataStructure[layerName]) {
                dataStructure[layerName] = {};
              }
              if (!dataStructure[layerName]['metrics']) {
                dataStructure[layerName]['metrics'] = {};
              }
              if (!dataStructure[layerName]['metrics'][metricName]) {
                dataStructure[layerName]['metrics'][metricName] = {};
              }

              dataStructure[layerName]['metrics'][metricName]['label'] = metricName;
              dataStructure[layerName]['metrics'][metricName]['min'] = min;
              dataStructure[layerName]['metrics'][metricName]['med'] = med;
              dataStructure[layerName]['metrics'][metricName]['max'] = max;
              dataStructure[layerName]['metrics'][metricName]['current'] = value;
              dataStructure[layerName]['metrics'][metricName]['unit'] = unit;
              dataStructure[layerName]["layer"] = {};
              dataStructure[layerName]["layer"][`${layerName}-layer`] = {};
              dataStructure[layerName]["layer"][`${layerName}-layer`]['label'] = layerName;
            }
          }
          i++;
        }
        setDataStructureInput(dataStructure);
      }
      initPalindrome(dataStructure, container);
    }

    return () => {
      setTimeout(() => {
        if (canvasRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          canvasRef.current.removeChild(container);
        }
      }, 0);
    };

  }, [data.series, height, width, options.palindromeConfig]);

  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 id='info-metrics' style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      {!(Object.keys(ds).length > 0) && <h6 id='info-query' style={{ color: 'red' }}><b>Query example:</b> node_procs_running #layer: serverMetrics, ranges: [0, 5, 100].</h6>}
      <div ref={canvasRef}></div>
    </>
  );
};
