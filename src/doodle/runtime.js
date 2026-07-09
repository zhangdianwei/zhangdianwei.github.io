// 活跃动画集合:只 tick 正在播的,静止场景零遍历
export const updater = new Set();

export function tick(dt) {
  for (const c of updater) c.advance(dt);
}
