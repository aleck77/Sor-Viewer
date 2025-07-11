# OTDR-Viewer

This is an simple Online Viewer for SOR Files ("Standard OTDR Record"- Telcordia SR-4731, issue 2 standard). This data Format ist used to store OTDR fiber data.
This is an ES6 Implementation of the Version from [sid5432](https://github.com/sid5432/jsOTDR).

## Introduction

You can use this repo as browser version or node version.
Currently only SOR files from version 2 are supported.

## Example

check out [live example](https://marmoo.de/coding/otdr/).

## install

```bash
git clone https://github.com/moosler/Sor-Viewer.git otdr
cd otdr
npm install
```

### start dev mode

```bash
npm run dev
```

### start Browser Version

```bash
npm run build
npm rund preview
```

### Config

Some Config parameters can be set.
In the browser version the variable "config" in "main-browser.js" can be adjusted.
In the node version the variable "config" in "node.js" can be adjusted.
The following values can be set:

- debug: false, // IF true Logging Infos are displayed to Console
- createJson: false, //only for Node Version. If true results ar wirtten in an File called "result.js"
- jsonPath: '.', //only for Node Version and if createJson is true. This is the path there the json file is saved
- jsonName: 'result.json', //if createJson is true this is the name of the json File
- devMode: false, //For Development: if true only the first 100 DataPoints are read
- browserMode: false //BrowserMode

## Questions

For questions and support please mail me <moosler@gmx.de>

## Knwon Issues

- SOR Version 1 not supported yet

## License

[MIT](http://opensource.org/licenses/MIT)
Copyright (c) 2019-present, Marco Moosler

## Deployment

This section describes how to deploy the application on a server with Docker and Docker Compose.

### Prerequisites

- A server with a public IP address.
- Docker and Docker Compose installed on the server.
- A domain name pointed to the server's IP address (e.g., `sor.artelegis.com.ua`).

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

    This command will build the Docker images and start the application in detached mode.

3.  **Access the application:**

    Once the application is running, you can access it in your web browser by navigating to your domain (e.g., `http://sor.artelegis.com.ua`).
