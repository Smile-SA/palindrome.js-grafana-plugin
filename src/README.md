<h1 align="center">
  Grafana Palindrome.js Panel
</h1>



<p align="center">
Visualize your Prometheus metrics in 3D and in real time with the Grafana Palindrome.js Panel. This panel is based on the <a src='https://github.com/Smile-SA/palindrome.js/'>Palindrome.js</a> library.
</p>


<p align="center">
    <a href="https://github.com/Smile-SA/palindrome.js/">
      <img src="https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/Palindrome.js-logo-and-title.jpg" alt="Grafana Palindrome.js Panel" width=350">
    </a>
</p>

![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/dashboard.png).

## 🎯 Usage
This panel should be connected to a Prometheus data source, enabling you to:

- Define layers and metrics: Select your Prometheus metrics using code queries in the following format:
  ```Promql
  <promql_query> #layer: <layerName>, ranges: [<min value>, <med value>, <max value>]
  ```
  **For example:**
  ```
  node_disk_io_now{device="nvme0n1"} #layer: systemMetrics, ranges: [0, 50, 100]
  ```
- Once you've finished typing queries, click on Run queries, and the 3D object will appear. Additionally, two fields will be populated:` Palindrome Data Structure` and `Palindrome Configuration`:

  - **Palindrome Data Structure:** This is the data structure of Palindrome.js based on the metrics entered by the user. It is a read-only text area.

  - **Palindrome Configuration:** This field displays the current configuration used to display the 3D object. It is editable. For more information, please refer to our [API reference](https://github.com/Smile-SA/palindrome.js/wiki/API-Reference).


## ⚡ Realtime Palindrome.js (speeded up)
![Palindrome.js integration in Grafana](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/realtime.gif)


## 📺 Demo

![Palindrome.js integration in Grafana demo](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/demo.gif)


Palindrome.js is also available in a light theme version.

![Palindrome.js light](https://github.com/Smile-SA/palindrome.js-grafana-plugin/raw/main/src/img/light-panel.png).