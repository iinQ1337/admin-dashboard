# Admin Dashboard (Next.js + Shadcn/UI)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn/UI](https://img.shields.io/badge/Shadcn/UI-Components-8B5CF6)](https://ui.shadcn.com/)

Next.js dashboard for the Python monitoring daemon.  
Reads JSON snapshots from `../output/*.json` and renders live infrastructure panels: containers, databases, queues, supervisor processes, API/page checks, and more.

> The monitoring service works **without** this dashboard.  
> This app is an **optional visual layer** on top of the JSON output.

---

## 📚 Table of Contents

- [Features](#%EF%B8%8F-features)
- [Architecture](#-architecture)
- [Data Sources](#-data-sources)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Available Pages](#-available-pages)
- [Screenshots](#-screenshots)
- [Coffee](#-coffee)

---

## ⚙️ Features

- **Live Infrastructure Overview**
  - Reads `report_<ts>.json` and stream files from `../output/`
  - Aggregated status for APIs, pages, servers, databases, queues, and Docker

- **Docker Panel (`/docker`)**
  - Containers, nodes, events from `docker_stream.json`
  - Status, image, uptime, basic resource metrics, quick filters

- **Databases Panel (`/databases`)**
  - DB instances, connectivity, latency and alerts from `database_stream.json`
  - Backup status and history when enabled in the monitoring service

- **Queues Panel (`/queues`)**
  - Redis / RabbitMQ reachability and basic metrics from `queue_stream.json`
  - Simple view of “is it alive?” for background processing

- **Supervisor Panel (`/supervisor`)**
  - Process states, restart counters, uptime and recent events
  - Built on top of supervisor snapshots from the monitoring service

- **Config UI (`/settings`)**
  - Reads and updates monitoring `config.yaml` via `/api/settings`
  - Toggle streams, notifications, thresholds, and themes

- **UI Stack**
  - Next.js 14 (App Router) + TypeScript
  - TailwindCSS + Shadcn/UI components
  - Dark theme by default, easily extensible

---

## 🏗 Architecture

- **Frontend-only Next.js app**  
  No separate backend service is required — the dashboard:
  - Reads JSON data from the monitoring repo’s `output/` directory (by default `../output`)
  - Uses internal `/api/*` routes for:
    - Reading stream/report files
    - Updating `config.yaml` (with file-system access in the same environment)

- **Tight Coupling with Monitoring Service**
  - Designed to work alongside the Python monitoring daemon:
    - `output/report_<ts>.json`
    - `output/docker_stream.json`
    - `output/database_stream.json`
    - `output/queue_stream.json`
    - `output/supervisor/*_latest.json` (optional, when supervisor is enabled)
  - Any new stream added on the Python side can be exposed here with minimal UI changes

---

## 📡 Data Sources

By default the app expects the monitoring project to be **one level up** in the directory tree, with JSON output under `../output/`.

Main files:

- `../output/report_<ts>.json` — aggregated report for the overview page (`/`)
- `../output/docker_stream.json` — Docker containers/nodes/events
- `../output/database_stream.json` — DB metrics, alerts, backups
- `../output/queue_stream.json` — Redis/RabbitMQ reachability
- `../output/supervisor/*_latest.json` — supervisor processes (stdout/stderr & status)
- `../config.yaml` — main configuration, edited via `/settings`

All paths can be adjusted inside the app/lib layer if you run the dashboard in a different layout.

---

## 🚀 Getting Started

```bash
# inside the admin dashboard repo
cd admin-dashboard

# install deps
npm install

# start dev server
npm run dev   # open http://localhost:3000
```

> Make sure the Python monitoring service is running and writing JSON into ../output/ (relative to this folder), otherwise panels will show empty/placeholder data.

---

## 🔧 Configuration

### Monitoring Config Bridge

- **Main config file:** `config.yaml` (lives in the Python project root)
- The dashboard accesses and updates it through `/api/settings`:
  - Load the current config
  - Apply changes from the settings UI
  - Validate and write back to file

Any new config sections added on the monitoring side will appear as raw fields until you wire them into the settings UI.

### Theming

- TailwindCSS + Shadcn/UI
- Dark theme is enabled by default

You can:
- Extend the Shadcn theme
- Add new Tailwind utilities
- Swap layouts while keeping the same data loaders

## 🗂 Available Pages

- `/` — **Overview**  
  General health snapshot: APIs, pages, server metrics, streams summary.

- `/docker` — **Docker**  
  Containers, nodes, events from `docker_stream.json`.

- `/databases` — **Databases**  
  DB instances, alerts, test query timings, backups from `database_stream.json`.

- `/queues` — **Queues**  
  Redis / RabbitMQ availability and metrics from `queue_stream.json`.

- `/supervisor` — **Supervisor**  
  Process monitoring (status, restarts, uptime) backed by supervisor output files.

- `/settings` — **Settings**  
  `config.yaml` editor: notifications, streams, thresholds, themes, and other monitoring options.

---

## 🖼 Screenshots
![Dashboard preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/1.png) 
<details>
  <summary>Show more screenshots</summary>

  ![Docker preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/2.png)  
  ![Databases preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/3.png)  
  ![Queues preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/4.png)

</details>

---

## ☕ Coffee
If this project saves you time or nerves, you can support it here:

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/iinQ1337)
