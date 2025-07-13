# SOR Viewer

This is a single-page application (SPA) for viewing and processing SOR (Standard OTDR Record) files, a format used for storing optical fiber data (Telcordia SR-4731, issue 2). The application allows users to upload SOR files from their local directory, parse them, and generate PDF reports from the parsed data.

## Key Features

*   **SOR File Parsing:** Upload and parse SOR files to extract key parameters.
*   **Data Visualization:** View parsed data in tables (Properties, Summary, Events) and as a chart.
*   **Customizable Reports:** Select specific parameters from the parsed data to be included in a report.
*   **Report Preview:** Preview the report in a new browser tab before saving it as a PDF.
*   **Template Management:**
    *   Save a selection of parameters as a template.
    *   Load saved templates to quickly apply a standard set of parameters.
    *   A default "Main template" is available on first use.
*   **File Management:**
    *   Browse files and folders on the server.
    *   Upload new SOR files to the server.
    *   Create new folders on the server.

## Tech Stack

*   **Frontend:** TypeScript, HTML, CSS
*   **Backend:** Node.js with Express (for file management)
*   **Charting:** ECharts
*   **Bundler:** Vite

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/moosler/Sor-Viewer.git otdr
    cd otdr
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

## Browser Version

To build the application for production and preview it:

```bash
npm run build
npm run preview
```

## Deployment

The application can be deployed using Docker and Docker Compose.

### Prerequisites

*   A server with a public IP address.
*   Docker and Docker Compose installed on the server.
*   A domain name pointed to the server's IP address.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aleck77/Sor-Viewer.git
    cd Sor-Viewer
    ```

2.  **Build and run the application:**
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the application:**
    Access the application in your web browser by navigating to your domain.

## License

[MIT](http://opensource.org/licenses/MIT)
Copyright (c) 2019-present, Marco Moosler