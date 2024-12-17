import { Sprite } from 'pixi.js';

export function createSprite(
  x: number,
  y: number,
  wh: number,
  texture: string,
  scale = 1
): Sprite {
  const sprite = Sprite.from(texture);
  sprite.width = wh * scale;
  sprite.height = wh * scale;
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  return sprite;
}
