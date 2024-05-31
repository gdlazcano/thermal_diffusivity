import * as math from "mathjs";

const nodesCanvas = document.getElementById("nodes-canvas");

nodesCanvas.width = document.querySelector("#nodes").clientWidth;
nodesCanvas.height = document.querySelector("#nodes").clientHeight;

const context = nodesCanvas.getContext("2d");

const gridOffset = 30;
const gridWidth = nodesCanvas.width - 2 * gridOffset;
const gridHeight = nodesCanvas.height - 2 * gridOffset;

context.rect(gridOffset, gridOffset, gridWidth, gridHeight);
context.fillStyle = "#ffebba";
context.lineWidth = 5;
context.stroke();
context.fill();

const x = 2;
const y = 2;

const h = 2 / 3;

if ((x / h) % 1 !== 0 || (y / h) % 1 !== 0) {
  throw new Error("x, y and h must be such that x/h and y/h are integers.");
}

// 2 - nodeCanvas.width
// 0.1 - x

context.lineWidth = 1;

const normalizedHx = (gridWidth * h) / x;
const normalizedHy = (gridHeight * h) / y;

const numVerticalSections = gridWidth / normalizedHx;
const numHorizontalSections = gridHeight / normalizedHy;

for (let i = 0; i <= numVerticalSections; i++) {
  context.beginPath();
  context.moveTo(i * normalizedHx + gridOffset, gridOffset);
  context.lineTo(i * normalizedHx + gridOffset, gridHeight + gridOffset);
  context.stroke();
}

for (let j = 0; j <= numHorizontalSections; j++) {
  context.beginPath();
  context.moveTo(gridOffset, j * normalizedHy + gridOffset);
  context.lineTo(gridWidth + gridOffset, j * normalizedHy + gridOffset);
  context.stroke();
}

context.fillStyle = "black";
context.font = "12px Arial";

const fontOffset = 5;
context.fillStyle = "#ec008c";

let nodeRadius = 3;
for (let i = 1; i <= numVerticalSections - 1; i++) {
  for (let j = 1; j <= numHorizontalSections - 1; j++) {
    context.fillText(
      `P${i}${Math.abs(j - numHorizontalSections)}`,
      i * normalizedHx + gridOffset + fontOffset,
      j * normalizedHy + gridOffset - fontOffset,
    );
    context.beginPath();
    context.arc(
      i * normalizedHx + gridOffset,
      j * normalizedHy + gridOffset,
      nodeRadius,
      0,
      2 * Math.PI,
    );
    context.fill();
  }
}

nodeRadius = 4;
context.fillStyle = "black";

// Boundary condition
for (let i = 0; i <= numVerticalSections; i++) {
  context.beginPath();
  context.arc(
    i * normalizedHx + gridOffset,
    gridOffset,
    nodeRadius,
    0,
    2 * Math.PI,
  );
  context.fill();
}

for (let i = 0; i <= numVerticalSections; i++) {
  context.beginPath();
  context.arc(
    i * normalizedHx + gridOffset,
    gridHeight + gridOffset,
    nodeRadius,
    0,
    2 * Math.PI,
  );
  context.fill();
}

for (let j = 0; j <= numHorizontalSections; j++) {
  context.beginPath();
  context.arc(
    gridOffset,
    j * normalizedHy + gridOffset,
    nodeRadius,
    0,
    2 * Math.PI,
  );
  context.fill();
}

for (let j = 0; j <= numHorizontalSections; j++) {
  context.beginPath();
  context.arc(
    gridWidth + gridOffset,
    j * normalizedHy + gridOffset,
    nodeRadius,
    0,
    2 * Math.PI,
  );
  context.fill();
}

let u = [];

for (let i = 0; i <= numVerticalSections; i++) {
  let row = [];
  for (let j = 0; j <= numHorizontalSections; j++) {
    if (
      i === 0 ||
      i === numVerticalSections ||
      j === 0 ||
      j === numHorizontalSections
    ) {
      row[j] = 3;
    } else {
      row[j] = 1;
    }
  }
  u[i] = row;
}


let matrix = [];


for (let i = 1; i <= u.length - 2; i++) {
    for (let j = 1; j <= u.length - 2; j++) {
        let solution = new Array(u.length * u.length).fill(0);
        solution[i * u.length + j] = -4;
        
        solution[i * u.length + j - 1] = u[i][j - 1];
        solution[i * u.length + j + 1] = u[i][j + 1];
        solution[(i - 1) * u.length + j] = u[i - 1][j];
        solution[(i + 1) * u.length + j] = u[i + 1][j];
        
        matrix.push(solution);
    }
}

