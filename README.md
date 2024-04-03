<h1 align="center">
  Grafana Palindrome.js Panel
</h1>

Visualize your time series database metrics in 3D and in real time with the Grafana Palindrome.js Panel. This panel is based on the is based on the [Palindrome.js](https://github.com/Smile-SA/palindrome.js/) library.

> Palindrome.js is a three.js based library which provides 3D monitoring for system metrics and KPIs. Presented as metrics sets within layers, Palindrome.js helps to easily identify relations between metrics, indicators, behaviors or trends for your realtime systems or any other data source. Custom algorithms, visual behaviors, styles and color schemes can easily be modified or added.


<p align="center">
    <a href="https://github.com/Smile-SA/palindrome.js/">
      <img src="https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/Palindrome.js-logo-and-title.jpg" alt="Grafana Palindrome.js Panel" width=350">
    </a>
</p>

## ⚙️ Getting started

### Install dependencies and build the project

   ```bash
   docker build -t palindrome-builder .
   docker run -v ./dist:/dist palindrome-builder
   ```

### Run the plugin

   ```bash
   docker compose up
   ```
   - Project should be up and running on: http://localhost:3000.
   - On the main dashboard you should be able to see three Palindrome.js panels with InfluxDB, Prometheus, and Graphite data sources.

### Run the E2E tests (using Cypress)

   ```bash
   # Spins up a Grafana instance first that we tests against
   docker compose up

   # Starts the tests
   npm run e2e
   ```

### Run the linter

   ```bash
   npm run lint

   # or

   npm run lint:fix
   ```

## 🎯 Features and usage
Actually, Palindrome.js is composed of layers defined by the user. Each layer can contain from 1 to 5 metrics. Each metric is presented by minimum, median, and maximum values, which are entered by the user, along with the current value obtained from the time series database. Based on the current value compared to the other values, the shape and color state of the 3D model will change. For further details, please refer to the Palindrome.js [documentation](https://github.com/Smile-SA/palindrome.js/wiki).

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

![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/dashboard.png)

Palindrome.js is also available in a light theme version.

![Palindrome.js light](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/light-panel.png)

## ⚡ Realtime Palindrome.js
![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/realtime.gif)

## 📺 Creation demo
![Palindrome.js integration in Grafana demo](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/demo.gif)

## 💡 Credits
- Rnd Team @ SMILE

## 📜 License

This project is licensed under [Apache2.0](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/LICENSE).
