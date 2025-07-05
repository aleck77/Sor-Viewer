/**
 * @todo handle prefix from UserInterface
 */
const trPrefix = "t_";

export class Chart {
  prefix: string;
  chartInstance: any; // To store the chart instance
  constructor(prefix: string) {
    this.prefix = prefix;
    this.chartInstance = null;
  }

  async draw(points: any, events: any) {
    let marker = await this.getMarkers(events);
    this.drawEchart(points, marker);

    // Add a listener to resize the chart when the window is resized.
    window.addEventListener("resize", () => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    });
  }

  async getMarkers(
    events: { [x: string]: any; hasOwnProperty: (arg0: string) => any },
    type = "xAxis",
    y = 30
  ) {
    let markers = [];
    for (const key in events) {
      if (events.hasOwnProperty(key)) {
        const element = events[key];
        let distance = Number.parseFloat(element.distance).toFixed(2);
        if (type === "xAxis") {
          obj = {
            name: element.number,
            xAxis: distance,
            label: {
              formatter: function (param: { name: any }) {
                return [param.name];
              },
            },
          };
        } else {
          obj = {
            name: "Event " + element.number,
            coord: [element.distance, y],
            value: distance,
          };
        }
        markers.push(obj);
      }
    }
    return markers;
  }

  /**
   * Returns the chart's current state as a base64 encoded image.
   * @returns {string|null} Base64 encoded PNG image or null if chart is not initialized.
   */
  getChartAsBase64(): string | null {
    if (this.chartInstance) {
      return this.chartInstance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#fff",
        // Exclude toolbox components (zoom, save, etc.) from the exported image
        excludeComponents: ["toolbox"],
      });
    }
    console.error("Chart instance not available to capture image.");
    return null;
  }

  /**Apache Echart */
  drawEchart(points: { points: any }, markers: {}[]) {
    const chartContainer = document.getElementById("chartContainer");
    if (!chartContainer) {
      console.error("Chart container element not found.");
      return;
    }
    /**@todo fix the typescript error */
    // @ts-expect-error
    this.chartInstance = echarts.init(chartContainer);

    let option = {
      animation: false,
      title: {
        left: "center",
        text: "OTDR Trace Graph",
      },
      tooltip: {
        trigger: "axis",
        formatter: function (param: any[]) {
          param = param[0];
          return [
            /**@todo fix the typescript error */
            // @ts-expect-error
            "dB: " + param.data[1] + '<hr size=1 style="margin: 3px 0">',
            /**@todo fix the typescript error */
            // @ts-expect-error
            "km: " + param.data[0] + "<br/>",
          ].join("");
        },
      },
      grid: { // Added grid configuration
        left: '10%',
        right: '10%',
        bottom: '15%', // Adjusted for dataZoom
        containLabel: true
      },
      toolbox: {
        right: '5%', // Position toolbox to the right
        feature: {
          dataZoom: {
            yAxisIndex: 'none' // Ensure dataZoom is for x-axis only
          },
          restore: {}, // Added restore button
          saveAsImage: {},
        },
      },
      xAxis: {
        name: "Distance (km)",
        nameTextStyle: {
          fontWeight: "bold",
        },
        splitNumber: 10,
      },
      yAxis: {
        name: "Refelction (dB)",
        nameTextStyle: {
          fontWeight: "bold",
        },
        max: function (value: { max: number }) {
          return value.max + 10;
        },
        // splitNumber: 10
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
        },
        {
          type: 'slider', // Added slider for better visibility
          start: 0,
          end: 100,
        },
      ],
      dataset: {
        source: points.points,
      },
      series: [
        {
          type: "line",
          symbol: "none",
          // sampling: "max",
          itemStyle: {
            color: "#4f81bc",
          },
          encode: {
            x: 0,
            y: 1,
          },
          markLine: {
            silent: false,
            symbol: "none",
            data: markers,
          },
        },
      ],
    };
    this.chartInstance.setOption(option);

    // Resize the chart to fit its container AFTER setting options
    setTimeout(() => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    }, 100); // Small timeout to ensure container is fully rendered

    /** Event Handling */
    this.chartInstance.on("mouseover", function (params: { name: string }) {
      let arrIndex = parseInt(params.name);
      let id = trPrefix + arrIndex;
      highlight_row(id);
    });
  }
}

/**
 * @todo move this to Gui Class
 * @param className
 */
function highlight_row(className: string) {
  unHighlightAllRoWs();
  var row = document.getElementsByClassName(className);
  if (row && row.length > 0) {
    row[0].className += " selected";
  }
}
function unHighlightAllRoWs(idName = "events-table") {
  var table = document.getElementById(idName);
  if (table) {
    var rows = table.getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.remove("selected");
    }
  }
}
var obj = {};
