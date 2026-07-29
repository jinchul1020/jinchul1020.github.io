(() => {
  const canvas = document.querySelector("#game-canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const grid = 20;
  const columns = canvas.width / grid;
  const rows = canvas.height / grid;
  const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const enemyCount = 5;
  const enemyActiveMs = 5000;
  const enemyRespawnMs = 2000;
  const state = { ready: "ready", running: "running", paused: "paused", gameOver: "gameover", won: "won" };
  const game = { phase: state.ready, snake: [], direction: directions.right, nextDirection: directions.right, food: null, enemies: [], score: 0, lives: 2, highScore: readHighScore(), elapsed: 0, lastFrame: 0, moveTimer: 0, enemyTimer: 0, animationFrame: 0, lastHit: 0 };

  const scoreElement = document.querySelector("[data-score]");
  const livesElement = document.querySelector("[data-lives]");
  const highScoreElement = document.querySelector("[data-high-score]");
  const statusElement = document.querySelector("[data-game-status]");
  const overlay = document.querySelector("[data-game-overlay]");
  const messageElement = document.querySelector("[data-game-message]");
  const startButton = document.querySelector("[data-game-start]");
  const pauseButton = document.querySelector("[data-game-pause]");
  const restartButton = document.querySelector("[data-game-restart]");

  function readHighScore() { try { return Number(localStorage.getItem("pixel-rescue-high-score")) || 0; } catch { return 0; } }
  function saveHighScore() { if (game.score <= game.highScore) return; game.highScore = game.score; try { localStorage.setItem("pixel-rescue-high-score", String(game.highScore)); } catch { /* storage is optional */ } }
  function same(a, b) { return a && b && a.x === b.x && a.y === b.y; }
  function randomCell() { return { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) }; }
  function occupied(cell, includeEnemies = true) { return game.snake.some((segment) => same(segment, cell)) || (includeEnemies && game.enemies.some((enemy) => enemy.phase === "active" && same(enemy, cell))); }
  function placeFood() { let cell; let attempts = 0; do { cell = randomCell(); attempts += 1; } while (occupied(cell) && attempts < 100); game.food = cell; }
  function createEnemy() { let cell; let attempts = 0; do { cell = randomCell(); attempts += 1; } while (occupied(cell) && attempts < 100); return { ...cell, dx: Math.random() > .5 ? 1 : -1, dy: 0, phase: "active", age: 0, explosion: 0 }; }
  function resetSnake() { game.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]; game.direction = directions.right; game.nextDirection = directions.right; }
  function resetGame() { game.phase = state.ready; game.score = 0; game.lives = 2; game.elapsed = 0; game.moveTimer = 0; game.enemyTimer = 0; game.lastFrame = 0; game.lastHit = 0; resetSnake(); game.enemies = Array.from({ length: enemyCount }, createEnemy); placeFood(); updateHud(); draw(); showOverlay("START MISSION"); }
  function startGame() { if (game.phase === state.running) return; if (game.phase === state.gameOver || game.phase === state.won) resetGame(); game.phase = state.running; hideOverlay(); pauseButton.disabled = false; runFrame(performance.now()); }
  function pauseGame() { if (game.phase !== state.running && game.phase !== state.paused) return; if (game.phase === state.running) { game.phase = state.paused; showOverlay("PAUSED"); pauseButton.textContent = "RESUME"; } else { game.phase = state.running; hideOverlay(); pauseButton.textContent = "PAUSE"; runFrame(performance.now()); } updateHud(); }
  function restartGame() { cancelAnimationFrame(game.animationFrame); resetGame(); pauseButton.disabled = true; pauseButton.textContent = "PAUSE"; }
  function setDirection(name) { const next = directions[name]; if (!next || game.phase === state.gameOver || game.phase === state.won) return; if (next.x + game.direction.x === 0 && next.y + game.direction.y === 0) return; game.nextDirection = next; }
  function moveSnake() { game.direction = game.nextDirection; const head = { x: game.snake[0].x + game.direction.x, y: game.snake[0].y + game.direction.y }; head.x = (head.x + columns) % columns; head.y = (head.y + rows) % rows; const hitSelf = game.snake.some((segment, index) => index > 0 && same(segment, head)); const hitEnemy = game.enemies.some((enemy) => enemy.phase === "active" && same(enemy, head)); if (hitSelf || hitEnemy) { loseLife(); return; } game.snake.unshift(head); if (same(head, game.food)) { game.score += 1; saveHighScore(); placeFood(); } else { game.snake.pop(); } }
  function loseLife() { const now = performance.now(); if (now - game.lastHit < 700) return; game.lastHit = now; game.lives -= 1; if (game.lives <= 0) { game.phase = state.gameOver; cancelAnimationFrame(game.animationFrame); showOverlay("GAME OVER"); } else { resetSnake(); } updateHud(); }
  function updateEnemies(delta) { game.enemies.forEach((enemy) => { if (enemy.phase === "active") { enemy.age += delta; if (enemy.age >= enemyActiveMs) { enemy.phase = "exploding"; enemy.explosion = 0; } else { enemy.x += enemy.dx; if (enemy.x < 0 || enemy.x >= columns) enemy.dx *= -1; if (Math.random() < .015) enemy.dy = enemy.dy === 0 ? (Math.random() > .5 ? 1 : -1) : 0; enemy.y += enemy.dy; if (enemy.y < 0 || enemy.y >= rows) enemy.dy *= -1; } } else { enemy.explosion += delta; if (enemy.explosion >= enemyRespawnMs) { const fresh = createEnemy(); Object.assign(enemy, fresh); } } }); const head = game.snake[0]; if (game.enemies.some((enemy) => enemy.phase === "exploding" && Math.abs(enemy.x - head.x) <= 1 && Math.abs(enemy.y - head.y) <= 1)) loseLife(); }
  function update(delta) { game.elapsed += delta; game.moveTimer += delta; game.enemyTimer += delta; if (game.moveTimer >= 180) { game.moveTimer = 0; moveSnake(); } updateEnemies(delta); if (Math.floor(game.elapsed / 10000) > game.score) { game.score += 1; saveHighScore(); } if (game.score >= 10) { game.phase = state.won; cancelAnimationFrame(game.animationFrame); showOverlay("MISSION COMPLETE"); } updateHud(); }
  function runFrame(timestamp) { if (game.phase !== state.running) return; const delta = Math.min(timestamp - (game.lastFrame || timestamp), 100); game.lastFrame = timestamp; update(delta); draw(); if (game.phase === state.running) game.animationFrame = requestAnimationFrame(runFrame); }
  function drawPixelCharacter(x, y, color, enemy = false, head = false) { const px = x * grid; const py = y * grid; if (head && !enemy) { context.fillStyle = "#d94f45"; context.fillRect(px + 3, py + 3, 14, 5); context.fillRect(px + 6, py + 1, 9, 3); context.fillStyle = "#f3b58a"; context.fillRect(px + 5, py + 8, 11, 7); context.fillStyle = "#24152a"; context.fillRect(px + 7, py + 10, 2, 2); context.fillRect(px + 12, py + 10, 2, 2); context.fillRect(px + 7, py + 14, 8, 2); context.fillStyle = "#f2b84b"; context.fillRect(px + 4, py + 16, 12, 2); return; } context.fillStyle = color; context.fillRect(px + 3, py + 3, 14, 14); context.fillStyle = enemy ? "#331a25" : "#251a2b"; context.fillRect(px + 6, py + 6, 3, 3); context.fillRect(px + 12, py + 6, 3, 3); context.fillStyle = enemy ? "#e78950" : "#f2b84b"; context.fillRect(px + 5, py + 13, 10, 3); }
  function drawDungeonBackground() { context.fillStyle = "#17102f"; context.fillRect(0, 0, canvas.width, canvas.height); for (let x = 0; x < columns; x += 1) for (let y = 0; y < rows; y += 1) { context.fillStyle = (x + y) % 2 === 0 ? "#211447" : "#26194f"; context.fillRect(x * grid, y * grid, grid, grid); context.strokeStyle = "#3a2765"; context.strokeRect(x * grid, y * grid, grid, grid); } context.fillStyle = "#f2b84b"; [3, 12, 20].forEach((x) => { context.fillRect(x * grid + 8, 2 * grid + 5, 5, 5); context.fillRect(x * grid + 5, 2 * grid + 8, 11, 2); }); context.fillStyle = "#6c3d9e"; context.fillRect(1 * grid, 13 * grid, 3 * grid, grid); context.fillRect(19 * grid, 13 * grid, 3 * grid, grid); }
  function draw() { drawDungeonBackground(); game.snake.slice().reverse().forEach((segment, index) => drawPixelCharacter(segment.x, segment.y, index === game.snake.length - 1 ? "#8dd35f" : "#4d9c63", false, index === game.snake.length - 1)); if (game.food) { context.fillStyle = "#f26b5e"; context.fillRect(game.food.x * grid + 5, game.food.y * grid + 5, 10, 10); context.fillStyle = "#f7f1d2"; context.fillRect(game.food.x * grid + 8, game.food.y * grid + 7, 2, 2); } game.enemies.forEach((enemy) => { if (enemy.phase === "active") drawPixelCharacter(enemy.x, enemy.y, "#d65c4e", true); else { context.fillStyle = "#f2b84b"; context.beginPath(); context.arc(enemy.x * grid + 10, enemy.y * grid + 10, Math.min(9, 3 + enemy.explosion / 180), 0, Math.PI * 2); context.fill(); } }); }
  function updateHud() { scoreElement.textContent = String(game.score); livesElement.textContent = "❤".repeat(Math.max(0, game.lives)); highScoreElement.textContent = String(game.highScore); statusElement.textContent = game.phase.toUpperCase(); pauseButton.disabled = ![state.running, state.paused].includes(game.phase); }
  function showOverlay(message) { messageElement.textContent = message; overlay.classList.remove("is-hidden"); }
  function hideOverlay() { overlay.classList.add("is-hidden"); }
  function onKeyDown(event) { const keyMap = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" }; if (keyMap[event.key]) { event.preventDefault(); setDirection(keyMap[event.key]); if (game.phase === state.ready) startGame(); } if (event.key === " " || event.key === "p" || event.key === "P") { event.preventDefault(); pauseGame(); } }
  document.addEventListener("keydown", onKeyDown); startButton.addEventListener("click", startGame); pauseButton.addEventListener("click", pauseGame); restartButton.addEventListener("click", restartGame); document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("pointerdown", () => { setDirection(button.dataset.direction); if (game.phase === state.ready) startGame(); }));
  window.__pixelRescueGame = { game, startGame, pauseGame, restartGame, setDirection, state };
  resetGame();
})();
