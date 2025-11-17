# Admin Dashboard (Next.js + Shadcn/UI)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn/UI](https://img.shields.io/badge/Shadcn/UI-Components-8B5CF6)](https://ui.shadcn.com/)

Веб-панель, которая читает данные из Python-мониторинга (`../output/*.json`) и показывает состояние инфраструктуры: контейнеры, базы данных, очереди, проверки API/страниц.

## Содержание
- [Функции](#функции)
- [Скриншоты](#скриншоты)
- [Структура](#структура)
- [Установка и запуск](#установка-и-запуск)
- [Конфигурация](#конфигурация)
- [Доступные страницы](#доступные-страницы)
- [Полезные команды](#полезные-команды)

## Функции
- `/docker` — контейнеры, узлы и события из `docker_stream.json`.
- `/databases` — метрики БД, алерты, бэкапы из `database_stream.json`.
- `/queues` — доступность Redis/RabbitMQ из `queue_stream.json`.
- `/` — дашборд по общему отчёту `report_<timestamp>.json`.
- `/settings` — управление `config.yaml` (стримы, уведомления, темы).

## Превью:

![Dashboard preview](./.github/screenshots/1.png)
![Docker preview](./.github/screenshots/2.png)
![Databases preview](./.github/screenshots/3.png)
![Queues preview](./.github/screenshots/4.png)

## Структура
```
admin-dashboard/
  app/             # Next.js App Router (страницы /, /docker, /databases, /queues, /settings, API)
  components/      # UI-компоненты (таблицы, карточки, модалки)
  lib/             # Загрузчики потоков, утилиты
  public/          # Статика
  ...
```

## Установка и запуск
```bash
cd admin-dashboard
npm install
npm run dev          # http://localhost:3000
```

## Конфигурация
- Основной конфиг — `config.yaml` в корне проекта (Python). Страница `/settings` пишет значения через `/api/settings`.
- Темing: стили на Tailwind + shadcn/ui, dark mode по умолчанию.


## Доступные страницы
- `/` — общий обзор (API/Pages/Server etc.)
- `/docker` — контейнеры/узлы/события
- `/databases` — инстансы/алерты/бэкапы (модалки по клику)
- `/queues` — Redis/RabbitMQ доступность
- `/settings` — редактирование config.yaml (стримы, уведомления, темы)

 
## Полезные команды
```bash
npm run lint         # линт
npm run build        # прод сборка
npm run dev          # локальная разработка
```