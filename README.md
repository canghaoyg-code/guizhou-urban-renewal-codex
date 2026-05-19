# 规划项目公示信息台账

这是一个用于收集和展示公示项目基础信息的轻量页面。当前版本已经去掉金额预算、周边数据和 7 天行动表，只保留两类内容：

- 项目公示详情：项目名称、地区、类型、业主单位、地址、状态、用地属性、更新范围、原文来源。
- 政策详情：政策标题、发布单位、发布日期、政策层级、主题、要点、原文来源。

## 自动采集

项目通过 GitHub Actions 每天自动执行一次采集任务：

```bash
npm run collect
npm run build
```

采集结果写入：

```text
public/data/public-info.json
```

前端页面会优先读取这份 JSON；如果读取失败，则使用 `src/data/projectData.js` 中的内置样例。

## 公开访问

桌面和手机都可以打开：

```text
https://canghaoyg-code.github.io/guizhou-urban-renewal-codex/
```

手机专用入口仍然保留：

```text
https://canghaoyg-code.github.io/guizhou-urban-renewal-codex/mobile.html
```

两个入口展示同一套简化后的项目和政策详情。

## 本地运行

```bash
npm install
npm run dev
```

本地预览：

```text
http://127.0.0.1:5173/
http://127.0.0.1:5173/mobile.html
```

手动执行一次采集：

```bash
npm run collect
```

## 项目结构

```text
guizhou-urban-renewal-codex/
├── .github/workflows/daily-collect.yml
├── public/data/public-info.json
├── scripts/collect-public-info.mjs
├── src/
│   ├── data/projectData.js
│   ├── main.jsx
│   └── styles.css
├── index.html
├── mobile.html
└── package.json
```

## 后续建议

- 为每个政府网站补充专用详情页解析器，提取业主单位、地址、建设内容等字段。
- 增加去重规则，按标题、来源链接和发布日期合并同一项目。
- 如果后续需要人工增删改查，再接入一个轻量后端或表格数据库，而不是把编辑数据只存在手机浏览器里。
