import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme } from '@grafana/ui';


const palindrome = require('../palindrome/palindrome.js');
interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [isWellStructured, setIsWellStructured] = useState(true);
  const [ds, setDs] = useState({});
  const theme = useTheme();

  let dataStructure = {} as any;
  let configuration = {} as any;
  useEffect(() => {
    setIsWellStructured(true);
    console.log(data.request?.targets)
    if (data.series.length > 0) {
      for (const serie of data.series) {
        const executedQueryString = serie.meta?.executedQueryString;
        const regex = /#layer:\s*(.*?),\s*ranges:\s*\[(.*?)\]/;
        const match = executedQueryString?.match(regex);
        const parts = executedQueryString?.split('#');
        const metricName = parts![0].trim().replace('Expr: ', '') || '';
        let layerName, ranges;
        if (!match) {
          layerName = 'Untitled';
        }
        else {
          layerName = match![1];
          ranges = match![2].split(',').map(Number);
        }
        if (!layerName || !ranges) {
          setIsWellStructured(false);
          break;
        }
        for (const field of serie.fields) {
          if (field.name !== 'Time') {
            const unit = "";
            const value = field?.values[field?.values.length - 1];
            const [min, med, max] = ranges;
            console.log({ layerName, ranges, value, metricName })
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
      }
      if ((document.getElementById('readOnlyDs') as HTMLInputElement)) {
        (document.getElementById('readOnlyDs') as HTMLInputElement).value = JSON.stringify(dataStructure, null, 2);
      }
      setDs(dataStructure);
    }
    if (Object.keys(dataStructure).length > 0) {
      configuration = palindrome.devPalindrome();
      const configDeepCopied = JSON.parse(JSON.stringify(configuration));
      delete configDeepCopied.data;
      setPalindromeConfig(JSON.stringify(configDeepCopied, null, 2));
    }


  }, [data.series]);

  const { palindromeConfig } = options;

  const setPalindromeConfig = (refId: string) => {
    onOptionsChange({
      ...options,
      palindromeConfig: refId,
    });
  };

  const applyCustomConfig = (configuration: any) => {
    for (const [key, value] of Object.entries(JSON.parse(palindromeConfig))) {
      configuration[key] = value;
    }
  }

  const appendContainerToBody = (palindromeBody: any, container: any) => {
    if (palindromeBody?.children.length === 0) {
      palindromeBody?.appendChild(container);
    }
    else {
      palindromeBody?.removeChild(palindromeBody.firstElementChild);
      palindromeBody?.appendChild(container);
    }
  }

  // const configuration = palindrome.devPalindrome();
  if (palindromeConfig?.length > 0) {
    applyCustomConfig(configuration)
  }
  //const configDeepCopied = JSON.parse(JSON.stringify(configuration));
  //delete configDeepCopied.data;
  // setPalindromeConfig(JSON.stringify(configuration, null, 2));

  configuration.innerHeight = document.getElementById('palindromeBody')?.clientHeight;
  configuration.innerWidth = document.getElementById('palindromeBody')?.clientWidth;
  configuration.grafanaZoom = 2;

  const palindromeBody = document.getElementById('palindromeBody');
  configuration.data = ds;
  configuration.displayGrid = false;
  if (theme.name === 'Dark') {
    configuration.isDarkGrafana = true;
    configuration.grafanaColor = theme.colors.bg1;
    configuration.frameLineColor = "#FFFFFF";
    configuration.metricsLabelsColor = "#ccccdc";
  }

  configuration.colorsBehavior = 'ranges';
  const container = document.createElement('div');
  palindrome.default(container, { ...configuration });

  if (isWellStructured) {
    setTimeout(() => {
      appendContainerToBody(palindromeBody, container);
    }, 0);
  }

  const elements = document.getElementsByClassName('palindromeContainer');
  if (elements.length === 2) {
    window.location.reload();
  }

  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      <body id="palindromeBody" className="palindromeContainer" style={{ position: "absolute" }}></body>
    </>
  );
};
