import { Node } from "./Node.js";
import { CompAnim } from "./CompAnim.js";

export function buildScene(app) {
  // 空场景:只有 root 适配根 + 空 CompAnim(供时间轴)
  const root = new Node("root");
  root.x = app.screen.width / 2;
  root.y = app.screen.height / 2;
  root.addComp(new CompAnim({}));
  app.stage.addChild(root);
  return { root, anim: root.getComp(CompAnim) };
}
