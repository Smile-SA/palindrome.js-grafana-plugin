import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { config } from "@grafana/runtime";
import palindrome, { devPalindrome } from '@smile/palindrome.js/src/index.js';
import axios from 'axios';
import convert from 'xml-js';


interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [ds, setDs] = useState<any>({});
  const [xmlDs, setXmlDs] = useState<any>({});
  const [responses, setResponses] = useState<any>([]);
  const [layerNames, setLayerNames] = useState<any>([]);
  const [refresh, setRefresh] = useState<any>(false);
  const canvasRef = useRef<any>(null);

  let dataStructure = {} as any;
  let xmlDataStructure = {} as any;
  let configuration = {} as any;

  useEffect(() => {   
    const fetchData = async (requests: any) => {
      const responses = await Promise.all(requests);
      setResponses(responses);
      setXmlDs({});
    }

    let i = 0;
    if (data.series.length > 0) {
      for (const serie of data.series) {
        if (!serie.meta?.executedQueryString) {
          // static data source
          let urls = [];
          for (const field of serie.fields) {
            if (field.name === 'xml_metric_url') {
              urls = field.values;
            }
          }
          
          let requests = [];
          let layerNames = [];
          for(const url of urls) {
            requests.push(axios.get(url));
            layerNames.push(serie?.name ?? 'untitled')
          }

          setLayerNames(layerNames);
          fetchData(requests);
        }
        else {
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
      }
      if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
        (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(dataStructure, null, 2);
      }
    }
    const container = document.createElement('div');
    container.setAttribute('id', 'palindrome');

    if (Object.keys(xmlDs).length > 0) {
      drawPalindrome(xmlDs, container);
      if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
        (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(xmlDs, null, 2);
      }
    }
    else {
      drawPalindrome(dataStructure, container);
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
  }, [data.series, height, width, options.palindromeConfig, refresh]);


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
    for(const response of responses) {
      const { data } = response;
      jsonResponses.push(JSON.parse(convert.xml2json(data, { compact: true })));

    }
    return jsonResponses;
  };

  const builDataStructureFromXMLData = (responses: any) => {
    console.log("setting up xmlDs...")
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
        id:'',
        name:'Sensor Value'
      }
      const min = {
        id:'',
        name:'Min Range Value'
      }
      const max = {
        id:'',
        name:'Max Range Value'
      }
      const med = {
        id:'not handled => (min+max)/2',
        name:'not handled => (min+max)/2'
      };

      const unit = {
        id: '',
        name: 'Sensor Units'
      };

      for (const r of resources) {
        if(r.Name._text === current.name) {
          current.id = r._attributes.ID;
        }
        if(r.Name._text === min.name) {
          min.id = r._attributes.ID;
        }
        if(r.Name._text === max.name) {
          max.id = r._attributes.ID;
        }
        if(r.Name._text === unit.name) {
          unit.id = r._attributes.ID;
        }

      }

      const minValue = 10;
      const maxValue = 100;
      const currentValue = 50;
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

  if (responses.length > 0 && Object.keys(xmlDs).length === 0) {
    // axios.get("https://reqres.in/api/products/3").then(res => {
    //   console.log(res.data);
    //   const xmlDataStructure = builDataStructureFromXMLData(responses);
    //   setXmlDs(xmlDataStructure);
    //   setRefresh(true);
    // });
      const xmlDataStructure = builDataStructureFromXMLData(responses);
      setXmlDs(xmlDataStructure);
      setRefresh(true);
  }


  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 id='info-metrics' style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      {!(Object.keys(ds).length > 0) && <h6 id='info-query' style={{ color: 'red' }}><b>Query example:</b> node_procs_running #layer: serverMetrics, ranges: [0, 5, 100].</h6>}
      <div ref={canvasRef}></div>
    </>
  );
};
