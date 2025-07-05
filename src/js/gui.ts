import { Chart } from "./chart";

export class Gui {
  chart: Chart;
  trPrefix: string;
  // Unique version identifier for caching debugging
  version: string = "1.0.5-release-20240701-5"; // New version for UI/UX improvements

  constructor() {
    this.trPrefix = "t_";
    this.chart = new Chart(this.trPrefix);
    console.log("Gui version:", this.version);
  }

  clearDivs() {
    let divs = ["result", "event-sum", "send-controls"];
    divs.forEach((element) => {
      const el = document.getElementById(element);
      if (el) el.innerHTML = "";
    });
  }

  async showResults(
    data: {
      params: any;
      points: any;
      events: any;
      summary: any;
    },
    filename: string
  ) {
    let props = await this.createPropertyList(data.params);
    await this.writeToDiv(props, "result");
    this.chart.draw(data.points, data.events);
    let events = await this.getEvents(data.events, data.summary);
    await this.writeToDiv(events, "event-sum");

    // Create global send controls
    this.createSendControls(filename);

    // Use a timeout to ensure the DOM is updated before adding listeners
    setTimeout(() => {
      this.addEventListeners();
    }, 100);
  }

  createSendControls(filename: string) {
    const controlsContainer = document.getElementById("send-controls");
    if (!controlsContainer) return;

    const html = `
      <div style="margin-top: 20px; border-top: 2px solid #ccc; padding-top: 15px;">
        <h3>Actions</h3>
        <div style="display: flex; align-items: center; gap: 20px; margin-top: 10px;">
          <div style="display: flex; align-items: center;">
            <label for="source-filename-input" style="margin-right: 5px;">Filename:</label>
            <input type="text" id="source-filename-input" value="${filename}" style="width: 200px;">
          </div>
          <div>
            <label for="send-chart-checkbox" style="margin-right: 5px;">Include Chart Image (PNG)</label>
            <input type="checkbox" id="send-chart-checkbox">
          </div>
          <button id="send-json-btn" style="padding: 8px 16px; font-size: 16px; cursor: pointer;">Send JSON</button>
          <button id="preview-report-btn" style="padding: 8px 16px; font-size: 16px; cursor: pointer; margin-left: 10px;">Preview Report</button>
        </div>
      </div>
    `;
    controlsContainer.innerHTML = html;
  }

  /** * Properties  */
  async createPropertyList(data: {
    [x: string]: any;
    hasOwnProperty: (arg0: string) => any;
  }) {
    let html = `<ul>`;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        if (typeof element === "object" && element !== null) {
          html += `<li><b>${key}: </b>${await this.createPropertyList(
            element
          )}</li>`;
        } else {
          html += `<li><b>${key}: </b>${element}</li>`;
        }
      }
    }
    html += `</ul>`;
    return html;
  }

  /** * append Innerhtml  */
  async writeToDiv(data: string, idName: string, waitTime = 1) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const element = document.getElementById(idName);
        if (element) {
          element.innerHTML += data;
        } else {
          console.error(`Element with id '${idName}' not found.`);
        }
        resolve();
      }, waitTime);
    });
  }
  /** Table Events */
  async getEvents(events: any, summary: any) {
    let html = ``;
    html += await this.createTable(summary, "Summary", "summary-table");
    html += await this.createTable(events, "Events", "events-table");
    return html;
  }

  async createTable(data: any[], name: string, id = "") {
    let html = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <h3>${name}</h3>
        <input type="checkbox" id="${id}-select-all" class="select-all-checkbox" data-table-id="${id}" title="Select all columns">
        <label for="${id}-select-all">Select All</label>
      </div>`;
    html += `<table id='${id}'>`;
    if (Array.isArray(data) && data.length > 0) {
      html += await this.getHeaders(data[0]);
    } else if (!Array.isArray(data)) {
      html += await this.getHeaders(data);
    }
    html += await this.getTableBody(data);
    html += `</table>`;
    return html;
  }

  async getTableBody(data: any[]) {
    let html = `<tbody>`;
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let id = "";
        if (element.hasOwnProperty("number")) {
          id = this.trPrefix + element.number;
        }
        html += `<tr class='${id}'>`;
        html += await this.getTd(element);
        html += `</tr>`;
      }
    } else {
      html += `<tr>`;
      html += await this.getTd(data);
      html += `</tr>`;
    }
    html += `</tbody>`;
    return html;
  }

  async getTd(data: []) {
    let html = "";
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        html += `<td>${element}</td>`;
      }
    }
    return html;
  }

  async getHeaders(data: any) {
    let html = `<thead><tr>`;
    for (const key in data) {
      html += `<th><input type="checkbox" class="header-checkbox" data-key="${key}" style="margin-right: 5px;">${key}</th>`;
    }
    html += `</tr></thead>`;
    return html;
  }

  addEventListeners() {
    this.setupSelectAllCheckboxes();
    this.setupActionButtons();
  }

  setupSelectAllCheckboxes() {
    const selectAllCheckboxes = document.querySelectorAll(".select-all-checkbox");
    selectAllCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        const tableId = target.dataset.tableId;
        if (tableId) {
          const table = document.getElementById(tableId);
          const columnCheckboxes = table?.querySelectorAll<HTMLInputElement>(
            ".header-checkbox"
          );
          columnCheckboxes?.forEach((cb) => {
            cb.checked = target.checked;
          });
        }
      });
    });
  }

  /** Gathers all selected data from the UI */
  private _gatherPayload() {
    const sourceFilenameInput = <HTMLInputElement>(
      document.getElementById("source-filename-input")
    );
    const sourceFilename = sourceFilenameInput
      ? sourceFilenameInput.value
      : "unknown";

    const payload: { [key: string]: any } = {
      sourceFile: sourceFilename,
    };

    const summaryData = this.getTableData("summary-table");
    if (summaryData.length > 0) {
      payload.summary = summaryData;
    }

    const eventsData = this.getTableData("events-table");
    if (eventsData.length > 0) {
      payload.events = eventsData;
    }

    const sendChartCheckbox = <HTMLInputElement>(
      document.getElementById("send-chart-checkbox")
    );
    if (sendChartCheckbox?.checked) {
      const chartBase64 = this.chart.getChartAsBase64();
      if (chartBase64) {
        payload.chartImage = chartBase64;
      }
    }

    // Check if any actual data (besides sourceFile) was added
    if (Object.keys(payload).length === 1 && payload.hasOwnProperty('sourceFile')) {
      alert("Please select some data or include the chart to perform an action.");
      return null;
    }

    return payload;
  }

  setupActionButtons() {
    const sendJsonButton = document.getElementById("send-json-btn");
    const previewReportButton = document.getElementById("preview-report-btn");

    // 1. Setup Send JSON button
    if (sendJsonButton) {
      sendJsonButton.addEventListener("click", async () => {
        const payload = this._gatherPayload();
        if (!payload) return;

        console.log(`Final Payload for sending (as JSON):
${JSON.stringify(payload, null, 2)}`);

        try {
          const response = await fetch("https://n8n.artelegis.com.ua/webhook/sor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            alert(`Data sent successfully as JSON!`);
          } else {
            const errorText = await response.text();
            alert(`Failed to send data: ${response.status} ${errorText}`);
          }
        } catch (error) {
          console.error("Error sending data:", error);
          alert(`An error occurred while sending data: ${error}`);
        }
      });
    }

    // 2. Setup Preview Report button
    if (previewReportButton) {
      previewReportButton.addEventListener("click", () => {
        const payload = this._gatherPayload();
        if (!payload) return;

        const htmlReportContent = this.generateHtmlReport(payload);

        // Open the generated HTML in a new browser tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(htmlReportContent);
          newWindow.document.close();
        } else {
          alert("Please allow pop-ups for this site to preview the report.");
        }
      });
    }
  }

  getTableData(tableId: string): any[] {
    const table = <HTMLTableElement>document.getElementById(tableId);
    if (!table) return [];

    const headers: { index: number; key: string }[] = [];
    table
      .querySelectorAll(".header-checkbox:checked")
      .forEach((checkbox) => {
        const th = checkbox.parentElement;
        if (th) {
          headers.push({
            index: Array.from(th.parentElement!.children).indexOf(th),
            key: (checkbox as HTMLElement).dataset.key!,
          });
        }
      });

    if (headers.length === 0) {
      return [];
    }

    const dataToSend: any[] = [];
    const rows = table.querySelectorAll("tbody tr");
    for (const row of Array.from(rows)) {
      const rowData: { [key: string]: string } = {};
      const cells = row.getElementsByTagName("td");
      for (const header of headers) {
        if (cells[header.index]) {
          rowData[header.key] = cells[header.index].innerText;
        }
      }
      dataToSend.push(rowData);
    }
    return dataToSend;
  }

  generateHtmlReport(data: { [key: string]: any }): string {
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>OTDR Report - ${data.sourceFile || "N/A"}</title>
      <style>
        body { font-family: sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; display: block; margin: 0 auto 20px auto; border: 1px solid #ddd; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 5px; }
        @media print {
          .print-btn {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()" class="print-btn">Save PDF</button>
      <h1>Report: ${data.sourceFile || "N/A"}</h1>
    `;

    if (data.chartImage) {
      // Correctly close the img tag now
      html += `<img src="${data.chartImage}" alt="OTDR Trace Chart">`;
    }

    if (data.summary && data.summary.length > 0) {
      html += `<h2>Summary</h2><table><thead><tr>`;
      for (const key in data.summary[0]) {
        html += `<th>${key}</th>`;
      }
      html += `</tr></thead><tbody><tr>`;
      for (const key in data.summary[0]) {
        html += `<td>${data.summary[0][key]}</td>`;
      }
      html += `</tr></tbody></table>`;
    }

    if (data.events && data.events.length > 0) {
      html += `<h2>Events</h2><table><thead><tr>`;
      for (const key in data.events[0]) {
        html += `<th>${key}</th>`;
      }
      html += `</tr></thead><tbody>`;
      data.events.forEach((row: { [x: string]: any; }) => {
        html += `<tr>`;
        // Ensure the order of columns matches the header
        for (const key in data.events[0]) {
          html += `<td>${row[key] || ""}</td>`;
        }
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `
    </body>
    </html>
    `;
    return html;
  }
}
