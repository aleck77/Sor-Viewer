import { Chart } from "./chart";
import { SorReader } from './sor';

export class Gui {
  chart: Chart;
  trPrefix: string;
  // Unique version identifier for caching debugging
  version: string = "1.0.6-alpha-20240702-8"; // Incremented version after multiple attempts

  currentPath: string = '';
  translations: { [key: string]: string };

  constructor() {
    this.trPrefix = "t_";
    this.chart = new Chart(this.trPrefix);
    this.translations = {
      "wavelength": "Довжина хвилі",
      "pulse width": "Ширина імпульсу",
      "range": "Діапазон",
      "total loss": "Загальні втрати",
      "distance": "Відстань",
      "slope": "Нахил",
      "refl loss": "Втрати на відбитті",
      "Main template": "Головний шаблон",
      "Properties": "Властивості",
      "Summary": "Зведення",
      "Events": "Події",
      "Actions": "Дії",
      "Filename": "Ім'я файлу",
      "Include Chart Image (PNG)": "Додати графік (PNG)",
      "Preview Report": "Перегляд звіту",
      "Select all columns": "Вибрати всі стовпці",
      "Select All": "Вибрати все",
      "Save template": "Зберегти шаблон",
      "Clear selections": "Очистити вибір",
      "Delete": "Видалити",
      "Report": "Звіт",
      "Save PDF": "Зберегти PDF",
      "OTDR Report": "Звіт OTDR",
      "OTDR Trace Chart": "Графік рефлектограми",
      "unknown": "невідомо",
      "number": "№",
      // phrases
      "Please select some data or include the chart to perform an action.": "Будь ласка, виберіть дані або включіть графік для виконання дії.",
      "Please enter a template name.": "Будь ласка, введіть назву шаблону.",
      "Data sent successfully as JSON!": "Дані успішно надіслано у форматі JSON!",
      "Failed to send data": "Не вдалося надіслати дані",
      "An error occurred while sending data": "Під час надсилання даних сталася помилка",
      "Index of": "Вміст теки",
      "Please select at least one file to parse.": "Будь ласка, виберіть хоча б один файл для аналізу.",
    };
    this.initializeFileManager();
    this.createDefaultTemplates();
    this.renderTemplates();
    console.log("Gui version:", this.version); // New Log
  }

  translate(key: string): string {
    return this.translations[key] || key;
  }

  createDefaultTemplates() {
    const defaultTemplateName = "Main template";
    if (!localStorage.getItem(`template_${defaultTemplateName}`)) {
      const defaultTemplate = {
        properties: ["wavelength", "pulse width", "range"],
        summary: ["total loss"],
        events: ["distance", "slope", "refl loss"],
        eventRows: [1],
        includeChart: true,
      };
      localStorage.setItem(
        `template_${defaultTemplateName}`,
        JSON.stringify(defaultTemplate)
      );
    }
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
        <h3>${this.translate("Actions")}</h3>
        <div style="display: flex; align-items: center; gap: 20px; margin-top: 10px;">
          <div style="display: flex; align-items: center;">
            <label for="source-filename-input" style="margin-right: 5px;">${this.translate("Filename")}:</label>
            <input type="text" id="source-filename-input" value="${filename}" style="width: 200px;">
          </div>
          <div>
            <label for="send-chart-checkbox" style="margin-right: 5px;">${this.translate("Include Chart Image (PNG)")}</label>
            <input type="checkbox" id="send-chart-checkbox">
          </div>
          <button id="preview-report-btn" style="padding: 8px 16px; font-size: 16px; cursor: pointer; margin-left: 10px;">${this.translate("Preview Report")}</button>
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
    let html = `<ul class="prop-list">`;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key];
        // Add checkbox only for final values, not for nested objects (lists/sub-lists)
        if (typeof element === "object" && element !== null) {
          html += `<li><span class="toggle-btn"></span><b>${this.translate("key")}: </b>${await this.createPropertyList(
            element
          )}</li>`;
        } else {
          // Add checkbox for each property
          let displayElement = element;
          let dataValue = element;
          if (key.toLowerCase() === 'range' && typeof element === 'string' && element.includes('km')) {
            const parts = element.split(' ');
            const value = parseFloat(parts[0]);
            if (!isNaN(value)) {
              const roundedValue = `${value.toFixed(3)} km`;
              displayElement = roundedValue;
              dataValue = roundedValue;
            }
          }
          html += `<li><input type="checkbox" class="prop-checkbox" data-key="${key}" data-value="${dataValue}" style="margin-right: 5px;"><b>${this.translate(key)}: </b>${displayElement}</li>`;
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
        <h3>${this.translate(name)}</h3>
        <input type="checkbox" id="${id}-select-all" class="select-all-checkbox" data-table-id="${id}" title="${this.translate("Select all columns")}">
        <label for="${id}-select-all">${this.translate("Select All")}</label>
      </div>`;
    html += `<table id='${id}'>`;
    if (Array.isArray(data) && data.length > 0) {
      html += await this.getHeaders(data[0], id); // Pass table ID to headers
    } else if (!Array.isArray(data)) {
      html += await this.getHeaders(data, id);
    }
    html += await this.getTableBody(data, id); // Pass table ID to body
    html += `</table>`;
    return html;
  }

  async getTableBody(data: any[], tableId: string) {
    let html = `<tbody>`;
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        // Add row selection checkbox
        html += `<tr class='selectable-row' data-row-id="${tableId}-${i}">`;
        html += `<td><input type="checkbox" class="row-checkbox" data-row-index="${i}"></td>`; // New checkbox for row selection
        html += await this.getTd(element);
        html += `</tr>`;
      }
    } else {
      html += `<tr>`;
      html += `<td></td>`; // Empty cell for single row (if not array)
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

  async getHeaders(data: any, tableId: string) {
    let html = `<thead><tr>`;
    // Add empty header for row selection checkbox column
    html += `<th></th>`;
    for (const key in data) {
      // Skip 'number' column for events-table if it's the events table
      if (tableId === "events-table" && key === "number") {
        html += `<th>${this.translate(key)}</th>`;
        continue;
      }
      html += `<th><input type="checkbox" class="header-checkbox" data-key="${key}" style="margin-right: 5px;">${this.translate(key)}</th>`;
    }
    html += `</tr></thead>`;
    return html;
  }

  addEventListeners() {
    this.setupSelectAllCheckboxes();
    this.setupRowCheckboxes();
    this.setupActionButtons();
    this.setupPropCheckboxes();
    this.setupToggleButtons();
    this.setupTemplateButtons();
  }

  setupSelectAllCheckboxes() {
    const selectAllCheckboxes = document.querySelectorAll(".select-all-checkbox");
    selectAllCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        const tableId = target.dataset.tableId;
        if (tableId) {
          const table = document.getElementById(tableId);
          // Select/deselect column headers
          const columnCheckboxes = table?.querySelectorAll<HTMLInputElement>(
            ".header-checkbox"
          );
          columnCheckboxes?.forEach((cb) => {
            // Do not affect the row selection checkbox header (first th)
            if (cb.parentElement?.tagName === 'TH' && (cb.parentElement as HTMLTableCellElement).cellIndex === 0) {
              return;
            }
            cb.checked = target.checked;
          });
          // Select/deselect row checkboxes for tables (Events only)
          if (tableId === "events-table") {
            const rowCheckboxes = table?.querySelectorAll<HTMLInputElement>(
              ".row-checkbox"
            );
            rowCheckboxes?.forEach((cb) => {
              cb.checked = target.checked;
            });
          }
        }
      });
    });
  }

  setupRowCheckboxes() {
    const rowCheckboxes = document.querySelectorAll(".row-checkbox");
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const row = target.closest('tr');
            if (row) {
                if (target.checked) {
                    row.classList.add('selected');
                } else {
                    row.classList.remove('selected');
                }
            }
        });
    });
  }

  setupPropCheckboxes() {
    // No specific global behavior for prop checkboxes, they are gathered by _gatherPayload
  }

  setupToggleButtons() {
    const toggleButtons = document.querySelectorAll(".toggle-btn");
    toggleButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const sublist = target.nextElementSibling?.nextElementSibling as HTMLUListElement;
        if (sublist && sublist.tagName === 'UL') {
          sublist.classList.toggle('expanded');
          target.classList.toggle('open');
        }
      });
    });
  }

  setupTemplateButtons() {
    const saveTemplateBtn = document.getElementById("save-template-btn");
    const clearSelectionsBtn = document.getElementById("clear-selections-btn");

    if (saveTemplateBtn) {
      saveTemplateBtn.addEventListener("click", () => {
        const templateNameInput = <HTMLInputElement>document.getElementById("template-name-input");
        const templateName = templateNameInput.value.trim();
        if (templateName) {
          this.saveTemplate(templateName);
          templateNameInput.value = "";
        } else {
          alert(this.translate("Please enter a template name."));
        }
      });
    }

    if (clearSelectionsBtn) {
      clearSelectionsBtn.addEventListener("click", () => {
        this.clearSelections();
      });
    }

    this.renderTemplates();
  }

  clearSelections() {
    // Clear all checkboxes
    document.querySelectorAll<HTMLInputElement>(".prop-checkbox, .header-checkbox, .row-checkbox").forEach(checkbox => {
      checkbox.checked = false;
    });

    // Clear all selected rows
    document.querySelectorAll<HTMLTableRowElement>("#events-table tr.selected").forEach(row => {
      row.classList.remove("selected");
    });

    // Clear include chart checkbox
    const sendChartCheckbox = document.getElementById("send-chart-checkbox") as HTMLInputElement;
    if (sendChartCheckbox) {
      sendChartCheckbox.checked = false;
    }
  }

  saveTemplate(name: string) {
    const sendChartCheckbox = document.getElementById("send-chart-checkbox") as HTMLInputElement;

    const selectedCheckboxes = {
      properties: [] as string[],
      summary: [] as string[],
      events: [] as string[],
      eventRows: [] as number[],
      includeChart: sendChartCheckbox.checked,
    };

    document.querySelectorAll<HTMLInputElement>(".prop-checkbox:checked").forEach(checkbox => {
      selectedCheckboxes.properties.push(checkbox.dataset.key!);
    });

    document.querySelectorAll<HTMLInputElement>("#summary-table .header-checkbox:checked").forEach(checkbox => {
      selectedCheckboxes.summary.push(checkbox.dataset.key!);
    });

    document.querySelectorAll<HTMLInputElement>("#events-table .header-checkbox:checked").forEach(checkbox => {
      selectedCheckboxes.events.push(checkbox.dataset.key!);
    });

    document.querySelectorAll<HTMLInputElement>("#events-table .row-checkbox:checked").forEach(checkbox => {
      selectedCheckboxes.eventRows.push(parseInt(checkbox.dataset.rowIndex!));
    });

    localStorage.setItem(`template_${name}`, JSON.stringify(selectedCheckboxes));
    this.renderTemplates();
  }

  loadTemplate(name: string) {
    const templateData = localStorage.getItem(`template_${name}`);
    if (templateData) {
      const selectedCheckboxes = JSON.parse(templateData);

      // Clear all checkboxes first
      document.querySelectorAll<HTMLInputElement>(".prop-checkbox, .header-checkbox, .row-checkbox").forEach(checkbox => {
        checkbox.checked = false;
      });

      // Clear all selected rows
      document.querySelectorAll<HTMLTableRowElement>("#events-table tr.selected").forEach(row => {
        row.classList.remove("selected");
      });

      // Apply template
      selectedCheckboxes.properties.forEach((key: string) => {
        const checkbox = document.querySelector<HTMLInputElement>(`.prop-checkbox[data-key="${key}"]`);
        if (checkbox) checkbox.checked = true;
      });

      selectedCheckboxes.summary.forEach((key: string) => {
        const checkbox = document.querySelector<HTMLInputElement>(`#summary-table .header-checkbox[data-key="${key}"]`);
        if (checkbox) checkbox.checked = true;
      });

      selectedCheckboxes.events.forEach((key: string) => {
        const checkbox = document.querySelector<HTMLInputElement>(`#events-table .header-checkbox[data-key="${key}"]`);
        if (checkbox) checkbox.checked = true;
      });

      selectedCheckboxes.eventRows.forEach((rowIndex: number) => {
        const checkbox = document.querySelector<HTMLInputElement>(`#events-table .row-checkbox[data-row-index="${rowIndex}"]`);
        if (checkbox) {
          checkbox.checked = true;
          const row = checkbox.closest("tr");
          if (row) {
            row.classList.add("selected");
          }
        }
      });

      const sendChartCheckbox = document.getElementById("send-chart-checkbox") as HTMLInputElement;
      if (sendChartCheckbox) {
        sendChartCheckbox.checked = selectedCheckboxes.includeChart;
      }
    }
  }

  renderTemplates() {
    const templatesList = document.getElementById("templates-list");
    if (templatesList) {
      templatesList.innerHTML = "";
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("template_")) {
          const templateName = key.replace("template_", "");
          const buttonContainer = document.createElement("div");
          buttonContainer.style.display = "flex";
          buttonContainer.style.alignItems = "center";
          buttonContainer.style.marginBottom = "5px";

          const button = document.createElement("button");
          button.textContent = this.translate(templateName);
          button.style.marginRight = "10px";
          button.addEventListener("click", () => {
            this.loadTemplate(templateName);
          });

          const deleteButton = document.createElement("button");
          deleteButton.textContent = this.translate("Delete");
          deleteButton.addEventListener("click", () => {
            localStorage.removeItem(key);
            this.renderTemplates();
          });

          buttonContainer.appendChild(button);
          buttonContainer.appendChild(deleteButton);
          templatesList.appendChild(buttonContainer);
        }
      }
    }
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

    // 1. Gather selected properties
    const selectedProperties: { [key: string]: string } = {};
    document.querySelectorAll<HTMLInputElement>(".prop-checkbox:checked").forEach(checkbox => {
      const key = checkbox.dataset.key;
      const value = checkbox.dataset.value;
      if (key && value) {
        selectedProperties[key] = value;
      }
    });
    if (Object.keys(selectedProperties).length > 0) {
      payload.properties = selectedProperties;
    }

    // 2. Gather selected summary data (column-wise)
    const summaryData = this.getTableData("summary-table");
    if (summaryData.length > 0) {
      payload.summary = summaryData;
    }

    // 3. Gather selected events data (row and column-wise)
    const eventsData = this.getEventsTableData("events-table");
    if (eventsData.length > 0) {
      payload.events = eventsData;
    }

    // 4. Gather chart image
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
      alert(this.translate("Please select some data or include the chart to perform an action."));
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
            alert(this.translate(`Data sent successfully as JSON!`));
          } else {
            const errorText = await response.text();
            alert(`${this.translate("Failed to send data")}: ${response.status} ${errorText}`);
          }
        } catch (error) {
          console.error("Error sending data:", error);
          alert(`${this.translate("An error occurred while sending data")}: ${error}`);
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
        }
      });
    }
  }

  // For Summary table (column selection only)
  getTableData(tableId: string): any[] {
    const table = <HTMLTableElement>document.getElementById(tableId);
    if (!table) return [];

    const headers: { index: number; key: string }[] = [];
    // Get selected column headers (excluding the row selection checkbox column)
    table
      .querySelectorAll<HTMLInputElement>("th .header-checkbox:checked")
      .forEach((checkbox) => {
        const th = checkbox.parentElement;
        if (th) {
          headers.push({
            index: Array.from(th.parentElement!.children).indexOf(th),
            key: checkbox.dataset.key!,
          });
        }
      });

    if (headers.length === 0) {
      return [];
    }

    const dataToSend: any[] = [];
    // Get all rows, regardless of row selection for summary table
    const rows = table.querySelectorAll("tbody tr");
    for (const row of Array.from(rows)) {
      const rowData: { [key: string]: string } = {};
      const cells = row.getElementsByTagName("td");
      // Start from index 1 to skip the potential row selection checkbox cell
      for (const header of headers) {
        // Adjust header index if row checkbox column is present
        const cellIndex = tableId === 'events-table' ? header.index + 1 : header.index;
        if (cells[cellIndex]) {
          rowData[header.key] = cells[cellIndex].innerText;
        }
      }
      dataToSend.push(rowData);
    }
    return dataToSend;
  }

  // New function to handle Events table data (row and column selection)
  getEventsTableData(tableId: string): any[] {
    const table = <HTMLTableElement>document.getElementById(tableId);
    if (!table) return [];

    const selectedHeaders: { index: number; key: string }[] = [];
    // Get selected column headers (excluding the row selection checkbox column)
    table
      .querySelectorAll<HTMLInputElement>("th .header-checkbox:checked")
      .forEach((checkbox) => {
        const th = checkbox.parentElement;
        if (th) {
          selectedHeaders.push({
            index: Array.from(th.parentElement!.children).indexOf(th),
            key: checkbox.dataset.key!,
          });
        }
      });

    if (selectedHeaders.length === 0) {
      return []; // No columns selected, return empty array
    }

    const dataToSend: any[] = [];
    // Get ONLY selected rows (where row-checkbox is checked)
    const selectedRows = table.querySelectorAll<HTMLTableRowElement>("tbody tr.selected");
    
    selectedRows.forEach((row) => {
        const rowData: { [key: string]: string } = {};
        const cells = row.getElementsByTagName("td");
        
        // Iterate through selected headers and get data from corresponding cells
        // Note: cell index needs to be adjusted by +1 because of the new row-checkbox column
        for (const header of selectedHeaders) {
            const actualCellIndex = header.index;
            if (cells[actualCellIndex]) {
                rowData[header.key] = cells[actualCellIndex].innerText;
            }
        }
        if (Object.keys(rowData).length > 0) {
          dataToSend.push(rowData);
        }
    });
    return dataToSend;
  }

  generateHtmlReport(data: { [key: string]: any }): string {
    const reportTitle = `${this.translate("OTDR Report")} - ${data.sourceFile || this.translate("unknown")}`;
    let html = `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        body { font-family: sans-serif; margin: 20px; }
        h1, h2 { color: #333; text-align: center; }
        .report-container { display: flex; flex-direction: column; align-items: center; }
        .report-data { column-count: 2; column-gap: 20px; margin-top: 20px; }
        .data-item { display: flex; align-items: baseline; gap: 5px; break-inside: avoid-column; margin-bottom: 10px; }
        .data-key { font-weight: bold; margin-right: 5px; }
        .data-value { flex-grow: 1; border-bottom: 1px dashed #ccc; padding-bottom: 2px; }
        img { max-width: 100%; height: auto; display: block; margin: 0 auto 20px auto; border: 1px solid #ddd; }
        .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 5px; z-index: 1000; }
        @media print {
          .print-btn {
            display: none;
          }
          body { margin: 0; }
          .data-item { border-bottom: none !important; }
          .data-value { border-bottom: none !important; }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()" class="print-btn">${this.translate("Save PDF")}</button>
      <div class="report-container">
        <h1>${this.translate("Report")}: ${data.sourceFile || this.translate("unknown")}</h1>
    `;

    if (data.chartImage) {
      html += `<img src="${data.chartImage}" alt="${this.translate("OTDR Trace Chart")}">`;
    }

    html += `<div class="report-data">`;

    // Add selected properties to the report
    if (data.properties) {
      for (const key in data.properties) {
        html += `<div class="data-item"><span class="data-key" contenteditable="true">${this.translate(key)}:</span> <span class="data-value" contenteditable="true">${data.properties[key]}</span></div>`;
      }
    }

    // Add selected summary data to the report
    if (data.summary && data.summary.length > 0) {
        // Assuming summary is a single object or we only care about the first one for key-value pairs
        for (const key in data.summary[0]) {
            html += `<div class="data-item"><span class="data-key" contenteditable="true">${this.translate(key)}:</span> <span class="data-value" contenteditable="true">${data.summary[0][key]}</span></div>`;
        }
    }

    // Add selected events data to the report
    if (data.events && data.events.length > 0) {
        data.events.forEach((eventRow: { [key: string]: string }) => {
            for (const key in eventRow) {
                html += `<div class="data-item"><span class="data-key" contenteditable="true">${this.translate(key)}:</span> <span class="data-value" contenteditable="true">${eventRow[key]}</span></div>`;
            }
        });
    }

    html += `</div>`; // Close report-data div
    html += `</div>`; // Close report-container div

    html += `
    </body>
    </html>
    `;
    return html;
  }

  initializeFileManager() {
    const modal = document.getElementById("fileManagerModal");
    const btn = document.getElementById("btnBrowse");
    const span = document.getElementsByClassName("close")[0] as HTMLElement;
    const btnCreateFolder = document.getElementById("btnCreateFolder");
    const btnUploadFile = document.getElementById("btnUploadFile");
    const btnUploadToParser = document.getElementById("btnUploadToParser");
    const fileUploadInput = document.getElementById('fileUpload') as HTMLInputElement;
    const filesChosen = document.getElementById('files-chosen');

    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', () => {
            if (fileUploadInput.files && fileUploadInput.files.length > 0) {
                if (filesChosen) filesChosen.textContent = `${fileUploadInput.files.length} files selected`;
            } else {
                if (filesChosen) filesChosen.textContent = "Не вибрано файлів";
            }
        });
    }

    if(btn) {
        btn.onclick = () => {
            if(modal) modal.style.display = "block";
            this.loadFiles();
        }
    }

    if(span) {
        span.onclick = () => {
            if(modal) modal.style.display = "none";
        }
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            if(modal) modal.style.display = "none";
        }
    }

    if(btnCreateFolder) {
        btnCreateFolder.onclick = async () => {
            const newFolderNameInput = document.getElementById('newFolderName') as HTMLInputElement;
            const newFolderName = newFolderNameInput.value;
            if (newFolderName) {
                await this.createFolder(newFolderName, this.currentPath);
                newFolderNameInput.value = '';
                this.loadFiles(); // Refresh file list
            }
        };
    }

    if(btnUploadFile) {
        btnUploadFile.onclick = async () => {
            const files = fileUploadInput.files;
            if (files && files.length > 0) {
                await this.uploadFiles(files, this.currentPath);
                fileUploadInput.value = '';
            }
        };
    }
    if (btnUploadToParser) {
      btnUploadToParser.onclick = async () => {
          const checkboxes = document.querySelectorAll<HTMLInputElement>('.file-checkbox:checked');
          const filesToParse: string[] = [];
          checkboxes.forEach(checkbox => {
              filesToParse.push(checkbox.dataset.path!);
          });

          if (filesToParse.length > 0) {
              this.parseFiles(filesToParse);
              const modal = document.getElementById("fileManagerModal");
              if (modal) modal.style.display = "none";
          } else {
              alert(this.translate("Please select at least one file to parse."));
          }
      };
  }
}

async parseFiles(files: string[]) {
  this.clearDivs();
  for (const filePath of files) {
    try {
      const response = await fetch(`/public/${filePath}`);
      const arrayBuffer = await response.arrayBuffer();
      const filename = filePath.split("/").pop()!;
      const config = { browserMode: true };
      const sor = new SorReader(undefined, config, arrayBuffer);
      const data = await sor.parse();
      this.showResults(data, filename);
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
    }
  }
}

  async loadFiles(path = '') {
    this.currentPath = path;
    try {
        const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
        const data = await response.json();
        const fileManager = document.getElementById('fileManager');
        if (fileManager) {
            let html = `<h2>${this.translate("Index of")} /${data.currentPath}</h2>`;
            html += '<hr><pre>';
            if (data.currentPath !== '') {
                html += `<a href="#" class="dir-up">../</a>\n`;
            }
            data.files.forEach((file: { name: string, isDirectory: boolean }) => {
                const fullPath = data.currentPath ? `${data.currentPath}/${file.name}` : file.name;
                const linkClass = file.isDirectory ? 'dir' : 'file';
                const linkText = file.isDirectory ? `${file.name}/` : file.name;
                if (file.isDirectory) {
                    html += `<a href="#" class="${linkClass}" data-path="${fullPath}">${linkText}</a>\n`;
                } else {
                    html += `<input type="checkbox" class="file-checkbox" data-path="${fullPath}" style="margin-right: 5px;"><a href="#" class="${linkClass}" data-path="${fullPath}">${linkText}</a>\n`;
                }
            });
            html += '</pre><hr>';
            fileManager.innerHTML = html;

            // Add event listeners
            fileManager.querySelectorAll('a').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const itemPath = item.getAttribute('data-path');
                    if (item.classList.contains('dir')) {
                        this.loadFiles(itemPath || '');
                    } else if (item.classList.contains('dir-up')) {
                        const parentPath = path.substring(0, path.lastIndexOf('/'));
                        this.loadFiles(parentPath);
                    } else if (item.classList.contains('file')) {
                        // Handle file selection
                        const modal = document.getElementById("fileManagerModal");
                        if(modal) modal.style.display = "none";
                        const fileUrl = `/public/${itemPath}`;
                        // This is where you would pass the file to the parser.
                        // For now, we'll just log it.
                        console.log("Selected file:", fileUrl);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
  }

  async createFolder(name: string, path = '') {
    try {
        await fetch('/api/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, path })
        });
    } catch (error) {
        console.error('Error creating folder:', error);
    }
  }

  async uploadFiles(files: FileList, path = '') {
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const uploadProgressBar = document.getElementById('uploadProgressBar') as HTMLProgressElement;
    const uploadProgressText = document.getElementById('uploadProgressText');

    if (uploadProgressContainer) uploadProgressContainer.style.display = 'block';
    if (uploadProgressBar) uploadProgressBar.value = 0;
    if (uploadProgressText) uploadProgressText.textContent = '0%';

    try {
        const formData = new FormData();
        formData.append('path', path);
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                if (uploadProgressBar) uploadProgressBar.value = percentComplete;
                if (uploadProgressText) uploadProgressText.textContent = `${Math.round(percentComplete)}%`;
            }
        };

        xhr.onload = () => {
            if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
            if (xhr.status === 200) {
                this.loadFiles(this.currentPath);
            } else {
                console.error('Error uploading files:', xhr.statusText);
            }
        };

        xhr.onerror = () => {
            if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
            console.error('Error uploading files:', xhr.statusText);
        };

        xhr.send(formData);
    } catch (error) {
        console.error('Error uploading files:', error);
        if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
    }
  }
}