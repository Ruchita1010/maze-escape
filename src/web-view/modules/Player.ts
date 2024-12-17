import type { Application, Sprite } from 'pixi.js';
import type { HexagonalGrid } from './HexagonalGrid.js';
import { createSprite } from './utils.js';

type Direction =
  | 'up'
  | 'down'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export class Player {
  #app: Application;
  #grid: HexagonalGrid;
  #currentRow: number;
  #currentCol: number;
  #sprite: Sprite;

  constructor(
    app: Application,
    grid: HexagonalGrid,
    initialRow: number,
    initialCol: number
  ) {
    this.#app = app;
    this.#grid = grid;
    this.#currentRow = initialRow;
    this.#currentCol = initialCol;

    const { x, y } = this.#grid.getHexagon(this.#currentRow, this.#currentCol)!;
    this.#sprite = createSprite(x, y, grid.SIDE_LENGTH, 'player');
    this.#app.stage.addChild(this.#sprite);

    this.#setupMovementControls();
  }

  getPlayerPosition(): number[] {
    return [this.#currentRow, this.#currentCol];
  }

  #calculateNewPosition(direction: Direction) {
    let newRow = this.#currentRow;
    let newCol = this.#currentCol;

    switch (direction) {
      case 'up':
        newRow--;
        break;
      case 'down':
        newRow++;
        break;
      case 'top-left':
        newCol--;
        if (this.#currentCol % 2 === 0) newRow--;
        break;
      case 'top-right':
        newCol++;
        if (this.#currentCol % 2 === 0) newRow--;
        break;
      case 'bottom-left':
        newCol--;
        if (this.#currentCol % 2 !== 0) newRow++;
        break;
      case 'bottom-right':
        newCol++;
        if (this.#currentCol % 2 !== 0) newRow++;
        break;
    }
    return { newRow, newCol };
  }

  #move(direction: Direction) {
    const { newRow, newCol } = this.#calculateNewPosition(direction);

    const targetHexagon = this.#grid.getHexagon(newRow, newCol);
    const currentHexagon = this.#grid.getHexagon(
      this.#currentRow,
      this.#currentCol
    );

    if (!targetHexagon || !currentHexagon) {
      return;
    }

    const canMove =
      !(targetHexagon.isEdge && currentHexagon.isEdge) ||
      currentHexagon.isCorner ||
      targetHexagon.isCorner;

    if (canMove) {
      this.#currentRow = newRow;
      this.#currentCol = newCol;
      this.#sprite.x = targetHexagon.x;
      this.#sprite.y = targetHexagon.y;
    }
  }

  #setupMovementControls() {
    const directionMap: Record<string, Direction> = {
      w: 'up',
      s: 'down',
      q: 'top-left',
      e: 'top-right',
      a: 'bottom-left',
      d: 'bottom-right',
    };
    window.addEventListener('keydown', (e) => {
      const direction = directionMap[e.key];
      if (direction) this.#move(direction);
    });
  }
}
