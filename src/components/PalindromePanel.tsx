import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme } from '@grafana/ui';


const palindrome = require('../palindrome/palindrome.js');
interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const [isWellStructured, setIsWellStructured] = useState(true);
  const [ds, setDs] = useState({});
  const theme = useTheme();

  let dataStructure = {} as any;
  useEffect(() => {
    setIsWellStructured(true);
    if (data.series.length > 0) {
      for (const serie of data.series) {
        const executedQueryString = serie.meta?.executedQueryString;
        const commentRegex = /#\s*(\w+)/;
        const match = executedQueryString?.match(commentRegex);
        let layerName;
        if (!match) {
          layerName = 'Untitled';
        }
        else {
          layerName = match![1];
        }
        if (!layerName) {
          setIsWellStructured(false);
          break;
        }
        for (const field of serie.fields) {
          if (field.name !== 'Time') {
            const level = field?.labels?.level;
            const unit = field?.labels?.unit;
            if (!level) {
              setIsWellStructured(false);
              break;
            }
            const value = field?.values[field?.values.length - 1];
            const name = field?.name;
            if (!dataStructure[layerName]) {
              dataStructure[layerName] = {};
            }
            if (!dataStructure[layerName]['metrics']) {
              dataStructure[layerName]['metrics'] = {};
            }
            if (!dataStructure[layerName]['metrics'][field.name]) {
              dataStructure[layerName]['metrics'][field.name] = {};
            }

            dataStructure[layerName]['metrics'][field.name]['label'] = name;
            dataStructure[layerName]['metrics'][field.name][level] = value;
            dataStructure[layerName]['metrics'][field.name]['unit'] = unit;
            dataStructure[layerName]["layer"] = {};
            dataStructure[layerName]["layer"][`${layerName}-layer`] = {};
            dataStructure[layerName]["layer"][`${layerName}-layer`]['label'] = layerName;
          }
        }
      }
      setDs(dataStructure);
    }
  }, [data.series]);

  const appendContainerToBody = (palindromeBody: any, container: any) => {
    if (palindromeBody?.children.length === 0) {
      palindromeBody?.appendChild(container);
    }
    else {
      palindromeBody?.removeChild(palindromeBody.firstElementChild);
      palindromeBody?.appendChild(container);
    }
  }

  const configuration = palindrome.devPalindrome();

  configuration.innerHeight = document.getElementById('palindromeBody')?.clientHeight;
  configuration.innerWidth = document.getElementById('palindromeBody')?.clientWidth;
  configuration.grafanaZoom = 5;

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
      {!isWellStructured && <h6 style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      <body id="palindromeBody" className="palindromeContainer" style={{ position: "absolute" }}></body>
    </>
  );
};
