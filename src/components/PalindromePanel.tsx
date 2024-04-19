import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { config } from "@grafana/runtime";
import palindrome, { devPalindrome } from '@smile/palindrome.js/src/index.js';
import axios from 'axios';
import convert from 'xml-js';
import YAML from 'yaml';

interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [ds, setDs] = useState<any>({});
  const [xmlDs, setXmlDs] = useState<any>({});
  const [responses, setResponses] = useState<any>([]);
  const [layerNames, setLayerNames] = useState<any>([]);
  const [yamlUrls, setYamlUrls] = useState<any>([]);
  const canvasRef = useRef<any>(null);

  let dataStructure = {} as any;
  let xmlDataStructure = {} as any;
  let configuration = {} as any;

  useEffect(() => {
    // console.log("Use Effect called")
    const container = document.createElement('div');
    container.setAttribute('id', 'palindrome');
    
    // static data source logic
    if (data.request?.targets[0].datasource?.type === "marcusolsson-static-datasource") {
      
      const fetchData = async (urls: any, layerLabels: any) => {
        const ymlFiles = [];
        for (const url of urls) {
          ymlFiles.push((await axios.get(url)).data);
        }
  
        let i = 0;
        const allLayers = [];
        const allRes = [];
        for (const ymlData of ymlFiles) {
          const jsonFromYaml = YAML.parse(ymlData);
          let requests = [];
          const layers = [];
          for (const urlPart of jsonFromYaml.vo.objectLinks) {
            layers.push(layerLabels[i] ?? 'untitled');
            requests.push(axios.get('https://gitlab.eclipse.org/eclipse-research-labs/nephele-project/vo-lwm2m/-/raw/main/vo/src/main/resources/models/' + urlPart.split('/')[0] + '.xml'));
          }
          i++;
          let unsuccessful = 0;
          const responsePromises = await Promise.allSettled(requests);
          for (const r of responsePromises) {
            if (r.status !== 'fulfilled') {
              unsuccessful++;
            }
          }
          const res = responsePromises.filter(result => result.status === 'fulfilled' && result.value.status !== 404)
            .map((result, index) => {
              if (result.status === 'fulfilled') {
                const axiosResponse = result.value;
                if (axiosResponse.status !== 404) {
                  return axiosResponse;
                }
              }
              return null;
            }).filter(Boolean);
            if (unsuccessful > 0){
              layers.splice(-1 * unsuccessful);
            }
          allLayers.push(...layers);
          allRes.push(...res);
        }
        setResponses(allRes);
        setLayerNames(allLayers);
      }

      const yamls = [];
      const layers = [];
      for (const serie of data.series) {
        // static data source
        let urls = [];
        for (const field of serie.fields) {
          if (field.name === 'yaml_file_url') {
            urls = field.values;
          }
        }
        if (urls && urls.length > 0 && urls[0] !== '') {
          yamls.push(urls[0]);
        }
        layers.push(serie?.name);
      }
      
      setYamlUrls(yamls);
      fetchData(yamls, layers);
      const savedDs = JSON.parse(localStorage.getItem('xmlDataStructure') ?? '{}');
      drawPalindrome(savedDs, container);
      
      if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
        (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(savedDs, null, 2);
      }
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
  
        if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
          (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(dataStructure, null, 2);
        }
        drawPalindrome(dataStructure, container);      
      }
    }
    return () => {
      setTimeout(() => {
        if (canvasRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          canvasRef.current.removeChild(container);
        }
      }, 0);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.series, height, width, options.palindromeConfig, xmlDs]);


  const drawPalindrome = (dataStructure: any, container: any) => {
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
          canvasRef.current.appendChild(container);
        }
      }, 0);

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

  const convertXMLResponsesToJSON = (responses: any) => {
    const jsonResponses = [];
    for (const response of responses) {
      const { data } = response;
      jsonResponses.push(JSON.parse(convert.xml2json(data, { compact: true })));

    }
    return jsonResponses;
  };

  const builDataStructureFromXMLData = (responses: any) => {
    const jsonResponses = convertXMLResponsesToJSON(responses);
    let i = 0;
    for (const jsonResponse of jsonResponses) {
      const layerName = layerNames[i];
      const metricName = jsonResponse.LWM2M.Object.Name._text;
      if (!xmlDataStructure[layerName]) {
        xmlDataStructure[layerName] = {};
      }
      if (!xmlDataStructure[layerName]['metrics']) {
        xmlDataStructure[layerName]['metrics'] = {};
      }
      if (!xmlDataStructure[layerName]['metrics'][metricName]) {
        xmlDataStructure[layerName]['metrics'][metricName] = {};
      }
      const objectId = jsonResponse.LWM2M.Object.ObjectID._text;
      const resources = jsonResponse.LWM2M.Object.Resources.Item;

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
    // 
    // console.log(res.data);
    return xmlDataStructure;
  };

  const checkChange = (layerNames: any, yamlUrls: any) => {
    const storedLayerNames = JSON.parse(localStorage.getItem('layerNames') as any);
    const storedYamlUrls = JSON.parse(localStorage.getItem('yamlUrls') as any);
    if (storedYamlUrls === null && storedLayerNames === null) {
      return true;
    }

    if (storedLayerNames.length > 0 && storedYamlUrls.length > 0) {
      if (layerNames.length !== storedLayerNames.length) {
        return true;
      }

      if (yamlUrls.length !== storedYamlUrls.length) {
        return true;
      }

      for (const layer of storedLayerNames) {
        if (!layerNames.includes(layer)) {
          return true;
        }
      }

      for (const yamlUrl of storedYamlUrls) {
        if (!yamlUrls.includes(yamlUrl)) {
          return true;
        }
      }

      return false;
    }
    return null;
  }

  // required for live updates
  if (responses.length > 0) {
    const xmlDataStructure = builDataStructureFromXMLData(responses);
    localStorage.setItem('xmlDataStructure', JSON.stringify(xmlDataStructure));
  }
  
  // required for panel live edit
  if (layerNames.length > 0 && yamlUrls.length > 0 && checkChange(layerNames, yamlUrls)) {
    localStorage.setItem('layerNames', JSON.stringify(layerNames));
    localStorage.setItem('yamlUrls', JSON.stringify(yamlUrls));
    const xmlDataStructure = builDataStructureFromXMLData(responses);
    localStorage.setItem('xmlDataStructure', JSON.stringify(xmlDataStructure));
    setResponses([]);
    setXmlDs(xmlDataStructure);
  }

  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 id='info-metrics' style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      {!(Object.keys(ds).length > 0) && <h6 id='info-query' style={{ color: 'red' }}><b>Query example:</b> node_procs_running #layer: serverMetrics, ranges: [0, 5, 100].</h6>}
      <div ref={canvasRef}></div>
    </>
  );
};
