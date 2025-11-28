/*
  Consolidated Tetris implementation
*/
const canvas = document.getElementById('tetris-board');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startButton = document.getElementById('start-button');
const messageEl = document.getElementById('message');
const gridToggleEl = document.getElementById('grid-toggle');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30; // pixel size (in CSS units scaled by canvas)

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

// We draw in logical units (blocks) and scale the canvas transform so drawRect( x,y,1,1 ) == one block
context.scale(BLOCK, BLOCK);
// We'll manage transforms inside drawNext so we don't apply a permanent scaling here

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

const pieces = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[2,0,0],[2,2,2],[0,0,0]],
  L: [[0,0,3],[3,3,3],[0,0,0]],
  O: [[4,4],[4,4]],
  S: [[0,5,5],[5,5,0],[0,0,0]],
  T: [[0,6,0],[6,6,6],[0,0,0]],
  Z: [[7,7,0],[0,7,7],[0,0,0]]
};

const colors = [null, '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        // inner shade for depth
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + offset.x + 0.05, y + offset.y + 0.05, 0.9, 0.9);
      }
    });
  });
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(arena, player) {
  const m = player.matrix;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + player.pos.y] && arena[y + player.pos.y][x + player.pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function createPiece(type) {
  return pieces[type].map(row => row.slice());
}

function randomPiece() {
  const keys = Object.keys(pieces);
  return keys[(keys.length * Math.random()) | 0];
}

function sweepRows(arena) {
  let rowCount = 1;
  let score = 0;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    score = rowCount * 10;
    rowCount *= 2;
  }
  return score;
}

const arena = createMatrix(COLS, ROWS);

const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  next: null,
  score: 0
};

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    const s = sweepRows(arena);
    if (s > 0) player.score += s;
    updateScore();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate(dir) {
  const pos = player.pos.x;
  rotate(player.matrix, dir);
  let offset = 1;
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
  }
}

function playerReset() {
  if (!player.next) {
    player.next = createPiece(randomPiece());
  }
  player.matrix = player.next;
  player.next = createPiece(randomPiece());
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    isRunning = false;
    startButton.textContent = 'RESTART';
    if (messageEl) messageEl.textContent = 'GAME OVER';
  }
}

function draw() {
  // clear board area
  context.fillStyle = '#071028';
  context.fillRect(0, 0, canvas.width / BLOCK, canvas.height / BLOCK);

  drawMatrix(arena, {x:0,y:0});
  if (showGrid) drawBoardGrid();
  if (player.matrix) drawMatrix(player.matrix, player.pos);
}

function drawNext() {
  // draw background in device pixels (reset transform so sizes are in px)
  nextCtx.setTransform(1, 0, 0, 1, 0, 0);
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = 'rgba(255,255,255,0.03)';
  nextCtx.fillRect(0,0,nextCanvas.width, nextCanvas.height);

  // Draw piece using block-scaling (1 unit == BLOCK px)
  nextCtx.setTransform(BLOCK, 0, 0, BLOCK, 0, 0);
  if (player.next) drawMatrix(player.next, {x:1,y:1}, nextCtx);

  // Draw grid overlay in device pixels
  if (showGrid) drawNextGrid();
}

let dropCounter = 0;
let dropInterval = 1000; // ms
let lastTime = 0;
let isRunning = false;
let showGrid = true; // default - enabled

// draw main board grid (pixel-precise) using canvas pixel coordinates
function drawBoardGrid() {
  context.save();
  // reset transform so we draw in physical pixels (1 unit = 1 pixel)
  context.setTransform(1, 0, 0, 1, 0, 0);
  const w = canvas.width;
  const h = canvas.height;
  context.strokeStyle = 'rgba(255,255,255,0.06)';
  context.lineWidth = 1;
  // draw vertical lines
  for (let x = 0; x <= w; x += BLOCK) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, h);
    context.stroke();
  }
  // draw horizontal lines
  for (let y = 0; y <= h; y += BLOCK) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(w, y + 0.5);
    context.stroke();
  }
  context.restore();
}

// draw grid inside next preview (4x4 grid commonly used)
function drawNextGrid() {
  nextCtx.save();
  nextCtx.setTransform(1, 0, 0, 1, 0, 0);
  const w = nextCanvas.width;
  const h = nextCanvas.height;
  const cell = Math.floor(Math.min(w, h) / 4);
  nextCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  nextCtx.lineWidth = 1;
  for (let x = 0; x <= w; x += cell) {
    nextCtx.beginPath();
    nextCtx.moveTo(x + 0.5, 0);
    nextCtx.lineTo(x + 0.5, h);
    nextCtx.stroke();
  }
  for (let y = 0; y <= h; y += cell) {
    nextCtx.beginPath();
    nextCtx.moveTo(0, y + 0.5);
    nextCtx.lineTo(w, y + 0.5);
    nextCtx.stroke();
  }
  nextCtx.restore();
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();

  draw();
  drawNext();

  if (isRunning) requestAnimationFrame(update);
}

function updateScore() {
  scoreEl.textContent = player.score;
}

document.addEventListener('keydown', event => {
  // Prevent default Space behaviour so it doesn't activate buttons when focused
  if (event.code === 'Space' || event.key === ' ') event.preventDefault();
  if (!isRunning) return;
  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'ArrowUp') playerRotate(1);
  else if (event.code === 'Space' || event.key === ' ') {
    // hard drop
    while (!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    merge(arena, player);
    const s = sweepRows(arena); if (s>0) player.score += s; updateScore(); playerReset();
    dropCounter = 0;
  }
});

startButton.addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true; startButton.textContent = 'PAUSE';
    // remove focus so Space won't retrigger this button
    startButton.blur();
    if (messageEl) messageEl.textContent = '';
    player.score = 0; updateScore();
    // clear arena
    for (let y = 0; y < ROWS; ++y) arena[y].fill(0);
    player.pos = {x: 0, y: 0};
    player.next = createPiece(randomPiece());
    playerReset();
    lastTime = 0; dropCounter = 0; requestAnimationFrame(update);
  } else {
    isRunning = false; startButton.textContent = 'RESUME';
    if (messageEl) messageEl.textContent = 'PAUSED';
    startButton.blur();
  }
});

// initial draw
player.next = createPiece(randomPiece());
// wire grid toggle control
if (gridToggleEl) {
  showGrid = gridToggleEl.checked;
  gridToggleEl.addEventListener('change', e => {
    showGrid = e.target.checked;
    draw(); drawNext();
  });
}

draw(); drawNext();

