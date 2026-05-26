# ✨ Constellation Explorer

An interactive, browser-based canvas app where you create and connect stars to build your own constellations — no libraries, no frameworks, just vanilla HTML/CSS/JS.

![screenshot](https://via.placeholder.com/800x450/03050f/7eb8f7?text=Constellation+Explorer)

## 🚀 Live Demo

Open `index.html` in any modern browser — no build step, no dependencies.

## 🌟 Features

- **Click** empty space to birth a new star (with spawn animation)
- **Connect Mode** (`C` key or button) — click two stars to draw a constellation link
- **Double-click** a star to name it
- **Right-click** a star to remove it
- **Random** — generates named constellations (Orion, Cygnus, Lyra, etc.) with one click
- **Save** — exports your sky as a PNG image
- Stars **gently drift** and **twinkle** in real time
- Fully animated glowing links with pulse effects
- Keyboard shortcuts: `C` = connect mode, `R` = random constellation, `Esc` = cancel

## 📁 Project Structure

```
constellation-explorer/
├── index.html   # Markup & layout
├── style.css    # Dark space aesthetic, Cinzel + Space Mono fonts
├── app.js       # Canvas engine, star/link logic, interactions
└── README.md
```

## 🎮 Controls

| Action | How |
|---|---|
| Add star | Click on empty canvas |
| Connect stars | Press `C`, then click two stars |
| Name a star | Double-click a star |
| Delete a star | Right-click a star |
| Random constellation | Click **Random** or press `R` |
| Save image | Click **Save** |
| Cancel / free mode | Press `Esc` |

## 🛠 Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- CSS Variables + animations
- Google Fonts (Cinzel, Space Mono)

## 📦 Getting Started

```bash
git clone https://github.com/Aksadio/constellation-explorer.git
cd constellation-explorer
# Open index.html in your browser, or:
npx serve .
```

## 📄 License

MIT — free to use, remix, and share.
