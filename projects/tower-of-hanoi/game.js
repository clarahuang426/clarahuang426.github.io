const MIN_DISKS = 3;
const MAX_DISKS = 7;
const SOLUTION_DELAY = 520;

const state = {
  diskCount: 3,
  towers: [[], [], []],
  moves: 0,
  solving: false,
  solutionTimer: null,
  drag: null,
};

const board = document.querySelector("#board");
const moveCount = document.querySelector("#move-count");
const diskCount = document.querySelector("#disk-count");
const optimalCount = document.querySelector("#optimal-count");
const status = document.querySelector("#game-status");
const minusButton = document.querySelector("#disk-minus");
const plusButton = document.querySelector("#disk-plus");
const restartButton = document.querySelector("#restart-button");
const solveButton = document.querySelector("#solve-button");
const stopButton = document.querySelector("#stop-button");
const celebration = document.querySelector("#celebration");
const celebrationScore = document.querySelector("#celebration-score");
const celebrationRestart = document.querySelector("#celebration-restart");
const confettiLayer = document.querySelector("#confetti-layer");
const fireworksLayer = document.querySelector("#fireworks-layer");
const towerButtons = [...document.querySelectorAll(".tower")];

function setStatus(message) { status.textContent = message; }

function resetGame(message = "Drag the top disk to another tower.") {
  stopSolution();
  hideCelebration();
  cancelDrag();
  state.towers = [[], [], []];
  for (let size = state.diskCount; size >= 1; size -= 1) state.towers[0].push(size);
  state.moves = 0;
  setStatus(message);
  render();
}

function render() {
  moveCount.textContent = state.moves;
  diskCount.textContent = state.diskCount;
  optimalCount.textContent = (2 ** state.diskCount) - 1;
  minusButton.disabled = state.solving || state.diskCount === MIN_DISKS;
  plusButton.disabled = state.solving || state.diskCount === MAX_DISKS;
  solveButton.disabled = state.solving;
  stopButton.hidden = !state.solving;

  towerButtons.forEach((button, towerIndex) => {
    button.disabled = state.solving;
    const stack = button.querySelector(".disk-stack");
    stack.innerHTML = "";
    state.towers[towerIndex].forEach((size, index) => {
      const disk = document.createElement("span");
      disk.className = "disk";
      if (index === state.towers[towerIndex].length - 1 && !state.solving) disk.classList.add("top-disk");
      disk.dataset.size = size;
      disk.dataset.tower = towerIndex;
      disk.style.width = `${31 + (size / state.diskCount) * 64}%`;
      stack.appendChild(disk);
    });
    const disks = state.towers[towerIndex].length;
    button.setAttribute("aria-label", `Tower ${String.fromCharCode(65 + towerIndex)}, ${disks} ${disks === 1 ? "disk" : "disks"}`);
  });
}

function getDropTower(x, y) {
  const element = document.elementFromPoint(x, y);
  const tower = element?.closest(".tower");
  return tower ? Number(tower.dataset.tower) : null;
}

function canDrop(source, destination, disk) {
  if (destination === null || destination === source) return destination === source;
  const top = state.towers[destination].at(-1);
  return top === undefined || top > disk;
}

function clearDropTargets() {
  towerButtons.forEach((tower) => tower.classList.remove("drop-target", "valid", "invalid-drop"));
}

function updateDropTarget(destination) {
  clearDropTargets();
  if (destination === null || !state.drag) return;
  const valid = canDrop(state.drag.source, destination, state.drag.disk);
  towerButtons[destination].classList.add("drop-target", valid ? "valid" : "invalid-drop");
}

function startDrag(event) {
  const diskElement = event.target.closest(".top-disk");
  if (!diskElement || state.solving || event.button > 0) return;
  event.preventDefault();
  const rect = diskElement.getBoundingClientRect();
  const ghost = diskElement.cloneNode(true);
  ghost.classList.remove("top-disk");
  ghost.classList.add("dragging");
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);
  diskElement.classList.add("drag-source");

  state.drag = {
    source: Number(diskElement.dataset.tower),
    disk: Number(diskElement.dataset.size),
    sourceElement: diskElement,
    ghost,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  moveDraggedDisk(event.clientX, event.clientY);
  board.setPointerCapture(event.pointerId);
  setStatus(`Dragging disk ${state.drag.disk}. Drop it on a valid tower.`);
}

function moveDraggedDisk(x, y) {
  if (!state.drag) return;
  state.drag.ghost.style.left = `${x - state.drag.offsetX}px`;
  state.drag.ghost.style.top = `${y - state.drag.offsetY}px`;
}

function moveDrag(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;
  event.preventDefault();
  moveDraggedDisk(event.clientX, event.clientY);
  updateDropTarget(getDropTower(event.clientX, event.clientY));
}

function finishDrag(event) {
  if (!state.drag || event.pointerId !== state.drag.pointerId) return;
  const { source, disk } = state.drag;
  const destination = getDropTower(event.clientX, event.clientY);
  const valid = canDrop(source, destination, disk);
  cancelDrag();

  if (destination === null || destination === source) {
    setStatus("Disk returned to its tower. Drag it to another tower when ready.");
    render();
    return;
  }
  if (!valid) {
    flashInvalid(destination);
    setStatus("That move is not allowed - a larger disk cannot cover a smaller one.");
    render();
    return;
  }

  state.towers[source].pop();
  state.towers[destination].push(disk);
  state.moves += 1;
  render();
  if (state.towers[2].length === state.diskCount) {
    setStatus(`Puzzle solved in ${state.moves} moves!`);
    showCelebration();
  } else {
    setStatus(`Great move. ${state.moves} ${state.moves === 1 ? "move" : "moves"} used so far.`);
  }
}

function cancelDrag() {
  if (state.drag) {
    state.drag.sourceElement?.classList.remove("drag-source");
    state.drag.ghost?.remove();
  }
  state.drag = null;
  clearDropTargets();
}

function flashInvalid(towerIndex) {
  const tower = towerButtons[towerIndex];
  tower.classList.remove("invalid");
  requestAnimationFrame(() => tower.classList.add("invalid"));
  window.setTimeout(() => tower.classList.remove("invalid"), 350);
}

function buildSolution(number, source, destination, helper, moves = []) {
  if (number === 0) return moves;
  buildSolution(number - 1, source, helper, destination, moves);
  moves.push([source, destination]);
  buildSolution(number - 1, helper, destination, source, moves);
  return moves;
}

function startSolution() {
  resetGame();
  state.solving = true;
  const moves = buildSolution(state.diskCount, 0, 2, 1);
  let index = 0;
  setStatus(`Showing the shortest solution: ${moves.length} moves.`);
  render();
  const makeNextMove = () => {
    if (!state.solving) return;
    if (index >= moves.length) {
      state.solving = false;
      state.solutionTimer = null;
      setStatus(`Solution complete in ${state.moves} moves - the fewest possible.`);
      render();
      showCelebration();
      return;
    }
    const [source, destination] = moves[index];
    state.towers[destination].push(state.towers[source].pop());
    state.moves += 1;
    index += 1;
    setStatus(`Solution move ${index} of ${moves.length}.`);
    render();
    state.solutionTimer = window.setTimeout(makeNextMove, SOLUTION_DELAY);
  };
  state.solutionTimer = window.setTimeout(makeNextMove, 400);
}

function stopSolution() {
  if (state.solutionTimer) window.clearTimeout(state.solutionTimer);
  state.solutionTimer = null;
  state.solving = false;
}

function createCelebrationEffects() {
  confettiLayer.innerHTML = "";
  fireworksLayer.innerHTML = "";
  const colors = ["#ff3b30", "#ffd60a", "#00c7ff", "#39ff6f", "#b7ff39", "#00f5d4", "#ff4fd8", "#ffffff"];
  for (let i = 0; i < 90; i += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--duration", `${3.5 + Math.random() * 3}s`);
    piece.style.setProperty("--delay", `${Math.random() * -5}s`);
    piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    confettiLayer.appendChild(piece);
  }
  [[15, 22, 0], [85, 20, .38], [50, 68, .78], [28, 72, 1.15], [72, 65, 1.42]].forEach(([left, top, delay], fireworkIndex) => {
    const firework = document.createElement("span");
    firework.className = "firework";
    firework.style.left = `${left}%`;
    firework.style.top = `${top}%`;
    for (let i = 0; i < 32; i += 1) {
      const spark = document.createElement("i");
      spark.className = "spark";
      spark.style.setProperty("--angle", `${i * 11.25}deg`);
      spark.style.setProperty("--distance", `${180 + (i % 4) * 35}px`);
      spark.style.setProperty("--fire-delay", `${delay}s`);
      spark.style.setProperty("--spark", colors[(i + fireworkIndex) % colors.length]);
      firework.appendChild(spark);
    }
    fireworksLayer.appendChild(firework);
  });
}

function showCelebration() {
  celebrationScore.textContent = `You solved ${state.diskCount} disks in ${state.moves} moves.`;
  createCelebrationEffects();
  celebration.hidden = false;
  celebrationRestart.focus();
}

function hideCelebration() {
  celebration.hidden = true;
  confettiLayer.innerHTML = "";
  fireworksLayer.innerHTML = "";
}

function changeDiskCount(amount) {
  const nextCount = Math.min(MAX_DISKS, Math.max(MIN_DISKS, state.diskCount + amount));
  if (nextCount === state.diskCount) return;
  state.diskCount = nextCount;
  resetGame(`Ready with ${state.diskCount} disks. Drag the top disk to begin.`);
}

board.addEventListener("pointerdown", startDrag);
board.addEventListener("pointermove", moveDrag);
board.addEventListener("pointerup", finishDrag);
board.addEventListener("pointercancel", () => { cancelDrag(); render(); });
minusButton.addEventListener("click", () => changeDiskCount(-1));
plusButton.addEventListener("click", () => changeDiskCount(1));
restartButton.addEventListener("click", () => resetGame("Fresh start. Drag the top disk to begin."));
solveButton.addEventListener("click", startSolution);
stopButton.addEventListener("click", () => { stopSolution(); setStatus("Solution paused. Restart or continue by dragging a disk."); render(); });
celebrationRestart.addEventListener("click", () => resetGame("Fresh start. Drag the top disk to begin."));

resetGame();
