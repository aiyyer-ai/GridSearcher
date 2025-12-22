window.onload = async () => {
      let baseDiv = document.getElementById(`baseGrid`);
      let baseGrid = createClickableSVGGrid(baseDiv, 15, 15);

      let centerDiv = document.getElementById(`gridMatches`);
      let gridString = "?????.?????.????????.?????.??????????????.?????????.????.???...???????????????.???..???...????.????.??????????.???.??????????.????.????...???..???.???????????????...???.????.?????????.??????????????.?????.????????.?????.?????";
      createSVGGrid({ parentElement: centerDiv, gridHeight: 15, gridWidth: 15, gridString: gridString });
}

async function searchForGrid() {
      let userString = getGridString();
      let allGrids = await fetchCSV('./grids.csv');
      for (grid of allGrids) {
            let gridString = grid[2];
            
      }
}

function getGridString() {
      let svg = document.getElementById(`userGridSVG`);
      let gridString = '-'.repeat(svg.gridHeight * svg.gridWidth);
      svg.querySelectorAll(".default").forEach(cell => {
            let gridArray = gridString.split('');
            gridArray[cell.id] = `?`;
            gridString = gridArray.join('');
      });
      svg.querySelectorAll(".block").forEach(cell => {
            let gridArray = gridString.split('');
            gridArray[cell.id] = `.`;
            gridString = gridArray.join('');
      });
      return gridString;
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
            const pathData = "M11,27.5 l240,0 M11,43.5 l240,0 M11,59.5 l240,0 M11,75.5 l240,0 M11,91.5 l240,0 M11,107.5 l240,0 M11,123.5 l240,0 M11,139.5 l240,0 M11,155.5 l240,0 M11,171.5 l240,0 M11,187.5 l240,0 M11,203.5 l240,0 M11,219.5 l240,0 M11,235.5 l240,0 M27.5,11 l0,240 M43.5,11 l0,240 M59.5,11 l0,240 M75.5,11 l0,240 M91.5,11 l0,240 M107.5,11 l0,240 M123.5,11 l0,240 M139.5,11 l0,240 M155.5,11 l0,240 M171.5,11 l0,240 M187.5,11 l0,240 M203.5,11 l0,240 M219.5,11 l0,240 M235.5,11 l0,240";
            gridLine.classList.add('gridLine');
            gridLine.setAttribute("d", pathData);
            svg.appendChild(gridLine);

            const rectBorder = document.createElementNS(SVG_NS, "rect");
            rectBorder.setAttribute("x", borderSize);
            rectBorder.setAttribute("y", borderSize);
            rectBorder.setAttribute("width", width);
            rectBorder.setAttribute("height", height);
            rectBorder.classList.add('gridBorder');
            svg.appendChild(rectBorder);
      } else {
            svg.gridHeight = gridHeight;
            svg.gridWidth = gridWidth;
      }

      return svg;
}

async function fetchCSV(url) {
      try {
            const response = await fetch(url);
            const data = await response.text();
            let array = data.replaceAll(`"`,``).split(/(?:\r\n|\n|\r)/g).filter(Boolean);
            let splitArray = array.map((row) => {
                  return row.split(`,`);
            });
            splitArray.shift();
            return splitArray;
      } catch (error) {
            console.error('Error fetching CSV:', error);
      }
}