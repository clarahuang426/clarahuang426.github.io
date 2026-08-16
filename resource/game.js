const MIN_DISKS = 3;
const MAX_DISKS = 7;
const SOLUTION_DELAY = 520;

const state = {
  diskCount: 3,
  towers: [[], [], []],
  selectedTower: null,
  moves: 0,
  solving: false,
  solutionTimer: null,
};

const moveCount = document.querySelector("#move-count");
const diskCount = document.querySelector("#disk-count");
const optimalCount = document.querySelector("#optimal-count");
const status = document.querySelector("#game-status");
const minusButton = document.querySelector("#disk-minus");
const plusButton = document.querySelector("#disk-plus");
const restartButton = document.querySelector("#restart-button");
const solveButton = document.querySelector("#solve-button");
const stopButton = document.querySelector("#stop-button");
const towerButtons = [...document.querySelectorAll(".tower")];

function setStatus(message) {
  status.textContent = message;
}

function resetGame(message = "Select a tower to pick up its top disk.") {
  stopSolution();
  state.towers = [[], [], []];
  for (let size = state.diskCount; size >= 1; size -= 1) state.towers[0].push(size);
  state.selectedTower = null;
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
    button.classList.toggle("selected", state.selectedTower === towerIndex);
    button.disabled = state.solving;
    const stack = button.querySelector(".disk-stack");
    stack.innerHTML = "";

    state.towers[towerIndex].forEach((size) => {
      const disk = document.createElement("span");
      disk.className = "disk";
      disk.dataset.size = size;
      disk.style.width = `${31 + (size / state.diskCount) * 64}%`;
      stack.appendChild(disk);
    });

    const disks = state.towers[towerIndex].length;
    button.setAttribute("aria-label", `Tower ${String.fromCharCode(65 + towerIndex)}, ${disks} ${disks === 1 ? "disk" : "disks"}`);
  });
}

function flashInvalid(towerIndex) {
  const tower = towerButtons[towerIndex];
  tower.classList.remove("invalid");
  requestAnimationFrame(() => tower.classList.add("invalid"));
  window.setTimeout(() => tower.classList.remove("invalid"), 350);
}

function handleTowerClick(destination) {
  if (state.solving) return;

  if (state.selectedTower === null) {
    if (state.towers[destination].length === 0) {
      flashInvalid(destination);
      setStatus("That tower is empty. Choose a tower with a disk.");
      return;
    }
    state.selectedTower = destination;
    setStatus(`Disk selected from tower ${String.fromCharCode(65 + destination)}. Now choose its destination.`);
    render();
    return;
  }

  const source = state.selectedTower;
  if (source === destination) {
    state.selectedTower = null;
    setStatus("Selection cleared. Choose a tower.");
    render();
    return;
  }

  const disk = state.towers[source][state.towers[source].length - 1];
  const destinationTop = state.towers[destination][state.towers[destination].length - 1];

  if (destinationTop !== undefined && destinationTop < disk) {
    flashInvalid(destination);
    setStatus("That move is not allowed—a larger disk cannot cover a smaller one.");
    return;
  }

  state.towers[source].pop();
  state.towers[destination].push(disk);
  state.selectedTower = null;
  state.moves += 1;

  if (state.towers[2].length === state.diskCount) {
    setStatus(`Puzzle solved in ${state.moves} moves! ${state.moves === (2 ** state.diskCount) - 1 ? "That is a perfect score." : "Nicely done."}`);
  } else {
    setStatus(`Good move. ${state.moves} ${state.moves === 1 ? "move" : "moves"} used so far.`);
  }
  render();
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
      setStatus(`Solution complete in ${state.moves} moves—the fewest possible.`);
      render();
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

function changeDiskCount(amount) {
  const nextCount = Math.min(MAX_DISKS, Math.max(MIN_DISKS, state.diskCount + amount));
  if (nextCount === state.diskCount) return;
  state.diskCount = nextCount;
  resetGame(`Ready with ${state.diskCount} disks. The best possible score is ${(2 ** state.diskCount) - 1} moves.`);
}

towerButtons.forEach((button) => {
  button.addEventListener("click", () => handleTowerClick(Number(button.dataset.tower)));
});

minusButton.addEventListener("click", () => changeDiskCount(-1));
plusButton.addEventListener("click", () => changeDiskCount(1));
restartButton.addEventListener("click", () => resetGame("Fresh start. Select a tower to begin."));
solveButton.addEventListener("click", startSolution);
stopButton.addEventListener("click", () => {
  stopSolution();
  setStatus("Solution paused. Restart the game or continue from here.");
  render();
});

resetGame();
