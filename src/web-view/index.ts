import 'pixi.js/unsafe-eval'; // required for adding to reddit app
import { Application, Assets } from 'pixi.js';
import { HexagonalGrid } from './modules/HexagonalGrid.js';
import { Player } from './modules/Player.js';

const app = new Application();

async function initPixiJS() {
  await app.init({
    resizeTo: window,
    background: '#010026',
  });

  document.body.appendChild(app.canvas);

  const assets = [
    { alias: 'edgeHexagon', src: 'assets/edgeHexagon.png' },
    { alias: 'nonEdgeHexagon', src: 'assets/nonEdgeHexagon.png' },
    { alias: 'toxicGas', src: 'assets/toxicGas.png' },
    { alias: 'player', src: 'assets/player.png' },
    { alias: 'guard', src: 'assets/guard.png' },
  ];
  await Assets.load(assets);
}

function startGame(rows: number, cols: number) {
  const grid = new HexagonalGrid(app, rows, cols);
  grid.activateToxicGas();
  grid.spawnGuards(2);

  const initialRow = Math.floor(rows / 2);
  const initialCol = Math.floor(cols / 2);
  const player = new Player(app, grid, initialRow, initialCol);

  const startTime = performance.now();

  app.ticker.add(() => {
    const [row, col] = player.getPlayerPosition();
    const hexagon = grid.getHexagon(row, col);
    if (!hexagon) return;

    const isDead = hexagon.toxicGas.sprite?.visible || hexagon.hasGuard;
    const hasReachedExit = grid.isExit(hexagon);
    if (isDead || hasReachedExit) {
      const elapsedTime = ((performance.now() - startTime) / 1000).toFixed(2); // In seconds
      window.parent?.postMessage(
        {
          type: 'gameOver',
          data: {
            hasReachedExit,
            elapsedTime,
          },
        },
        '*'
      );
      // Stop the ticker to prevent further updates
      app.ticker.stop();
    }
  });
}

window.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  if (type === 'devvit-message') {
    const { message } = data;
    if (message.type === 'gameStart') {
      const { gridConfig } = message.data;
      console.log(gridConfig);
      const rows = Number(gridConfig.rowCount);
      const cols = Number(gridConfig.colCount);

      await initPixiJS();
      startGame(rows, cols);
    }
  }
});
