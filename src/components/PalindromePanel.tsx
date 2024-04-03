import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { config } from "@grafana/runtime";
import palindrome, { devPalindrome } from '../../node_modules/palindrome/src/index.js'
interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [ds, setDs] = useState<any>({});
  const canvasRef = useRef<any>(null);

  let dataStructure = {} as any;
  let configuration = {} as any;

  useEffect(() => {
    let i = 0;
    if (data.series.length > 0) {
      for (const serie of data.series) {
        let executedQueryString = serie.meta?.executedQueryString;
        if (!serie.meta) {
          executedQueryString = (data.request?.targets[i] as any).target;
        }
        const regex = /__metadata__:\s*layer:\s*(.*?),\s*ranges:\s*\[(.*?)\]/;
        const match = executedQueryString?.match(regex);
        const parts = executedQueryString?.split('__metadata__:');
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
    }
    const container = document.createElement('div');
    container.setAttribute('id', 'palindrome');

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
    return () => {
      setTimeout(() => {
        if (canvasRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          canvasRef.current.removeChild(container);
        }
      }, 0);
    };

  }, [data.series, height, width, options.palindromeConfig]);


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

  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 id='info-metrics' style={{ color: 'red' }}>Please choose your metrics from Prometheus data source.</h6>}
      {!(Object.keys(ds).length > 0) && <h6 id='info-query' style={{ color: 'red' }}><b>Query example:</b> node_procs_running #layer: serverMetrics, ranges: [0, 5, 100].</h6>}
      <div ref={canvasRef}></div>
    </>
  );
};
