# GSYEN 老爷车可编辑 SVG 排程表

目标：从“像图的 SVG”重建成“可维护的品牌资产 SVG”。每个零件独立成图，验收后再组合整车。

| 顺序 | 零件 ID | 中文名称 | 参考来源 | 当前判断 | 输出文件 | 状态 |
|---:|---|---|---|---|---|---|
| 01 | `cabin-shell` | 车厢外壳 / 车顶 | Reference PNG + Claude Ink roof | 最关键，决定老爷车气质 | `part-11-cabin-shell-roof-v1.svg` | 初稿 |
| 02 | `window-frame` | 窗框与车顶留白线 | Reference PNG #1 / Claude #4 | 需要空灵，线条不能粗 | `part-12-window-frame-v1.svg` | 初稿 |
| 03 | `rear-wheel` | 后轮 | Reference PNG | 必须圆，辐条干净 | `part-03-rear-wheel-v1.svg` | 初稿 |
| 04 | `front-wheel` | 前轮 | Reference PNG | 后轮通过后按比例缩放 | `part-02-front-wheel-v1.svg` | 初稿 |
| 05 | `engine-hood` | 发动机盖 | Reference PNG #2 / Claude #6 反例 | Claude 太弱，要回到 reference 密度 | `part-08-engine-hood-v1.svg` | 初稿 |
| 06 | `radiator-lines` | 散热竖线 | Reference PNG | 竖线要细密，不能机械等距 | `part-09-radiator-lines-v1.svg` | 初稿 |
| 07 | `front-lamp` | 车灯本体 | Reference PNG | 可用，但要保留金色灯面 | `part-06-front-lamp-v1.svg` | 初稿 |
| 08 | `lamp-rays` | 灯光线 | Reference PNG #3 / Candidate #7 反例 | 去掉黑色噪点，只保留金线 | `part-07-lamp-rays-v1.svg` | 初稿 |
| 09 | `front-fender` | 前挡泥板 | Reference PNG | 曲线要轻，不能压死前轮 | `part-04-front-fender-v1.svg` | 初稿 |
| 10 | `rear-fender` | 后挡泥板 | Reference PNG | 控制厚度，避免后部太重 | `part-05-rear-fender-v1.svg` | 初稿 |
| 11 | `door-panel` | 车门 | Reference PNG | 车门要保留优雅弧底 | `part-13-door-panel-v1.svg` | 初稿 |
| 12 | `steering-wheel` | 方向盘 | Reference PNG | 小件，最后统一粗细 | `part-14-steering-wheel-v1.svg` | 初稿 |
| 13 | `chassis-step` | 底盘与踏板 | Reference PNG | 用于稳定横向重心 | `part-10-chassis-step-v1.svg` | 初稿 |
| 14 | `ground-line` | 地面线 | Reference PNG | 最后统一长度和重心 | `part-01-ground-line-v1.svg` | 初稿 |

验收顺序：

1. 单件形状是否像 Reference PNG。
2. 单件是否可编辑：独立 `<g id="">`，不和其他零件混在一起。
3. 线条是否干净：无毛刺、无噪点、无不可控描摹碎片。
4. 放大 20 倍仍然边缘清楚。
5. 单件通过后再进入整车组合。
