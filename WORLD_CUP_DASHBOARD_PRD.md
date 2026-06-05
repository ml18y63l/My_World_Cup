在终端中使用 Claude Code 时，你可以直接输入：`/read WORLD_CUP_DASHBOARD_PRD.md`，然后告诉它：“请阅读这份文档，并按照最后的【执行步骤】从 Step 1 开始帮我构建项目。”

---

# 🏆 2026 World Cup Data Dashboard - System Design & Vibe Coding Guide

## 0. 给 AI Agent 的上下文 (Context for Claude Code)
你现在是一个资深全栈工程师和数据工程师。你的任务是基于本 Markdown 文档的规范，通过 "Vibe Coding" 的方式，协助用户一步步完成“2026 美加墨世界杯球队能力看板”的开发。
本项目采用 **前后端分离但数据轻量化** 的架构：使用 Python 处理原始数据并生成 JSON 文件，前端使用 Next.js 直接读取 JSON 文件作为数据库进行渲染。赛事期间通过 GitHub Actions 和第三方 API 实现数据自动化更新。

---

## 1. 技术栈选择 (Tech Stack)
*   **前端框架**: Next.js (App Router), React, TypeScript
*   **UI & 样式**: Tailwind CSS, shadcn/ui, Lucide Icons
*   **图表库**: Recharts 或 ECharts (主要用于渲染六边形/八边形雷达图)
*   **数据处理 (ETL)**: Python (Pandas, Numpy)
*   **自动化与部署**: Vercel (前端托管), GitHub Actions (定时任务与数据抓取)
*   **第三方数据源**: API-Football (赛时数据), Bet365(模拟盘口),专业足球评论员评论(提炼关键信息),社媒情感数据(模拟)

---

## 2. 数据库架构设计 (JSON-Based File DB)
系统采用扁平化文件数据库，核心目录结构如下：

```text
/database
├── /1_raw_data                  # 原始参考信息文件夹
│   ├── /social_media            # 社媒舆论与球员状态 (如 Tiktok情绪分析结果)
│   ├── /odds                    # 盘口与赔率数据 (如 bet365 夺冠赔率、让球)
|   ├── /history                 # 球队近一年战绩数据    
│   └── /stats                   # 基础统计数据 (进球数、转会身价、FIFA排名等)
│
└── /2_ability_models            # 能力建模文件夹 (前端读取的核心数据源)
    ├── /Argentina
    │   ├── profile.json         # 球队基础信息与身价
    │   ├── roster.json          # 球员大名单与状态
    │   └── radar_data.json      # 六维雷达图能力模型数据
    │   └── strategy.json        # 教练与球队常用战术
    ├── /France
    └── /... (其他32强球队)
```

---

## 3. 数据模型定义 (Data Schemas)
在生成 TypeScript Interfaces 或构建 JSON 文件时，请严格遵守以下 Schema：

**3.1 `profile.json` (球队概览)**
```json
{
  "team_id": "ARG",
  "team_name": "阿根廷",
  "confederation": "CONMEBOL",
  "head_coach": "利昂内尔·斯卡洛尼",
  "total_value_m_euros": 850.5,
  "fifa_ranking": 1,
  "base_formation": "4-3-3"
}
```

**3.2 `radar_data.json` (八维能力雷达)**
所有维度分数为 `30-100`。
```json
{
  "team_id": "ARG",
  "metrics": {
    "attack": 92,        // 进攻火力
    "defense": 85,       // 防守硬度
    "control": 88,       // 战术控制
    "status": 90,        // 球员状态 (结合社媒与近期表现)
    "experience": 95,    // 底蕴与经验
    "place_kick": 70,    // 角球与任意球能力
    "superstar": 80,     // 球星指数
    "penalty": 89        // 点球能力
  },
  "update_time": "2026-06-04T12:00:00Z"
}
```

**3.3 `roster.json` (球员大名单)**
```json
[
  {
    "name": "利昂内尔·梅西",
    "position": "FW",
    "club": "迈阿密国际",
    "market_value_m_euros": 30.0,
    "status": "Healthy",   // Healthy, Injured, Suspended
    "is_captain": true
  }
]
```

---

## 4. 前端页面需求 (Frontend UI/UX)

1.  **赛事概览页 (World Cup Hub)**
    *   48强分组概览展示。
    *   动态条形图/柱状图展示夺冠赔率榜和总身价榜。
2.  **球队画像页 (Team Profile)**
    *   动态路由 `/team/[id]`。
    *   左侧布局：主教练信息、总身价展示面板、26人名单列表（支持按位置过滤）。
    *   右侧布局：核心组件——**能力雷达图**。下方展示来自社媒的关键词 Tag（如 `#阵容老化`, `#状态火热`）。
3.  **对阵模拟器 (Match-up H2H)**
    *   双下拉菜单选择对战球队（主客场）。
    *   核心视图：**重叠式雷达图**（两支球队使用不同颜色和透明度重叠，直观对比强弱项）。
    *   数据对比表：总身价对比、胜平负赔率对比、综合总分对比。

---

## 5. 数据转换算法设计 (ETL Logic)
Python 脚本需要将 `1_raw_data` 转换为 `2_ability_models`。

**5.1 归一化算法 (Min-Max Normalization)**
*   用于将真实世界的绝对数值（如场均进球）映射到 60-100 的能力值。
*   公式: `Score = 60 + ((Value - Min) / (Max - Min)) * 40`

**5.2 非线性赔率映射 (用于整体实力/状态)**
*   Bet365的赔率越小，实力越强。需先取倒数转换为隐含胜率，再进行归一化。
*   `Implied_Probability = 1 / Odds`

**5.3 赛时动态权重更新 (EMA 模型)**
*   世界杯开赛后，接入 API-Football 的赛后数据进行每日更新。
*   公式: `New_Radar_Score = (Old_Score * 0.7) + (Match_Performance_Score * 0.3)`
*   *说明：随着赛事深入，历史预设比重逐渐降低，本届赛事的真实表现比重逐渐升高。*

---

## 6. 自动化同步流水线 (Live Update Pipeline)
1.  编写 Python 脚本 `sync_daily_stats.py`。
2.  通过 GitHub Actions 配置 `.github/workflows/daily_update.yml`。
3.  **触发条件**: 赛事期间每天北京时间上午 10:00 (Cron: `0 2 * * *`) 运行。
4.  **执行流程**:
    *   请求 API-Football 获取过去 24 小时的比赛统计。
    *   存入 `1_raw_data/live_stats/`。
    *   运行 ETL 重新计算并覆写 `2_ability_models/` 中的 JSON。
    *   执行 `git commit -am "Daily data update"` 并 push。
    *   Vercel 检测到代码库变化，自动拉取新 JSON 触发增量静态再生 (ISR) 或重新部署。

---

## 7. 给 Claude Code 的分步执行指令 (Vibe Coding Steps)

**当用户要求开始开发时，请严格按照以下步骤递进交互，不要试图一次性写完所有代码：**

*   **Step 1: 环境初始化与数据脚手架**
    *   初始化 Next.js + Tailwind + shadcn/ui 项目。
    *   创建 `database/` 目录结构。
    *   编写一个 Python 伪造脚本 `scripts/mock_data_generator.py`，生成 4-5 支测试球队（阿根廷、法国、英格兰、巴西）的 `raw_data` 和初始的 `ability_models` JSON 文件，以便前端有数据可调。
*   **Step 2: 核心组件开发 (雷达图)**
    *   安装 Recharts。
    *   编写一个可复用的 `RadarChartComponent`，支持传入单支球队或两支球队的雷达图数据，并能优雅地渲染。
*   **Step 3: 前端页面构建**
    *   搭建全局 Layout 和侧边栏导航。
    *   完成 `/` (概览页), `/team/[id]` (球队页) 和 `/h2h` (对阵模拟器页) 的静态切图，并接入生成的本地 JSON 数据。
*   **Step 4: ETL 数据处理脚本开发 (The Brain)**
    *   使用 Python 实现第 5 节描述的 Min-Max 算法和赔率转换逻辑，完成 `raw_data` 到 JSON 数据库的真实逻辑转换脚本。
*   **Step 5: 赛时自动化更新流**
    *   编写 GitHub Actions 的 YAML 配置文件。
    *   编写用于赛时根据表现更新分数的 EMA 权重算法框架。