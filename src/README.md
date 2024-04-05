<h1 align="center">
  Grafana Palindrome.js Panel
</h1>


Visualize Prometheus metrics or other datasources in 3D and in real time with the Grafana Palindrome.js Panel. This panel is based on the [Palindrome.js](https://github.com/Smile-SA/palindrome.js/) library.


<p align="center">
    <a href="https://github.com/Smile-SA/palindrome.js/">
      <img src="https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/Palindrome.js-logo-and-title.jpg" alt="Grafana Palindrome.js Panel" width=350">
    </a>
</p>

![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/dashboard.png).

## 🎯 Usage
This panel should be connected to one of these supported data sources:
- Prometheus
- InfluxDB v2
- Graphite

Once done, you can define layers and metrics using code queries, following this format:

```
<query> <comment-sign>layer: <layerName>, ranges: [<min value>, <med value>, <max value>]
```
**Notes:**
- Palindrome.js metadata should be inside a comment section.
- Comment signs can be `#` or `//`.

**Example for Prometheus data source**:

  ```Promql
  node_disk_io_now{device="nvme0n1"} #layer: systemMetrics, ranges: [0, 50, 100]
  ```

- Once you've finished typing queries, click on Run queries, and the 3D object will appear. 

**Example for InfluxDB v2 data source**:

```Flux
from(bucket: "Palindrome.js")
  |> range(start:-1m)
  |> filter(fn: (r) => r["_measurement"] == "cpu")
  |> filter(fn: (r) => r["_field"] == "usage_system")
  |> filter(fn: (r) => r["cpu"] == "cpu0")
  //layer: Container Metrics, ranges: [0, 3, 10]
```

**Example for Graphite data source**:
```
carbon.agents.*-a.pointsPerUpdate #layer: layer2, ranges: [0, 1, 3]
```


After setting up queries, two fields will be populated: `Palindrome Data Structure` and `Palindrome Configuration`:

  - **Palindrome Data Structure:** This is the data structure of Palindrome.js based on the metrics entered by the user. It is a read-only text area (editable through query comments).

  - **Palindrome Configuration:** This field displays the current configuration used to display the 3D object. It is editable. For more information, please refer to our [API reference](https://github.com/Smile-SA/palindrome.js/wiki/API-Reference).



## ⚡ Realtime Palindrome.js (speeded up)
![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/realtime.gif)


## 📺 Creation demo

![Palindrome.js integration in Grafana demo](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/demo.gif)


Palindrome.js is also available in a light theme version.

![Palindrome.js light](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/light-panel.png).