# 技术栈推荐文档

## 前端 (Frontend)

对于前端，我们的目标是：极致的开发体验、稳固的代码质量、以及与我们原型无缝衔接的 UI 实现。最终推荐的技术栈如下：

### 脚手架 / 构建工具 (Scaffolding / Build Tool)

**Vite**

**为什么？**

- 提供闪电般的项目启动和代码热更新速度
- 目前开发体验最佳的选择
- 极大提升前端团队的工作幸福感

### UI 库 (UI Library)

**React**

**为什么？**

- 构建可交互、组件化应用的市场标准
- 我们之前讨论的组件拆分（如 `<TaskItem>`, `<SchedulePage>`）基于 React 思想，可直接落地

### 语言 (Language)

**TypeScript (TS)**

**为什么？**

- 带来“类型安全”，在代码编写阶段就能发现大量潜在错误
- 团队协作中能确保数据格式正确传递
- 保证项目长期稳定性

### 样式方案 (Styling)

**Tailwind CSS**

**为什么？**

- 原型设计已经基于 Tailwind CSS
- 高效将原型设计转化为产品级代码
- 避免在 CSS 和 JS 文件间来回切换

**前端技术栈总结：**  
`Vite + React + TypeScript + Tailwind CSS`

> 现代、专业且高效的“黄金组合”

---

## 后端 (Backend)

对于后端，我们的目标是：快速开发 API、与前端语言统一、轻松处理实时数据和定时任务。推荐技术栈如下：

### 运行环境 (Runtime Environment)

**Node.js**

**为什么？**

- 使用 JavaScript/TypeScript 编写后端
- 实现前后端语言统一
- 团队成员更容易理解彼此的代码，必要时可角色互换

### Web 框架 (Web Framework)

**Express.js**

**为什么？**

- 极简、灵活、成熟
- 构建 API 接口（如 `GET /api/tasks`, `POST /api/goals`）简单高效
- 不会带来额外复杂性

### 数据库 (Database)

**MongoDB**

### 数据库交互库 (ORM / ODM)

**Mongoose**（如果选择 MongoDB）

- 与 MongoDB 交互的事实标准

---

## 目录结构定义：

repo-root/ ← 仓库根目录
│
├─ apps/ ← 这里放最终运行的“应用”（对外的东西）
│ ├─ frontend/ ← 前端应用（React 壳子，调用后端 API）
│ └─ backend-gateway/ ← 后端网关，前端的所有请求先到这里，再分发到各个服务
│
├─ services/ ← 这里放业务服务（后台的“功能模块”）
│ ├─ schedule-service/ ← 服务 1：排班/日程相关（伙伴 A 写的）
│ └─ planning-service/ ← 服务 2：规划/计划相关（伙伴 B 写的）
│
├─ packages/ ← 共享代码（可复用的库，不直接跑）
│ ├─ ui/ ← UI 组件库，比如按钮、弹窗，前端项目会用
│ └─ config/ ← 配置库，比如 ESLint 规则、TS 配置，多个项目都能共享
│
└─ package.json ← 顶层依赖和 workspace 配置
