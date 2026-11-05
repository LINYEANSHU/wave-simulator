---
name: WaveLab 交互式波动实验室
description: 暗房相纸视觉系统 — 哑光黑相纸地上的实时 FDTD 波场,银盐白为墨,安全灯琥珀为唯一强调
colors:
  ground: "#0b0d11"
  panel: "#13161b"
  panel-2: "#1b2027"
  panel-3: "#232a33"
  canvas-well: "#07090d"
  scope-well: "#0d1015"
  ink: "#e9e7e2"
  dim: "#a3a9b1"
  faint: "#949ba6"
  accent: "#ffb054"
  accent-hi: "#ffc678"
  on-accent: "#1d1305"
  danger: "#ff7a6a"
  scrim: "rgba(4, 5, 7, 0.68)"
  chip-scrim: "rgba(11, 13, 17, 0.88)"
  wave-pos-cyan: "#33ccff"
  wave-neg-amber: "#ff8026"
typography:
  wordmark:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  section-title:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
    fontSize: "13.5px"
    fontWeight: 600
  body:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
    fontSize: "12.5px"
    fontWeight: 400
  data:
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tabular-nums"
rounded:
  xs: "3px"
  sm: "4px"
  md: "5px"
  lg: "6px"
  xl: "8px"
  pill: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  "2xl": "22px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hi}"
  button-flat:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  button-flat-hover:
    backgroundColor: "{colors.panel-3}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "7px 11px"
  segmented:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.dim}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "3px"
  segmented-active:
    backgroundColor: "{colors.panel-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
  scene-tab:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "6px 13px"
  scene-tab-active:
    backgroundColor: "{colors.panel-3}"
    textColor: "{colors.ink}"
  tool-button:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    rounded: "{rounded.sm}"
    size: "36px"
  tool-button-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.dim}"
    rounded: "{rounded.sm}"
    size: "34px"
  hud-chip:
    backgroundColor: "{colors.chip-scrim}"
    textColor: "{colors.dim}"
    typography: "{typography.data}"
    rounded: "{rounded.sm}"
    padding: "4px 9px"
  source-card:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 11px 11px"
  source-card-selected:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.accent}"
  slider-thumb:
    backgroundColor: "{colors.accent}"
    size: "13px"
---

# Design System: WaveLab 交互式波动实验室

## Overview

**Creative North Star: "暗房相纸(The Darkroom Plate)"**

页面是一张正在显影的暗房相纸:波场即影像本身,占据首屏的绝对主角位置;界面 chrome 退成暗房家具——哑光黑面板、四档色阶步进、无渐变、无玻璃、无投影。这一系统明确拒绝"黑底霓虹发光仪表盘"这一品类默认(即本项目的旧版样式):没有发光标题、没有彩色光晕、没有毛玻璃,深度只由色阶与两道真正的浮层阴影承担。

仪器感而非玩具感(PRODUCT.md 产品原则的视觉化):控制件是旋钮与接口,所有读数(λ、C、FPS、实测频率)都是真实计算值,以 tabular-nums 像相纸边缘的曝光记号一样稳定呈现。安全灯琥珀是唯一 chrome 强调——像暗房里的安全灯,只在活动态、主行动、选中与仪器注记上亮起,占比极小;青色只属于波场数据,永不进入界面 chrome。

密度与节奏:右侧 316px 控制列以 13.5px 小节标题 + 12.5px 标签的紧凑尺阶承载全部参数;浮动元素(工具条、HUD 胶片条、示波器)以 10px 边距贴附画布四角。动效只传达状态:0.15s 的背景/颜色过渡、toast 0.3s;画布上波源圆环的脉动是模拟数据,不是装饰动效。

**Key Characteristics:**
- 相纸黑四档色阶(ground → panel → panel-2 → panel-3)承担全部层级,零细线边框
- 唯一强调:安全灯琥珀 #ffb054,仅活动态/主行动/选中/focus/仪器注记
- 波场画布是主角:按网格纵横比最大化居中,canvas 井 #07090d 溶入 #0b0d11 地色
- 全直角 4px 为主,浮层 6px、模态 8px 的小坡度阶梯
- 单一系统字族,12–15.5px 固定尺阶,数字一律 tabular-nums;无等宽、无大写字距标签
- 阴影只出现在两处真实浮层:探针示波器面板、模态对话框

## Colors

一支以蓝黑相纸为底的哑光单色系统:四档冷灰色阶承载层级,一枚安全灯琥珀做唯一强调,数据色(青-琥珀散度、inferno 色标)只活在波场里。

### Primary
- **安全灯琥珀 Safelight Amber** (#ffb054, `--accent`): 唯一 chrome 强调。用于:工具钮/场景页签/分段控件的活动态实心填充、主行动按钮(暂停/继续)与按压态开关、选中波源名、滑杆进度填充与拇指、`:focus-visible` 外圈(2px, offset 2px)、`::selection`、观察屏屏线与标注、说明弹窗小节标题。
- **琥珀高光 Amber Highlight** (#ffc678, `--accent-hi`): 琥珀的"再亮一档"——主行动按钮与滑杆拇指的 hover 色、公式块文字色。不引入新色相。
- **琥珀上墨 On-Accent** (#1d1305, `--on-accent`): 琥珀填充上的文字/图标色,近黑暖褐,保住琥珀表面的对比度。

### Neutral
- **相纸黑 Ground** (#0b0d11, `--ground`): 页面与舞台底色;也是分段控件凹轨、波源卡片、公式块的"凹面"——同一档色,既当底也当凹。
- **家具面 Panel** (#13161b, `--panel`): 顶栏、右侧控制列、悬浮工具条与示波器浮板的表面。
- **抬升面 Panel-2** (#1b2027, `--panel-2`): hover 态、默认(平光)按钮底、模态标题条、选中波源卡。
- **激活面 Panel-3** (#232a33, `--panel-3`): 激活态填充(页签/分段选中)、滑杆未填充轨道、滚动条拇指。
- **画布井 Canvas Well** (#07090d): 波场画布自身底色,比 ground 再深半档,让影像"沉"进相纸。
- **示波器井 Scope Well** (#0d1015): 示波器画布底色。
- **银盐白 Ink** (#e9e7e2, `--ink`): 正文与标题之墨;也是场上的银盐注记——探针十字、示波器波形线、观察屏剖面曲线、笔刷光标。
- **次级文本 Dim** (#a3a9b1, `--dim`): 标签、未激活页签、HUD 读数。
- **弱注记 Faint** (#949ba6, `--faint`): 脚注、副题、静音态图标。
- **模态遮罩 Scrim** (rgba(4, 5, 7, 0.68)): 弹窗全屏遮罩,纯变暗、不模糊。
- **信息条遮罩 Chip Scrim** (rgba(11, 13, 17, 0.88)): 画布上 HUD 胶片条与提示条的半透明底。
- **警示珊瑚 Danger Coral** (#ff7a6a, `--danger`): 刻意安静的危险色——只在 hover 时显形(清除类按钮、删除小钮),外加致命错误卡标题。

### Data (波场数据色 — 只属于画布,永不进入 chrome)
- **波场正相青 Wave Cyan** (#33ccff): "深空"散度色板正相位叶(shader `vec3(0.20,0.80,1.00)`),底 #03050c,强波高光近白 #d9ebff;经 tanh 软压缩色调映射并带轻微暗角。
- **波场负相琥珀 Wave Amber** (#ff8026): 深空色板负相位叶(shader `vec3(1.00,0.50,0.15)`)——与 chrome 琥珀同族、更橙,是"琥珀归仪器"规则的色相依据。
- **霓虹色板 Neon** (正 #1affbf / 负 #ff40cc,底 #030308): 备选散度色板。
- **冰蓝色板 Ice** (中间调 #1a59bf,高光 #bfe6ff,底 #03060d): 单色渐隐色板。
- **强度 Inferno** (#4d0f6b → #e64d33 → #ffbf26 → #fffad9): 时均强度场专用科学色标;其低端的紫段属于数据域,不受 chrome 紫罗兰禁令约束。
- **波源识别色 8 色** (#ffb054, #e8e8e3, #7dd3fc, #f5a361, #fad466, #b8c2d1, #5ee8d4, #ffa6a6;`SRC_COLORS`,ui.js): 按创建顺序循环分配;波源卡片圆点、场上发光标记、卡片圆点三处同色,是波源的"身份"。
- **墙体**: 反射墙深板岩 #131821 + 边缘高光 #4d6180;吸波墙深青绿 #0e1a16 + 边缘 #337561(shader 内绘制)。

### Named Rules
**「唯一安全灯」规则(The One Safelight Rule).** 琥珀是 chrome 的唯一强调色,只允许出现在:活动态、主行动、选中、focus 外圈、滑杆进度与仪器注记(观察屏线/标签、波源标签、说明弹窗小节标题)。任何新界面不得引入第二种 chrome 强调色。

**「色阶步进」规则(The Tone-Step Rule).** 层级用四档色阶(ground/panel/panel-2/panel-3)表达,不画细线边框。需要分隔时,换一档底色。

**「琥珀归仪器,青归波场」规则.** chrome 琥珀必须与波场负相位琥珀(#ff8026)同族;青色只出现在数据色板与波源识别色中,永不进入按钮、页签、强调文本。

**「数据色不上 chrome」规则.** 霓虹/冰蓝/inferno 与全部散度色板只活在 shader 与画布注记里;UI 表面只允许 Primary + Neutral 两族。

## Typography

**Display Font:** 无独立显示字体 — 全站单一系统族
**Body Font:** "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif(`--sans`)
**Label/Mono Font:** 无等宽字体;数字以 `font-variant-numeric: tabular-nums` 替代

**Character:** 一套彻底的"仪器字":同一系统族从字标用到画布注记(canvas 内 2D 标注也写明同族),靠字号(12–15.5px 固定值,无流体 clamp)与三档字重(400/600/700)分层;所有物理量读数用表格数字对齐,像相纸边缘的曝光记号一样稳定。

### Hierarchy
- **字标 Wordmark** (700, 15.5px, 1.2, letter-spacing 0.01em): 顶栏 "WaveLab" 与模态标题;中文副题「交互式波动实验室」12px faint。
- **小节标题 Section Title** (600, 13.5px): 右侧控制列分区标题(视图/波源/场参数/操作)。
- **正文 Body** (400, 13px): 按钮、场景页签、toast;说明弹窗长文 13px / line-height 1.75。
- **标签 Label** (400, 12.5px): 控件标签(.lab)、滑杆读数、分段控件按钮;波源名同号 600;波源卡片内降为 12px。
- **数据 Data** (400, 12px, tabular-nums): HUD 胶片条(网格/λ/C/FPS)、示波器读数;12px 弱注记(脚注/提示/子标题)同号。
- 例外(不收入尺阶):致命错误卡标题 17px(全站最大号,一次性)。画布注记标签(DOM 实现)为 12px,与 chrome 下限一致。

### Named Rules
**「无字距大写」规则(The No-Tracked-Caps Rule).** 全站零 `text-transform`、零 tracked caps;层级靠字号与色阶,不靠变形。唯一字距是字标上 0.01em。

**「表格数字」规则(The Tabular Figures Rule).** 一切数值读数(HUD 胶片条、.val、示波器读数、公式块)必须 tabular-nums;不引入等宽字体。

## Layout

空间模型是"仪器台"三段式:

- **顶栏 52px**(flex,padding 0 14px,列间距 16px):左字标组(25px 波形符号 SVG + 15.5px 名称 / 12px 副题);中部弹性居中的场景页签(8 个场景,gap 4px,溢出横向滚动、隐藏滚动条);右侧 34px 图标按钮组(gap 4px)+ ghost 按钮「科学说明」。
- **舞台 + 316px 控制列**(main 为 flex 行):舞台 `flex:1`、padding 14px;波场画布按模拟网格纵横比(540 行 × 320–1280 列自适应)在舞台内最大化居中——近乎全出血,边缘由 canvas 井 #07090d 溶入地色;2D overlay 画布同位叠放承载测量注记。右列固定 316px,padding 18px 16px 24px,分区间距 22px、区内间距 10px,独立滚动。
- **画布浮层一律 10px 边距**:工具条(左上,44px 宽 = 36px 按钮 + 4px 内衬)、HUD 胶片条(左下,gap 5px)、提示条(下中)、探针示波器(右下,宽 252px)。
- **控制行节奏**:滑杆行 grid `60px / 1fr / 56px`、间距 10px;行式布局(label + 控件)间距 12px,分段控件最宽 208px;按钮行 gap 8px;按钮 padding 8px 13px;波源卡片内滑杆行缩为 `34px / 1fr / 50px`。
- **响应式**:≤900px 纵向堆叠(舞台 min-height 56vh,控制列全宽,提示条隐藏,示波器上移让位胶片条);≤760px 顶栏换行、场景页签独占一行。

## Elevation & Depth

这套系统是"色阶分层 + 真浮层阴影"的混合体,且边界苛刻:常驻 chrome 完全无阴影、无边框,深度只由四档底色表达(ground → panel → panel-2 → panel-3,越"浮"越亮)。阴影只属于两个真正悬浮在波场影像之上的表面;hover 也不加阴影——只抬一档底色。z 轴词汇表:顶栏 5 / 模态 50 / toast 60 / 致命错误 100。

### Shadow Vocabulary
- **浮层阴影 overlay-float** (`box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45)`): 仅探针示波器面板——悬浮在波场影像上的测量仪器。
- **模态阴影 modal** (`box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55)`): 仅模态对话框(科学说明),配合 rgba(4, 5, 7, 0.68) 全屏遮罩;致命错误卡同属模态层。

### Named Rules
**「两道阴影」规则(The Two-Shadow Rule).** 全站只允许上述两处 box-shadow。新组件要"浮起来"时,先问它是否真浮在画布上;若只是面板内组件,抬色阶,不加影。

## Shapes

直角小半径语言——默认控件 4px(rounded.sm),是"相纸被裁切"的方正感。完整坡度阶梯:3px(分段控件内按钮)→ 4px(按钮/页签/工具钮/chip/图标钮/公式块/提示条)→ 5px(分段控件外轨、波源卡片)→ 6px(工具条、示波器两处画布浮层)→ 8px(模态卡、致命错误卡)。圆形只保留给"物理指示物":滑杆拇指(13px)、波源圆点(9px)、笔刷光标(跟随笔刷直径的圆)。无边框语言:按钮一律 `border: none`;仅存的边线是滚动条拇指 3px panel 同色描边(gutter 效果)与画布上 1.5px 银盐白笔刷圈(场上注记,非 chrome)。

## Components

### 按钮 Buttons
- **Shape:** 直角小圆角(4px),无 border,内边距 8px 13px,13px 字
- **Primary:** 琥珀实心(`--accent` 底 + `--on-accent` 字,600 字重),全站唯一主行动(暂停/继续);hover 提亮 #ffc678
- **Flat(默认):** `--panel-2` 底 + 银盐白字;hover 抬至 `--panel-3`;行内等分(btn-row gap 8px)
- **Ghost:** 透明底 + dim 字(顶栏「科学说明」);hover 抬 `--panel-2`、字转 ink
- **Danger:** 平时与 Flat 同貌,hover 才显形:rgba(255, 122, 106, 0.14) 底 + #ff7a6a 字;卡片删除小钮同理
- **Toggle:** `aria-pressed="true"` 时与 Primary 同貌(琥珀实心 600)
- **Focus:** 全站统一 `:focus-visible` 2px 琥珀外圈,offset 2px

### 分段控件 Segmented
- **Style:** `--ground` 凹轨(padding 3px,radius 5px)+ 透明按钮(12.5px,小号 12px,dim 字)
- **State:** active = `--panel-3` 实心填充(radius 3px)+ ink 字;hover 抬 `--panel-2`;无描边无阴影
- **用例:** 视图、配色、边界、时间流速、墙体材质

### 滑杆 Slider
- **Style:** 3px 细轨(radius 2px),琥珀已填充段 + `--panel-3` 未填充段,以 CSS 变量 `--fill` 硬分割——全站唯一"渐变",功能性进度填充而非装饰(Firefox 走 `::-moz-range-progress` 纯琥珀)
- **Thumb:** 13px 琥珀圆,hover 提亮 #ffc678;disabled 整体 0.4 透明度
- **读数:** 右侧 `.val` 12.5px tabular-nums 右对齐

### 导航 Navigation(场景页签 + 工具钮)
- **场景页签:** 13px 文字页签,padding 6px 13px,radius 4px;active = `--panel-3` 填充 + ink 字
- **工具钮(签名):** 36px 方形图标钮(内联 stroke 1.7 SVG,19px),active = 琥珀实心 + `--on-accent` 图标——当前工具即"哪盏灯亮着"
- **图标钮:** 34px,透明底,18px SVG;hover 抬 `--panel-2`

### 胶片边标记 Chips(HUD)
- **Style:** 12px tabular-nums,dim 字,rgba(11, 13, 17, 0.88) 底,radius 4px,padding 4px 9px
- **State:** 只读、实时更新(网格 / λ ≈ n 格 / C = 0.62 / FPS)——像相纸边缘的曝光记号,数据色不入条

### 波源卡片 Source Card
- **Shape:** radius 5px,padding 9px 11px 11px;内部滑杆行 `34px / 1fr / 50px`,标签与读数 12px
- **Background:** 静息 `--ground`(凹进面板);hover `--panel-h` #10141a(地与家具面之间的步进,已 token 化);选中 `--panel-2` 且波源名转琥珀
- **Identity:** 9px 圆点用波源识别色(与场上标记同色);静音态圆点转 faint + 行内降透明;标签(平面波/运动)12px 琥珀字 + rgba(255, 176, 84, 0.12) 底
- **操作:** 24px mini-btn(静音眼睛/删除 X),删除 hover 转 danger

### 签名组件:探针示波器面板(Probe Scope)
右下浮出的 252px 测量仪:12px dim 标题行 + 关闭小钮;75px 高示波器画布(#0d1015 井、rgba(154, 160, 168, 0.25) 基线、#e9e7e2 1.6px 银盐波形线,自适应幅度);12px tabular-nums 读数行(u 值 + 实测频率 ≈ n Hz)。它是最早显影的"波形当场显影"戏剧点,也是全站仅有的两道阴影之一。

### 签名交互:观察屏剖面(Observation Screen)
画布上琥珀虚线屏线(rgba(255, 176, 84, 0.8),1.4px,dash 5-4)+ 贴附的银白时均强度剖面(rgba(238, 240, 244, 0.92) 1.6px 描线 + rgba(233, 231, 226, 0.14) 柔和填充,自适应峰值)+ 11px 琥珀标注「观察屏 · 时均强度」——教科书双缝强度分布的数值版,测量注记直接绘于场上。

### 模态与致命错误
模态卡 max 680px、radius 8px、浮层阴影;`--panel-2` 标题条(15.5px/700)+ 13px/1.75 长文(dim,b 可转 ink);小节标题 13px 琥珀;公式块 12.5px tabular-nums #ffc678 于 `--ground` 凹块(radius 4px)。致命错误卡同坡度(radius 8px),17px danger 标题 + 13px 原因 + 12px 补救提示。

## Do's and Don'ts

### Do:
- **Do** 用色阶表达层级:需要区分表面时换一档(`--ground` → `--panel` → `--panel-2` → `--panel-3`),保持零边框。
- **Do** 把琥珀留给活动态/主行动/选中/focus/滑杆进度/仪器注记;一个视图里琥珀占比保持极小——安全灯只在暗处亮。
- **Do** 所有数值读数用 12/12.5px + tabular-nums;新读数进 HUD 胶片条沿用 rgba(11, 13, 17, 0.88) 底与 4px 圆角。
- **Do** 图标一律内联 SVG stroke(1.7–1.8)取色 currentColor;新工具沿用 36px 方形钮 + 琥珀 active 实心。
- **Do** 状态过渡保持 0.15s(background/color/opacity),toast 0.3s;缓动用浏览器默认,不做位移/缩放装饰动画。
- **Do** 画布注记遵循分工:银盐白 = 测量(探针十字、剖面曲线),琥珀 = 仪器标记(屏线、标签),波源用识别色。

### Don't:
- **Don't** 使用装饰性渐变、玻璃拟态/backdrop-filter、发光或彩色光晕——这是对旧版"黑底霓虹仪表盘"的明确拒绝(唯一豁免:滑杆硬分割双色进度填充)。
- **Don't** 在 chrome 中引入紫色/紫罗兰(说明性内容与数据域之外无紫;inferno 低端紫仅存在于强度场数据域)。
- **Don't** 给常驻 chrome 加 box-shadow 或细线边框;阴影只属于示波器浮板与模态卡(「两道阴影」规则)。
- **Don't** 使用 tracked caps 大写标签、emoji、等宽字体;层级靠字号与色阶,数字靠 tabular-nums。
- **Don't** 让青色进入按钮/页签/强调文本——青属于波场数据色板与波源识别色(「琥珀归仪器,青归波场」)。
- **Don't** 把圆角放大到 8px 以上或引入大圆角卡片;圆形只给滑杆拇指、波源圆点、笔刷光标。
