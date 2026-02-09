# 🐍 Snake Word Hunt

**[Play in Browser](https://mesutkaval.github.io/snake_word_hunt/)** 🚀

Snake Word Hunt is a web-based game that combines classic snake mechanics with word building. You control a snake on a grid, collect letters, and form valid English words to score points. The game runs entirely in the browser with no installation or dependencies required. It has 10 levels with increasing speed and score targets, a 350,000+ word dictionary for validation, and various portal mechanics that add strategic depth.

![Gameplay](assets/animation.gif)

## 🎮 How to Play

### Controls
- **Arrow Keys** (⬅️⬆️⬇️➡️) — Move the snake
- **Space** — Start game / Advance to next level / Pause
- **Gamepad** — Full controller support (see in-game hints)

### Objective
Collect letters by moving the snake over them. Form valid English words (minimum 4 letters) and enter the **Center Portal** to submit. Reach the target score before time runs out to complete each level.

### Scoring & Rules
- Valid words earn points equal to their letter count.
- Invalid words lose points equal to their letter count **and** spawn wall portals on the map.
- Hitting a wall, your own tail, or a wall portal ends the game.
- Longer words unlock special portals (see Portal Guide below).

## 🌟 Game Features

- **10 Levels** — Snake speeds up and target score increases each level.
- **Dynamic Word Validation** — 350,000+ word English dictionary.
- **Penalty System** — Invalid words spawn wall portals on the map.
- **Visual & Sound Effects** — 8-bit retro sounds, particle effects, and neon graphics.

## 🌀 Portal Guide

The game features special portals with strategic importance:

| Icon | Name | Description |
| :---: | --- | --- |
| <img src="assets/portal_icons/merkez.png" width="50"> | **Center Portal** | Enter here to submit your word. The heart of the game. |
| <img src="assets/portal_icons/geri.png" width="50"> | **Undo Portal** | Appears on a **5-letter** word. Removes the last collected letter. |
| <img src="assets/portal_icons/zaman.png" width="50"> | **Time Portal** | Appears on **6+ letter** words. Adds **+30 seconds** to your timer. |
| <img src="assets/portal_icons/x2.png" width="50"> | **x2 Score Portal** | Appears on **7+ letter** words. Submit through this portal for **double points**. |
| <img src="assets/portal_icons/level_skip.png" width="50"> | **Level Skip Portal** | Appears on **8+ letter** words. Enter to **skip to the next level**. |
| <img src="assets/portal_icons/duvar.png" width="50"> | **Wall (Penalty) Portal** | Spawns when you submit an invalid word. Hitting it means **GAME OVER**. |

> **Note:** Undo, Time, x2, and Level Skip portals can only exist one at a time on the map. Unused portals carry over to the next level.

## 🚀 How to Run

### Play Online (Recommended)
No download needed. Open the link below in any modern browser:

👉 **[https://mesutkaval.github.io/snake_word_hunt/](https://mesutkaval.github.io/snake_word_hunt/)**

### Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/MesutKaval/snake_word_hunt.git
   ```
2. Open `index.html` directly in your browser. That's it — no build tools, no dependencies.
3. Alternatively, double-click `start_game.bat` to start a local server (requires Python).

## 🛠️ Technologies

- HTML5 Canvas
- Vanilla JavaScript (ES6+)
- CSS3 (Modern Design)

## 🤝 Contributing

Contributions are welcome. If you find a bug or have a feature idea:

1. Open an issue describing the problem or suggestion.
2. Fork the repo, make your changes, and submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

This game was designed by **Mesut Kaval**, with AI tools used during the coding process.
