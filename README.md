# Admin Dashboard (Next.js + Shadcn/UI)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn/UI](https://img.shields.io/badge/Shadcn/UI-Components-8B5CF6)](https://ui.shadcn.com/)

Веб-панель, которая читает данные из Python-мониторинга (`../output/*.json`) и отображает состояние инфраструктуры: контейнеры, базы данных, очереди, API-тесты и проверки страниц.

---

## 📚 Содержание
- [⚙️ Функции](#️-функции)
- [🖼 Скриншоты](#-скриншоты)
- [📂 Структура](#-структура)
- [🚀 Установка и запуск](#-установка-и-запуск)
- [🔧 Конфигурация](#-конфигурация)
- [🗂 Доступные страницы](#-доступные-страницы)
- [🛠 Полезные команды](#-полезные-команды)

---

## ⚙️ Функции
- `/docker` — контейнеры, узлы и события из `docker_stream.json`.
- `/databases` — метрики БД, алерты, бэкапы из `database_stream.json`.
- `/queues` — доступность Redis/RabbitMQ из `queue_stream.json`.
- `/` — общий обзор состояния из `report_<timestamp>.json`.
- `/settings` — управление `config.yaml` (уведомления, стримы, темы).

---

## 🖼 Скриншоты

![Dashboard preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/1.png)
![Docker preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/2.png)
![Databases preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/3.png)
![Queues preview](https://github.com/iinQ1337/admin-dashboard/blob/main/screenshots/4.png)

---

## 📂 Структура
```
admin-dashboard/
  app/             # Маршруты Next.js (/, /docker, /databases, /queues, /settings, API)
  components/      # Готовые UI-компоненты (таблицы, карточки, модалки)
  lib/             # Утилиты, загрузчики потоков
  public/          # Статические файлы
  ...
```

---

## 🚀 Установка и запуск
```bash
cd admin-dashboard
npm install
npm run dev   # http://localhost:3000
```

---

## 🔧 Конфигурация
- Основной конфиг — `config.yaml` (Python-часть).  
  Обновляется через `/api/settings`.
- Темизация: TailwindCSS + Shadcn/UI.  
- Тёмная тема по умолчанию.

---

## 🗂 Доступные страницы
- `/` — общий обзор (API, страницы, серверные метрики)
- `/docker` — контейнеры, узлы, события
- `/databases` — инстансы БД, алерты, бэкапы
- `/queues` — Redis / RabbitMQ (метрики, доступность)
- `/settings` — изменение `config.yaml`

---

## 🛠 Полезные команды
```bash
npm run lint     # линтер
npm run build    # продакшн-сборка
npm run dev      # локальная разработка
```

---
