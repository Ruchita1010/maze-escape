import { Devvit, useAsync, useState } from '@devvit/public-api';
import { getRandomIntVal } from './shared/utils.js';

type WebViewMessage = {
  type: string;
  data: {
    hasReachedExit: boolean;
    elapsedTime: number;
  };
};

export function App(context: Devvit.Context): JSX.Element {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [escaped, setEscaped] = useState(false);

  const {
    data: gridConfig,
    loading,
    error,
  } = useAsync(async () => {
    const key = context.postId;
    if (key) {
      const savedData = await context.redis.hGetAll(key);
      const { rowCount, colCount } = savedData;

      if (rowCount && colCount) {
        return { rowCount, colCount };
      }

      // Generate random grid dimensions if none exist
      const newGridConfig = {
        rowCount: String(getRandomIntVal(7, 13)),
        colCount: String(getRandomIntVal(7, 21)),
      };
      await context.redis.hSet(key, newGridConfig);
      return newGridConfig;
    }
    return null;
  });

  const handleGameStart = () => {
    // review: maybe handle it differently, a return is kinda confusing
    if (!gridConfig) return;

    context.ui.webView.postMessage('webView', {
      type: 'gameStart',
      data: { gridConfig },
    });

    setIsGameOver(false);
    setElapsedTime(0);
    setIsGameRunning(true);
  };

  const handleWebViewMessage = async (msg: WebViewMessage) => {
    if (msg.type === 'gameOver') {
      const { hasReachedExit, elapsedTime } = msg.data;
      if (hasReachedExit) {
        setEscaped(true);
        setElapsedTime(elapsedTime);
      }
      setIsGameOver(true);
      setIsGameRunning(false);
    }
  };

  //  render game screen (web view)
  if (isGameRunning) {
    return (
      <blocks>
        <vstack grow height="100%" width="100%">
          {loading && <text>Loading grid configuration...</text>}
          {error && <text>Error loading grid configuration</text>}
          {gridConfig && (
            <webview
              id="webView"
              url="index.html"
              onMessage={(msg) => handleWebViewMessage(msg as WebViewMessage)}
              grow
              height="100%"
            />
          )}
        </vstack>
      </blocks>
    );
  }

  // render game over screen
  if (isGameOver) {
    return (
      <blocks>
        <zstack alignment="center middle" grow backgroundColor="#010026">
          <image
            imageHeight={674}
            imageWidth={512}
            height="100%"
            width="100%"
            url="gameOverBg.png"
            resizeMode="cover"
          />
          <vstack alignment="center" gap="small">
            {escaped ? (
              <>
                <text size="large" color="#010026">
                  YOU FOUND THE EXIT!
                </text>
                <text size="medium">Escaped in: {elapsedTime}s</text>
              </>
            ) : (
              <text size="large">YOU DIED!</text>
            )}
          </vstack>
          <vstack height="50%" alignment="center bottom">
            <button appearance="bordered" onPress={handleGameStart}>
              Play Again
            </button>
          </vstack>
        </zstack>
      </blocks>
    );
  }

  // render start screen
  return (
    <blocks>
      <zstack alignment="center middle" grow backgroundColor="#010026">
        <image
          imageHeight={674}
          imageWidth={512}
          height="100%"
          width="100%"
          url="gameStartBg.png"
          resizeMode="cover"
        />
        <vstack height="40%" alignment="center bottom">
          <button appearance="bordered" onPress={handleGameStart}>
            Start Game
          </button>
        </vstack>
      </zstack>
    </blocks>
  );
}
