window.onload = async () => {
      let baseDiv = document.getElementById(`baseGrid`);
      let baseGrid = createClickableSVGGrid(baseDiv, 15, 15);

      let centerDiv = document.getElementById(`gridMatches`);
      // let gridString = "?????.?????.????????.?????.??????????????.?????????.????.???...???????????????.???..???...????.????.??????????.???.??????????.????.????...???..???.???????????????...???.????.?????????.??????????????.?????.????????.?????.?????";
      // createSVGGrid({ parentElement: centerDiv, gridHeight: 15, gridWidth: 15, gridString: gridString });
}

function deleteSVG() {
      this.remove();
}

function addToGrids() {
      let gridDiv = document.getElementById(`searchGrids`);
      let svg = document.getElementById(`userGridSVG`);
      let text = document.getElementById(`warningText`);
      let importantSquares = 0;
      svg.querySelectorAll(".cellFill").forEach(cell => {
            if(Array.from(cell.classList).includes(`block`) || Array.from(cell.classList).includes(`default`)) {
                  importantSquares++;
            }
      });
      if(importantSquares > 4) {
            text.innerHTML = ``;
            let newSVG = svg.cloneNode(true);
            newSVG.id = Array.from(gridDiv.children).length;
            newSVG.setAttribute('width', 262 + 'px');
            newSVG.setAttribute('height', 262 + 'px');
            newSVG.querySelectorAll(".cellFill").forEach(cell => {
                  cell.onclick = null;
            });
            newSVG.classList.add(`clickable`);
            newSVG.onclick = deleteSVG;

            let centerID = Math.round(svg.gridHeight * svg.gridWidth / 2) - 1;
            let keptCells = getNeighborIDs(centerID, svg.gridHeight, svg.gridWidth);
            keptCells.push(centerID);
            svg.querySelectorAll(".cellFill").forEach(cell => {
                  if (keptCells.includes(Number(cell.id))) {
                        cell.parentElement.style.visibility = `visible`;
                        if (cell.id == centerID) {
                              cell.classList.remove('block');
                              cell.classList.add('default');
                              cell.classList.remove('none');
                        } else {
                              cell.classList.remove('block');
                              cell.classList.remove('default');
                              cell.classList.add('none');
                        }
                  } else {
                        cell.parentElement.style.visibility = `hidden`;
                        cell.classList.remove('block');
                        cell.classList.remove('default');
                        cell.classList.remove('none');
                  }
            });
            gridDiv.appendChild(newSVG);
      } else {
            text.innerHTML = `Not enough squares selected!`;
      }
}

function downloadCrossFire() {
      const filename = `grid.cfp`;
      let gridString = '-'.repeat(this.gridHeight * this.gridWidth);
      this.querySelectorAll(".default").forEach(cell => {
            let gridArray = gridString.split('');
            gridArray[cell.id] = `-`;
            gridString = gridArray.join('');
      });
      this.querySelectorAll(".block").forEach(cell => {
            let gridArray = gridString.split('');
            gridArray[cell.id] = `.`;
            gridString = gridArray.join('');
      });
      let gridData = ``;
      for (i = 0; i < this.gridHeight; i++) {
            gridData += gridString.slice(i * this.gridWidth, (i + 1) * this.gridWidth);
            gridData += `\n`;
      }
      let data = `<?xml version="1.0" encoding="utf-8" standalone="no"?>\n<CROSSFIRE>\n    <VERSION>1</VERSION>\n    <TITLE/>\n    <AUTHOR/>\n    <COPYRIGHT/>\n    <GRID width="${this.gridWidth}">\n${gridData}</GRID>\n    <NOTES/>\n</CROSSFIRE>\n`;
      const blob = new Blob([data], { type: 'text/plain' || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      document.body.appendChild(a);

      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(a);
}

async function searchForGrid() {
      let userStrings = getGridStrings();
      let text = document.getElementById(`warningText`);
      if(!userStrings.length) {
            text.innerHTML = `No grids to search for!`;
            return;
      } else {
            text.innerHTML = ``;
      }
      let allGrids = await fetchCSV('./grids.csv');
      let allGridDiv = document.getElementById(`gridMatches`);
      allGridDiv.innerHTML = ``;
      let totalMatches = 0;
      for (grid of allGrids) {
            let gridString = grid[2];
            let gridWidth = parseInt(grid[0]);
            let gridHeight = parseInt(grid[1]);
            let allMatches = [];
            let potentialGrid = true;
            for (string of userStrings) {
                  let matchPositions = patternFoundInGrid(string, gridString, gridWidth, gridHeight);
                  if (matchPositions.length == 0) {
                        potentialGrid = false;
                        break;
                  }
                  allMatches.push(matchPositions);
            }
            if (!potentialGrid) {
                  continue;
            }
            if (allMatches.length > 0) {
                  totalMatches++;
                  let resultContainer = document.createElement(`div`);
                  resultContainer.classList.add(`gridResult`);
                  allGridDiv.appendChild(resultContainer);
                  let newSVG = createSVGGrid({ parentElement: resultContainer, gridHeight: grid[1], gridWidth: grid[0], gridString: gridString });
                  let dataTable = createGridTable({ gridHeight: grid[1], gridWidth: grid[0], gridString: gridString });
                  resultContainer.appendChild(dataTable);
                  let matchColors = [];
                  let hue = 0;
                  let newColor = 0;
                  for (matchPositions of allMatches) {
                        [hue, newColor] = nextColor(hue);
                        matchColors.push(rgbToHex(newColor));
                  }
                  newSVG.gridWidth = grid[0];
                  newSVG.gridHeight = grid[1];
                  newSVG.querySelectorAll(".cellFill").forEach(cell => {
                        for (matchPositions of allMatches) {
                              if (matchPositions.includes(Number(cell.id)) && !Array.from(cell.classList).includes(`block`)) {
                                    cell.classList.remove('block');
                                    cell.classList.remove('default');
                                    cell.classList.remove('none');
                                    // cell.classList.add('highlight');
                                    cell.setAttribute('fill', matchColors[allMatches.indexOf(matchPositions)]);
                              }
                        }
                  });
                  newSVG.classList.add(`clickable`);
                  newSVG.onclick = downloadCrossFire;
            }
      }
      if(totalMatches == 0) {
            text.innerHTML = `No grids found!`;
      }
}

function createGridTable({ gridHeight, gridWidth, gridString}) {
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      table.appendChild(tbody);

      const sizeInfo = tbody.insertRow();
      const sizeLabel = sizeInfo.insertCell();
      sizeLabel.appendChild(document.createTextNode(`Size`));
      sizeLabel.classList.add(`tableLabel`);
      const sizeValue = sizeInfo.insertCell();
      sizeValue.appendChild(document.createTextNode(`${gridWidth} x ${gridHeight}`));

      const wordInfo = tbody.insertRow();
      const wordLabel = wordInfo.insertCell();
      wordLabel.appendChild(document.createTextNode(`Total Words`));
      wordLabel.classList.add(`tableLabel`);
      const wordValue = wordInfo.insertCell();
      wordValue.appendChild(document.createTextNode(countWords({ gridHeight: gridHeight, gridWidth: gridWidth, gridString: gridString})));

      return table;
}

function countWords({ gridHeight, gridWidth, gridString}) {
      let wordCount = 0;
      
      for (let row = 0; row < gridHeight; row++) {
            let wordLength = 0;
            for (let col = 0; col < gridWidth; col++) {
                  const index = row * gridWidth + col;
                  if (gridString[index] === '?') {
                        wordLength++;
                  } else {
                        if (wordLength > 2) {
                              wordCount++;
                        }
                        wordLength = 0;
                  }
            }
            if (wordLength > 2) {
                  wordCount++;
            }
      }
      
      for (let col = 0; col < gridWidth; col++) {
            let wordLength = 0;
            for (let row = 0; row < gridHeight; row++) {
                  const index = row * gridWidth + col;
                  if (gridString[index] === '?') {
                        wordLength++;
                  } else {
                        if (wordLength > 2) {
                              wordCount++;
                        }
                        wordLength = 0;
                  }
            }
            if (wordLength > 2) {
                  wordCount++;
            }
      }
      
      return wordCount.toString();
}

function patternFoundInGrid(userString, gridString, gridWidth, gridHeight) {
      const userFullWidth = 15;
      const userFullHeight = 15;
      const matchingCharPositions = [];

      let minRow = userFullHeight, maxRow = -1;
      let minCol = userFullWidth, maxCol = -1;

      for (let row = 0; row < userFullHeight; row++) {
            for (let col = 0; col < userFullWidth; col++) {
                  const index = row * userFullWidth + col;
                  if (userString[index] !== '-') {
                        minRow = Math.min(minRow, row);
                        maxRow = Math.max(maxRow, row);
                        minCol = Math.min(minCol, col);
                        maxCol = Math.max(maxCol, col);
                  }
            }
      }

      if (minRow > maxRow) {
            return matchingCharPositions;
      }

      const patternHeight = maxRow - minRow + 1;
      const patternWidth = maxCol - minCol + 1;

      for (let startRow = 0; startRow <= gridHeight - patternHeight; startRow++) {
            for (let startCol = 0; startCol <= gridWidth - patternWidth; startCol++) {
                  let isMatch = true;

                  for (let patRow = 0; patRow < patternHeight && isMatch; patRow++) {
                        for (let patCol = 0; patCol < patternWidth && isMatch; patCol++) {
                              const userRow = minRow + patRow;
                              const userCol = minCol + patCol;
                              const userIndex = userRow * userFullWidth + userCol;
                              const gridIndex = (startRow + patRow) * gridWidth + (startCol + patCol);

                              const userChar = userString[userIndex];
                              const gridChar = gridString[gridIndex];

                              if (userChar !== '-' && userChar !== gridChar) {
                                    isMatch = false;
                              }
                        }
                  }

                  if (isMatch) {
                        for (let patRow = 0; patRow < patternHeight; patRow++) {
                              for (let patCol = 0; patCol < patternWidth; patCol++) {
                                    const userRow = minRow + patRow;
                                    const userCol = minCol + patCol;
                                    const userIndex = userRow * userFullWidth + userCol;
                                    if (userString[userIndex] !== '-') {
                                          const gridIndex = (startRow + patRow) * gridWidth + (startCol + patCol);
                                          matchingCharPositions.push(gridIndex);
                                    }
                              }
                        }
                  }
            }
      }

      return matchingCharPositions;
}

function getGridStrings() {
      let svg = document.getElementById(`userGridSVG`);
      let gridDiv = document.getElementById(`searchGrids`);
      let gridStringArray = [];
      for (grid of Array.from(gridDiv.children)) {
            let gridString = '-'.repeat(svg.gridHeight * svg.gridWidth);
            grid.querySelectorAll(".default").forEach(cell => {
                  let gridArray = gridString.split('');
                  gridArray[cell.id] = `?`;
                  gridString = gridArray.join('');
            });
            grid.querySelectorAll(".block").forEach(cell => {
                  let gridArray = gridString.split('');
                  gridArray[cell.id] = `.`;
                  gridString = gridArray.join('');
            });
            gridStringArray.push(gridString);
      }
      return gridStringArray;
}

function createClickableSVGGrid(parentElement, gridHeight, gridWidth) {
      let baseSVG = createSVGGrid({ parentElement: parentElement, gridHeight: gridHeight, gridWidth: gridWidth, isMain: true });
      baseSVG.setAttribute('width', 524 + 'px');
      baseSVG.setAttribute('height', 524 + 'px');
      baseSVG.id = `userGridSVG`;
      let centerID = Math.round(gridHeight * gridWidth / 2) - 1;
      let keptCells = getNeighborIDs(centerID, gridHeight, gridWidth);
      keptCells.push(centerID);
      baseSVG.querySelectorAll(".cellFill").forEach(cell => {
            if (keptCells.includes(Number(cell.id))) {
                  if (cell.id == centerID) {
                        cell.classList.remove('block');
                        cell.classList.add('default');
                        cell.classList.remove('none');
                  } else {
                        cell.classList.remove('block');
                        cell.classList.remove('default');
                        cell.classList.add('none');
                  }
            } else {
                  cell.parentElement.style.visibility = `hidden`;
                  cell.classList.remove('block');
                  cell.classList.remove('default');
                  cell.classList.remove('none');
            }

            cell.onclick = swapCellState;
      });
}

function swapCellState(event) {
      let cellCycle = ['none', 'default', 'block'];
      let isNone = false;
      for (const className of Array.from(this.classList)) {
            let cycleIndex = cellCycle.indexOf(className);
            if (cycleIndex == -1) {
                  continue;
            }
            let nextIndex = (cycleIndex + 1) % cellCycle.length;
            this.classList.remove(className);
            this.classList.add(cellCycle[nextIndex]);
            if (cellCycle[nextIndex] == `none`) {
                  isNone = true;
            }
      }
      let svg = this.parentElement.parentElement.parentElement;
      let neighbors = getNeighborIDs(this.id, svg.gridHeight, svg.gridWidth);
      if (!isNone) {
            for (let ID of neighbors) {
                  let cell = svg.querySelector(`#${CSS.escape(ID)}`);
                  if (cell.parentElement.style.visibility == `hidden`) {
                        cell.parentElement.style.visibility = `visible`;
                        cell.classList.remove('block');
                        cell.classList.remove('default');
                        cell.classList.add('none');
                  }
            }
      } else {
            for (let ID of neighbors) {
                  let cell = svg.querySelector(`#${CSS.escape(ID)}`);
                  if (Array.from(cell.classList).includes(`none`)) {
                        let neighboringNeighbors = getNeighborIDs(cell.id, svg.gridHeight, svg.gridWidth);
                        let keepCell = false;
                        for (let neighborID of neighboringNeighbors) {
                              let neighborCell = svg.querySelector(`#${CSS.escape(neighborID)}`);
                              if (neighborCell.parentElement.style.visibility != `hidden` && !Array.from(neighborCell.classList).includes(`none`)) {
                                    keepCell = true;
                              }
                        }
                        if (!keepCell) {
                              cell.parentElement.style.visibility = `hidden`;
                              cell.classList.remove('block');
                              cell.classList.remove('default');
                              cell.classList.remove('none');
                        }
                  }
            }
      }

}

function getNeighborIDs(index, gridHeight, gridWidth) {
      const neighbors = [];
      const currentRow = Math.floor(index / gridWidth);
      const currentCol = index % gridWidth;

      const offsets = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
      ];

      for (const [rowOffset, colOffset] of offsets) {
            const neighborRow = currentRow + rowOffset;
            const neighborCol = currentCol + colOffset;

            // Check boundaries
            if (neighborRow >= 0 && neighborRow < gridHeight &&
                  neighborCol >= 0 && neighborCol < gridWidth) {

                  const neighborIndex = neighborRow * gridWidth + neighborCol;
                  neighbors.push(neighborIndex);
            }
      }

      return neighbors;
}

function createSVGGrid({ parentElement, gridHeight, gridWidth, gridString = "", isMain = false }) {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const cellSize = 16;
      const borderSize = 11;
      const height = cellSize * gridHeight;
      const width = cellSize * gridWidth;

      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", width + borderSize * 2);
      svg.setAttribute("height", height + borderSize * 2);
      svg.setAttribute("viewBox", `0 0 ${width + borderSize * 2} ${height + borderSize * 2}`);
      svg.classList.add('svgGrid');
      parentElement.appendChild(svg);

      const cellGroup = document.createElementNS(SVG_NS, "g");
      cellGroup.classList.add('gridCells');
      if (!gridString) {
            gridString = '?'.repeat(gridHeight * gridWidth);
      }
      rowID = 0;
      columnID = 0;
      positionID = 0;
      for (const character of gridString) {

            const cell = document.createElementNS(SVG_NS, "g");
            cell.classList.add('cell');

            if (isMain) {
                  const backRect = document.createElementNS(SVG_NS, "rect");
                  backRect.classList.add("cellBack");
                  backRect.id = `back_${positionID}`;
                  backRect.setAttribute("width", cellSize);
                  backRect.setAttribute("height", cellSize);
                  backRect.setAttribute("transform", `translate(${-0.5} ${-0.5})`);
                  cell.appendChild(backRect);
            }

            const rect = document.createElementNS(SVG_NS, "rect");
            if (character == '?') {
                  rect.classList.add("default");
            } else {
                  rect.classList.add("block");
            }
            rect.classList.add("cellFill");
            rect.id = positionID;
            rect.setAttribute("width", cellSize - 1);
            rect.setAttribute("height", cellSize - 1);
            cell.appendChild(rect);

            cell.setAttribute("transform", `translate(${(borderSize + 0.5) + cellSize * columnID} ${(borderSize + 0.5) + cellSize * rowID})`);
            cellGroup.appendChild(cell);

            columnID++;
            positionID++;
            if (columnID >= gridWidth) {
                  rowID++;
                  columnID = 0;
            }
      }
      svg.appendChild(cellGroup);

      if (!isMain) {
            const gridLine = document.createElementNS(SVG_NS, "path");
            let pathData = "";
            
            for (let i = 1; i < gridHeight; i++) {
                  const y = borderSize + 0.5 + cellSize * i;
                  pathData += `M${borderSize},${y} l${width},0 `;
            }
            
            for (let i = 1; i < gridWidth; i++) {
                  const x = borderSize + 0.5 + cellSize * i;
                  pathData += `M${x},${borderSize} l0,${height} `;
            }
            
            gridLine.classList.add('gridLine');
            gridLine.setAttribute("d", pathData);
            svg.appendChild(gridLine);

      } else {
            svg.gridHeight = gridHeight;
            svg.gridWidth = gridWidth;
      }

      const rectBorder = document.createElementNS(SVG_NS, "rect");
      rectBorder.setAttribute("x", borderSize);
      rectBorder.setAttribute("y", borderSize);
      rectBorder.setAttribute("width", width);
      rectBorder.setAttribute("height", height);
      rectBorder.classList.add('gridBorder');
      svg.appendChild(rectBorder);

      return svg;
}

async function fetchCSV(url) {
      try {
            const response = await fetch(url);
            const data = await response.text();
            let array = data.replaceAll(`"`, ``).split(/(?:\r\n|\n|\r)/g).filter(Boolean);
            let splitArray = array.map((row) => {
                  return row.split(`,`);
            });
            splitArray.shift();
            return splitArray;
      } catch (error) {
            console.error('Error fetching CSV:', error);
      }
}

function hsvToRgb(h, s, v) {
      let c = v * s;
      let x = c * (1 - Math.abs((h / 60) % 2 - 1));
      let m = v - c;

      let r = 0, g = 0, b = 0;

      if (h < 60) [r, g, b] = [c, x, 0];
      else if (h < 120) [r, g, b] = [x, c, 0];
      else if (h < 180) [r, g, b] = [0, c, x];
      else if (h < 240) [r, g, b] = [0, x, c];
      else if (h < 300) [r, g, b] = [x, 0, c];
      else[r, g, b] = [c, 0, x];

      return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
      };
}

function componentToHex(c) {
      var hex = c.toString(16);
      // Add zero padding if the hex value is a single digit
      return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex({r, g, b}) {
  // Ensure the input values are integers before conversion
      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function nextColor(hue) {
      const GOLDEN_ANGLE = 137.5;
      hue = (hue + GOLDEN_ANGLE) % 360;
      return [hue, hsvToRgb(hue, 0.8, 0.85)];
}