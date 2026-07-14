# Neon Arena — 3D FPS

*Русская версия ниже / Russian version below*

## English

A browser-based 3D first-person shooter. Fight a single AI-controlled
opponent to the death in a walled sci-fi neon arena. Built with
[Three.js](https://threejs.org/) — a static site with no build step and
no server-side code, running entirely in the browser.

**Features**
- Sci-fi neon arena with cover pillars and glowing walls
- One aggressive AI opponent that chases, takes cover, strafes, and shoots
- Health bars, tracer-bolt shot visualization, floating damage numbers
- Synthesized sound effects (no external audio files)
- Pause menu (Escape)

**Controls**

| Key             | Action              |
|-----------------|---------------------|
| ↑ / ↓           | Move forward / back |
| ← / →           | Strafe left / right |
| Mouse           | Look around          |
| Space / LMB     | Fire                |
| Escape          | Pause / resume       |

### How to run

The game can't be opened directly as a `file://` URL — browsers block ES
module imports that way. You need a local static file server:

1. Download or clone this folder.
2. From inside the folder, start a local server, for example:
   ```bash
   python3 -m http.server 8000
   # or, if you have Node.js:
   npx serve .
   ```
   (VS Code users can also use the "Live Server" extension instead.)
3. Open `http://localhost:8000` (or whatever port your server prints) in
   a browser.

No internet connection is required — Three.js is bundled locally in
`vendor/three/`, so nothing is fetched from a CDN.

---

## Русский

Браузерный 3D-шутер от первого лица. Сражайся насмерть с одним
противником, управляемым компьютером, на арене в sci-fi неоновом стиле.
Сделано на [Three.js](https://threejs.org/) — статический сайт без
сборки и без серверного кода, всё работает прямо в браузере.

**Возможности**
- Неоновая sci-fi арена с укрытиями и светящимися стенами
- Один агрессивный AI-противник: преследует, использует укрытия,
  двигается боком и стреляет
- Полоски здоровья, визуализация выстрелов (трассеры), всплывающие
  цифры урона
- Синтезированные звуковые эффекты (без внешних аудиофайлов)
- Меню паузы (Escape)

**Управление**

| Клавиша         | Действие                |
|-----------------|--------------------------|
| ↑ / ↓           | Движение вперёд / назад |
| ← / →           | Стрейф влево / вправо   |
| Мышь            | Обзор                    |
| Space / ЛКМ     | Стрельба                 |
| Escape          | Пауза / продолжить       |

### Как запустить

Открыть игру напрямую как `file://` не получится — браузеры блокируют
ES-модули при таком открытии. Нужен локальный статический сервер:

1. Скачай или склонируй эту папку.
2. Находясь внутри папки, запусти локальный сервер, например:
   ```bash
   python3 -m http.server 8000
   # или, если установлен Node.js:
   npx serve .
   ```
   (В VS Code можно вместо этого использовать расширение "Live Server".)
3. Открой в браузере `http://localhost:8000` (или порт, который покажет
   сервер).

Интернет не нужен — Three.js уже лежит локально в `vendor/three/`,
ничего не подгружается с CDN.
