# 球队画像页面 + 雷达图数据推导 设计

> 日期：2026-06-14
> 数据来源：用户提供巴西队 Excel（`database/2_ability_models/Brazil/C组/巴西队.xlsx`，含 概览/球员信息/对阵历史 三 sheet）
> 方法论权威文件：[`docs/radar-derivation-methodology.md`](../../radar-derivation-methodology.md)

## 1. 背景与目标

用户提供了巴西国家队资料 Excel，要求**严格基于该数据**：
1. 新建巴西球队画像页面；
2. 用透明公式从数据推导 8 维雷达图能力分（Excel 内**无**显式能力分，需推导）；
3. 近期战绩按**赛事权重**（降友谊赛、升正式赛）重算后再推导；
4. 将推导方法整理为可复用文档，供其它球队套用。

## 2. 范围

**包含：**
- 巴西完整球队画像页面（`/team/[teamNameEn]`）
- 巴西 `squad.json` / `profile.json` / `recent_form.json` / `radar_data.json` 数据更新
- 雷达推导纯函数 `deriveRadar()`（TDD）
- 可复用方法论文档 `docs/radar-derivation-methodology.md`

**不含（非目标）：**
- 其它球队的球员数据（目前仅巴西有大名单）
- 球员级雷达 / 个人能力分
- 自动化锚点校准（人工校准）
- 相对百分位排名视图（见方法论 §7，不采用）

## 3. 页面与路由

- 新增动态路由 `/team/[teamNameEn]`（如 `/team/Brazil`）。48 队均可访问。
- **巴西**：完整画像。**其它队**：优雅降级——显示 profile + 雷达 + 战绩，名单区块显示"暂无大名单数据"或隐藏。
- 入口：首页球队列表点击队名 → `/team/[teamNameEn]`。
- 视觉：复用 `/h2h` 语言（深色底 `#1a1a2e`、红/金强调、手写 SVG 雷达）。

**页面区块：**
1. **头部**：队名(中/英)、国旗(`country_code`)、足联、FIFA 排名徽章、分组
2. **概览卡**：主教练、总身价(`formatValue`)、阵型、晋级方式
3. **单队雷达图 + 8 维能力条**（复用/改写 `RadarCompareChart` 为单队版）
4. **大名单表**：号码 / 位置 / 球员(中英) / 年龄 / 出场 / 进球 / 助攻 / 俱乐部(中英) / 身价 / 伤病标记；支持按位置(GK/DF/MF/FW)筛选
5. **近期战绩**：W/D/L 色块 + 比分 + 对手 + 赛事 + 汇总(胜平负、进失球)

## 4. 数据模型（严格来自 Excel）

**新增 `database/2_ability_models/<Team>/squad.json`**（先填巴西）：
```jsonc
{
  "team_id": "BRA",
  "players": [
    {
      "number": 1, "position": "GK",
      "name_cn": "阿利森", "name_en": "Alisson",
      "birth_date": "1992-10-02", "age": 33,
      "caps": 78, "goals": 0, "assists": null,
      "club_cn": "利物浦", "club_en": "Liverpool",
      "value_wan_euros": 1500,
      "preferred_position": "GK",
      "injury_note": "未见最终名单页标注"
    }
    // ... 共 26 人
  ]
}
```

**更新 `profile.json`（巴西）**：
- `fifa_ranking`: 5 → **6**
- `total_value_m_euros`: 1100 → **928**（=26 人身价之和 92820 万 ≈ 928M，与"概览"9.28 亿自洽）
- `head_coach`: "安切洛蒂" → **"卡洛·安切洛蒂"**
- `group`: "B" → **"C"**（依据：文件位于"C组"夹 + 源链接 `...Group_C`）
- 新增可选字段 `qualification`: **"CONMEBOL round robin fifth place"**
- `base_formation`: 维持 `"4-3-3"`（Excel 无阵型字段；3GK/8DF/6MF/9FW 人数相容，未被数据否定）

**更新 `recent_form.json`（巴西）**：替换为 14 场已完赛（3 场未赛世界杯 Morocco/Haiti/Scotland 排除）。保留每场 `type` 以支持加权。`summary`：8胜2平4负 / 进29失16。

**更新 `radar_data.json`（巴西）** 为推导值（见 §5）。

**类型**（`src/types/team.ts`）：新增 `SquadPlayer`、`SquadData` 接口；`TeamProfile` 增加可选 `qualification?: string`。

**`src/lib/data.ts`**：新增 `getSquad(teamNameEn): SquadData | null`。

## 5. 雷达推导（核心）

- 纯函数 `deriveRadar(squad, form, profile): RadarMetrics`，置于 `src/lib/`，**TDD**（Vitest）。
- 赛事权重：`friendly=0.5`、`qualifier=1.0`、`tournament=1.0`；仅计已完赛（`score`≠`"-"`）。
- 完整公式、锚点表、度量定义见 [`docs/radar-derivation-methodology.md`](../../radar-derivation-methodology.md) §2–§5。
- **巴西推导结果**：`attack 85 / defense 70 / control 83 / status 72 / experience 70 / place_kick 81 / superstar 93 / penalty 92`。
- 与现值显著变化：defense 96→70、status 93→72、experience 93→70（现值偏高，数据不支持）；superstar 85→93（数据支持上调）。

## 6. 碰撞、精度与校准

详见方法论 §7。要点：
- 绝对能力刻度：同数据=同分，合理（雷达≠排名）；H2H 模拟需绝对刻度。
- 防假碰撞：留存子分数、内部高精度、整数显示、整图形状区分。
- 推导队 vs 手工队刻度不一致，H2H 横向比较需注意；根治=逐步全队推导，累计 ≥5 队后做锚点重校准。

## 7. 测试策略

- **TDD `deriveRadar`**：纯函数、确定性。给定巴西 `squad.json` + `recent_form.json` → 期望上述 8 个整数。另加边界用例（空名单、全友谊赛、无已完赛等）。
- 页面渲染冒烟测试沿用现有模式（HTTP 200、关键区块存在）；优雅降级路径（无 squad 的队）单独覆盖。

## 8. 文件清单

**新增：**
- `src/app/team/[teamNameEn]/page.tsx`（服务端组件，取数）
- `src/components/TeamProfileClient.tsx`（客户端：名单筛选等交互）
- `src/components/SingleRadarChart.tsx`（单队雷达，可由 `RadarCompareChart` 改写）
- `src/components/SquadTable.tsx`、`src/components/RecentFormList.tsx`
- `src/lib/deriveRadar.ts` + `src/lib/__tests__/deriveRadar.test.ts`
- `database/2_ability_models/Brazil/squad.json`
- `docs/radar-derivation-methodology.md`（已随本 spec 一并产出）

**修改：**
- `database/2_ability_models/Brazil/profile.json`、`recent_form.json`、`radar_data.json`
- `src/types/team.ts`（`SquadPlayer`/`SquadData`、`qualification`）
- `src/lib/data.ts`（`getSquad`）
- `src/app/page.tsx` 或球队列表组件（加跳转链接）

## 9. 实现方式

subagent-driven-development，按 spec → plan → 分任务实现；每任务含实现 + spec 合规审查 + 代码质量审查。
