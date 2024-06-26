import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { config } from "@grafana/runtime";
import palindrome, { devPalindrome } from '@smile/palindrome.js/src/index.js';

interface Props extends PanelProps<SimpleOptions> { }

export const PalindromePanel: React.FC<Props> = ({ options, data, width, height, onOptionsChange }) => {
  const [ds, setDs] = useState<any>({});
  const containerRef = useRef<any>(null);
  const renderingLoop = useRef<any>(null);
  const zoomMessageRef = useRef<any>(null);
  const dataStructureHistory = useRef<any>(null);

  let dataStructure = {} as any;
  let configuration = {} as any;

  /**
   * Builds Palindrome data structure
   * @param data panel data
   * @param dataStructure data structure object to build
   */
  const buildDataStructure = (data: any, dataStructure: any) => {
    let i = 0;
    for (const serie of data.series) {
      let executedQueryString = serie.meta?.executedQueryString;

      if (!serie.meta) {
        executedQueryString = (data.request?.targets[i] as any).target;
      }

      const regex = /(?:#|\/\/)(?:label:\s*(.*?),\s*)?layer:\s*(.*?),\s*ranges:\s*\[(.*?)\]/;
      const match = executedQueryString?.match(regex);
      const parts = executedQueryString?.split(/#|\/\//);      
      let metricName, layerName, ranges;
      
      if (parts) {
        metricName = parts![0].trim().replace('Expr: ', '') || '';
      }

      if (!match) {
        layerName = 'Untitled';
      }
      else {
        layerName = match![2];
        ranges = match![3].split(',').map(Number);
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

          metricName = match[1] ?? metricName;

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
  };

  /**
   * Adds additional properties to the configuration
   * @param configuration Palindrome configuration
   */
  const customizeConfiguration = (configuration: any) => {
    configuration.data = dataStructure;
    configuration.displayGrid = false;
    configuration.isGrafana = true;

    const zoomMessageHeight = zoomMessageRef.current?.offsetHeight;
    configuration.innerHeight = height - (zoomMessageHeight ?? 0);
    configuration.innerWidth = width;
    configuration.grafanaZoom = 1.5;
    configuration.disableZoom = true;
    configuration.keepControls = true;
    configuration.panelId = data.request?.panelId;

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
  };

  /**
   * Applies configuration from options to the real Palindrome configuration
   * @param configurationInput configuration from options
   * @param configurationOutput Palindrome configuration
   * @returns 
   */
  const applyCustomConfig = (configurationInput: any, configurationOutput: any) => {
    const parsedJson = JSON.parse(configurationInput);
    for (const [key, value] of Object.entries(parsedJson)) {
      configurationOutput[key] = value;
    }
    return configurationOutput;
  }

  /**
   * Checks if meta layers and metrics per layers are the same
   * @param oldDs the old data structure
   * @param newDs the new data structure
   * @returns {Boolean}
   */

  const isMetaDataChanged = (oldDs: any, newDs: any) => {
    if (!oldDs || !newDs) {
      return false;
    }

    const oldLayers = Object.keys(oldDs).sort();
    const newLayers = Object.keys(newDs).sort();
    
    // Checking if layers are the same
    if (oldLayers.length !== newLayers.length){
      return true;
    }

    const isSameLayers = oldLayers.every((value, index) => value === newLayers[index]);
    if (!isSameLayers) {
      return true;
    }

    // Checking if metrics per layer are the same
    return !oldLayers.every(oldLayer => {
      const oldMetrics = Object.keys(oldDs[oldLayer].metrics).sort();
      const newMetrics = Object.keys(newDs[oldLayer].metrics).sort();
      return oldMetrics.length === newMetrics.length && oldMetrics.every((value, index) => value === newMetrics[index]);
    });

  }

  useEffect(() => {
    let hasMetaDataChanged = false;
    if (data.series.length > 0) {
      buildDataStructure(data, dataStructure);
      hasMetaDataChanged = isMetaDataChanged(dataStructure, dataStructureHistory.current);
      dataStructureHistory.current = dataStructure;
    }

    if (Object.keys(dataStructure).length > 0) {
      setDs(dataStructure);
      const { palindromeConfig } = options;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      configuration = devPalindrome(true);
      if (palindromeConfig?.length > 0) {
        configuration = applyCustomConfig(palindromeConfig, configuration);
      }
      customizeConfiguration(configuration);
      const configDeepCopied = JSON.parse(JSON.stringify(configuration));
      delete configDeepCopied.data;

      onOptionsChange({
        ...options,
        palindromeConfig: JSON.stringify(configDeepCopied, null, 2),
        palindromeDs: JSON.stringify(dataStructure, null, 2),
      });

      if (containerRef.current) {
        if (hasMetaDataChanged === true || containerRef.current.children.length === 0) {
          // rendering
          const renderingLoopFn = palindrome(containerRef.current, { ...configuration });
          renderingLoop.current = renderingLoopFn;
        }
        else {
          // updating data
          renderingLoop.current.updateGrafanaData({ ...configuration });
        }
      }
    }
  }, [data.series, height, width, options.palindromeConfig]);

  return (
    <>
      {!(Object.keys(ds).length > 0) && <h6 id='info-metrics' style={{ color: config.theme2.colors.error.main }}>Please choose your metrics from Prometheus data source.</h6>}
      {!(Object.keys(ds).length > 0) && <h6 id='info-query' style={{ color: config.theme2.colors.error.main }}><b>Query example:</b> node_procs_running #layer: serverMetrics, ranges: [0, 5, 100].</h6>}
      {(Object.keys(ds).length > 0) && <div ref={zoomMessageRef} style={{ color: config.theme2.colors.info.main }}> Please press Ctrl + scroll to zoom in and out.</div>}
      {(Object.keys(ds).length > 0) && <div ref={containerRef}></div>}
    </>
  );
};
