# MPTI

MPTI 是一个面向学生视角的导师人格娱乐测试项目，全名是 `Mentor Personality Type Indicator`。

项目沿用了 `ABTI` 的核心框架：

- 单页静态测试流程
- 15 维度打分与 24 个标准人格匹配
- 1 个隐藏人格彩蛋 + 1 个兜底人格
- 图鉴页与排行榜页
- Netlify Functions 统计访问与结果分布

当前目录结构：

```text
MPTI/
├─ index.html
├─ gallery.html
├─ leaderboard.html
├─ assets/
│  ├─ mpti-data.js
│  ├─ mpti-test.js
│  ├─ mpti-gallery.js
│  └─ mpti-leaderboard.js
├─ scripts/
│  └─ revision-static.mjs
├─ netlify.toml
├─ docs/
│  ├─ PROJECT_EXECUTION.md
│  └─ IMAGE_PROMPTS.md
├─ images/
│  └─ README.md
├─ netlify/
│  └─ functions/
│     ├─ _mpti-analytics.mjs
│     ├─ mpti-analytics-track.mjs
│     └─ mpti-analytics-summary.mjs
└─ package.json
```

说明：

- 页面逻辑和组件已经完整迁移到 `MPTI`。
- 图片目前采用“缺图优雅降级”，即没有最终插画时也能正常浏览和测试。
- `npm run build` 会自动刷新图片和 JS 资源版本号；Netlify 部署时也会自动执行。
- 对应文生图 Prompt 已整理在 [docs/IMAGE_PROMPTS.md](./docs/IMAGE_PROMPTS.md)。
- 详细执行文档在 [docs/PROJECT_EXECUTION.md](./docs/PROJECT_EXECUTION.md)。
