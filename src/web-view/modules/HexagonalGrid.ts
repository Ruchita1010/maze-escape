import { Container } from 'pixi.js';
import { Sprite, type Application } from 'pixi.js';
import { getRandomIntVal } from '../../shared/utils.js';
import { createSprite } from './utils.js';

type Hexagon = {
  x: number;
  y: number;
  isEdge: boolean;
  isCorner: boolean;
  toxicGas: { sprite: Sprite | null; nextActivationTime: number };
  hasGuard: boolean;
};

export class HexagonalGrid {
  SIDE_LENGTH = 20;

  #app;
  #grid: Hexagon[][] = [];
  #rowCount;
  #colCount;
  #edgeHexagons: Hexagon[] = [];
  #exitIndex: number;
  #guardsMovementIntervalId: number | undefined = undefined;

  constructor(app: Application, rowCount: number, colCount: number) {
    this.#app = app;
    this.#grid = [];
    this.#rowCount = rowCount;
    this.#colCount = colCount;
    this.#initializeGrid();
    this.#storeEdgeHexagonsClockwise();
    this.#exitIndex = getRandomIntVal(0, this.#edgeHexagons.length - 1);
  }

  #isEdgeHexagon(row: number, col: number) {
    return (
      row === 0 ||
      row === this.#rowCount - 1 ||
      col === 0 ||
      col === this.#colCount - 1
    );
  }

  #isCornerHexagon(row: number, col: number, isStaggered: boolean) {
    const isTopLeft = row === 0 && col === 0;
    const isTopRight = row === 0 && col === this.#colCount - 1 && !isStaggered;
    const isBottomRight =
      row === this.#rowCount - 1 && col === this.#colCount - 1 && isStaggered;

    return isTopLeft || isTopRight || isBottomRight;
  }

  #createHexagon(row: number, col: number): Hexagon {
    const hexHeight = Math.sqrt(3) * this.SIDE_LENGTH;
    const gridWidth = this.#colCount * this.SIDE_LENGTH * 1.4; // Account for offsets
    const gridHeight = this.#rowCount * hexHeight * 0.95;

    // Center offsets for the entire grid
    const offsetX = (this.#app.canvas.width - gridWidth) / 2;
    const offsetY = (this.#app.canvas.height - gridHeight) / 2;

    const isStaggered = col % 2 !== 0;
    const x = col * this.SIDE_LENGTH * 1.5 + offsetX;
    const y = row * hexHeight + (isStaggered ? hexHeight / 2 : 0) + offsetY;

    const isCorner = this.#isCornerHexagon(row, col, isStaggered);
    const isEdge = isCorner || this.#isEdgeHexagon(row, col);
    return {
      x,
      y,
      isCorner,
      isEdge,
      toxicGas: { sprite: null, nextActivationTime: 0 },
      hasGuard: false,
    };
  }

  #initializeGrid() {
    const hexagonContainer = new Container();
    this.#app.stage.addChild(hexagonContainer);

    for (let row = 0; row < this.#rowCount; row++) {
      const rowHexagons: Hexagon[] = [];
      for (let col = 0; col < this.#colCount; col++) {
        const hexagon = this.#createHexagon(row, col);
        const { x, y, isEdge } = hexagon;
        // render the hexagon
        const textureKey = isEdge ? 'edgeHexagon' : 'nonEdgeHexagon';
        const sprite = createSprite(x, y, this.SIDE_LENGTH, textureKey, 2);
        hexagonContainer.addChild(sprite);
        rowHexagons.push(hexagon);
      }
      this.#grid.push(rowHexagons);
    }
  }

  getHexagon(row: number, col: number): Hexagon | null {
    if (row >= 0 && row < this.#rowCount && col >= 0 && col < this.#colCount) {
      return this.#grid[row][col];
    }
    return null;
  }

  activateToxicGas(): void {
    const nonEdgeHexagons = this.#grid
      .flat()
      .filter((hexagon) => !hexagon.isEdge);

    const toxicGasContainer = new Container();
    this.#app.stage.addChild(toxicGasContainer);

    const toxicHexagonsCount = Math.floor(nonEdgeHexagons.length / 4);
    const toxicGasHexagons: Hexagon[] = [];

    for (let i = 0; i < toxicHexagonsCount; i++) {
      const randomIndex = Math.floor(Math.random() * nonEdgeHexagons.length);
      const hexagon = nonEdgeHexagons.splice(randomIndex, 1)[0]; // Remove from pool
      const { x, y, toxicGas } = hexagon;

      const sprite = createSprite(x, y, this.SIDE_LENGTH, 'toxicGas', 2);
      sprite.visible = false;
      toxicGas.sprite = sprite;
      toxicGas.nextActivationTime = Math.random() * 1000 + 2000;
      toxicGasContainer.addChild(sprite);
      toxicGasHexagons.push(hexagon);
    }

    this.#app.ticker.add(() => {
      const currTime = performance.now();

      toxicGasHexagons.forEach((hexagon) => {
        const { toxicGas } = hexagon;
        const { sprite, nextActivationTime } = toxicGas;

        if (sprite && currTime >= nextActivationTime) {
          sprite.visible = !sprite.visible;
          toxicGas.nextActivationTime = currTime + Math.random() * 1000 + 500;
        }
      });
    });
  }

  #storeEdgeHexagonsClockwise() {
    // Top row
    for (let col = 0; col < this.#colCount; col++) {
      this.#edgeHexagons.push(this.#grid[0][col]);
    }

    // Right column
    for (let row = 1; row < this.#rowCount; row++) {
      this.#edgeHexagons.push(this.#grid[row][this.#colCount - 1]);
    }

    // Bottom row
    for (let col = this.#colCount - 2; col >= 0; col--) {
      this.#edgeHexagons.push(this.#grid[this.#rowCount - 1][col]);
    }

    // Left column
    for (let row = this.#rowCount - 2; row > 0; row--) {
      this.#edgeHexagons.push(this.#grid[row][0]);
    }
  }

  spawnGuards(guardsCount: number): void {
    const totalEdgeHexes = this.#edgeHexagons.length;

    const guardsContainer = new Container();
    this.#app.stage.addChild(guardsContainer);

    const guards: { sprite: Sprite; currIndex: number }[] = [];
    for (let i = 0; i < guardsCount; i++) {
      const startIndex =
        (i * Math.floor(totalEdgeHexes / guardsCount)) % totalEdgeHexes;
      const { x, y } = this.#edgeHexagons[startIndex];
      const sprite = createSprite(x, y, this.SIDE_LENGTH, 'guard', 1.5);
      guardsContainer.addChild(sprite);
      guards.push({ sprite, currIndex: startIndex });
    }

    // Move at a interval
    this.#guardsMovementIntervalId = setInterval(() => {
      guards.forEach((guard) => {
        const currHexagon = this.#edgeHexagons[guard.currIndex];
        currHexagon.hasGuard = false;

        const nextIndex =
          (guard.currIndex + 1 + totalEdgeHexes) % totalEdgeHexes;
        const nextHexagon = this.#edgeHexagons[nextIndex];
        nextHexagon.hasGuard = true;

        guard.sprite.x = nextHexagon.x;
        guard.sprite.y = nextHexagon.y;
        guard.currIndex = nextIndex;
      });
    }, 150);
  }

  isExit(hexagon: Hexagon): boolean {
    return hexagon === this.#edgeHexagons[this.#exitIndex];
  }

  resetGrid(): void {
    this.#grid = [];
    this.#rowCount = 0;
    this.#colCount = 0;
    this.#edgeHexagons = [];
    clearInterval(this.#guardsMovementIntervalId);
    // Clear the stage before generating a new grid
    this.#app.stage.removeChildren();
  }
}
