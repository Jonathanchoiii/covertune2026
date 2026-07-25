# AlbumLinker：专辑跨平台匹配与 NeoDB 链接助手 PRD

> 文档类型：Spec-first 产品需求与技术行为规格  
> 状态：v0.1 Draft  
> 更新日期：2026-07-25  
> 默认语言：简体中文  
> 目标读者：产品负责人、设计师、前后端开发者、测试人员、编码 AI  
> MVP 定位：个人使用优先的网页工具；输入歌手名和/或专辑名，聚合封面、年份与跨平台链接，解释匹配置信度，并快速复制可供 NeoDB 检索或导入的地址。

---

## 0. 文档使用规则

### 0.1 Source of Truth

本文件是 AlbumLinker MVP 的唯一产品行为真相源。编码 AI、设计稿、接口实现和测试用例均不得与本文件冲突。

优先级从高到低为：

1. 第 18 章“验收标准”；
2. 第 9 章“匹配与评分规格”；
3. 第 7 章“功能需求”；
4. 第 12 章“接口契约”；
5. 其他说明。

若仍存在歧义，实现方必须：

1. 在 `ASSUMPTIONS.md` 记录假设；
2. 选择不会虚构精确匹配、不会泄漏密钥、不会违反第三方条款的保守实现；
3. 不得为了让界面看起来完整而生成不存在的专辑详情 URL、平台 ID、条码、MBID 或匹配分。

### 0.2 编码 AI 开始前必须输出

1. 不超过 15 行的实现计划；
2. 计划创建或修改的目录；
3. 采用的第三方接入模式；
4. 尚未配置的环境变量；
5. 会被降级为“搜索入口”的平台；
6. 对本规格的阻塞问题。没有阻塞问题时直接开始，不重复询问已经明确的需求。

### 0.3 术语

- **Canonical Album（标准专辑）**：本次检索中由用户最终确认的专辑实体，通常以 MusicBrainz Release Group 为元数据锚点。
- **Release Group**：MusicBrainz 中把同一专辑的不同发行版本归为一组的实体。
- **Release**：某个具体地区、介质、日期或版本的发行记录。
- **Provider Result（平台结果）**：某个第三方平台返回或搜索到的专辑候选。
- **Exact Detail URL（精确详情页）**：可以打开某一张明确专辑记录的永久或稳定链接。
- **Search URL（搜索入口）**：只包含查询词、仍需用户在第三方站点内选择结果的链接。
- **NeoDB 可导入链接**：NeoDB 官方“支持站点”列表中声明可用于 Music (Album) 的第三方专辑详情 URL。
- **匹配分**：本产品根据可解释字段计算的 0–100 分，不是第三方平台官方分数。
- **已验证**：存在强标识符一致、平台关联关系或人工确认，不等于法律意义的认证。

---

## 1. 产品摘要

### 1.1 一句话说明

用户输入歌手名、专辑名或两者，AlbumLinker 在多个音乐资料与流媒体平台查找同一张专辑，统一展示封面、发行年份、版本差异、平台链接和可解释匹配分，并让用户一键复制最适合在 NeoDB 中检索或导入的 URL。

### 1.2 核心问题

用户当前为了在 NeoDB 收录一张专辑，通常需要：

1. 在多个网站反复输入相同关键词；
2. 肉眼比较同名专辑、豪华版、重制版、单曲和合辑；
3. 分别确认封面、年份和歌手；
4. 打开多个详情页并复制链接；
5. 回到 NeoDB 逐个尝试。

这套流程重复、容易选错版本，也无法快速判断一个结果为什么“像是同一张专辑”。

### 1.3 产品承诺

AlbumLinker 的承诺是“减少查找与复制动作，并把判断依据摆在用户面前”，不是“永远自动判断正确”。

产品必须始终：

- 区分精确详情页与搜索入口；
- 区分专辑级匹配与具体发行版本匹配；
- 展示匹配分的证据与缺失项；
- 允许用户手动改选标准专辑和各平台候选；
- 在不确定时要求复核，而不是伪装成确定结果。

### 1.4 暂定名称

- 产品名：AlbumLinker
- 中文副标题：专辑跨平台匹配与 NeoDB 链接助手
- 代码中产品名称必须集中配置，避免散落硬编码。

---

## 2. 背景、目标与成功指标

### 2.1 目标用户

MVP 的主要用户是：

- 经常在 NeoDB 标记或创建音乐专辑条目的个人用户；
- 需要核对不同音乐数据库专辑记录的音乐收藏者；
- 需要快速整理多个平台专辑链接的编辑、博主或资料维护者。

MVP 不面向大规模商业音乐数据抓取、批量盗链或音乐播放服务。

### 2.2 MVP 目标

- 用户只输入一个查询即可获得跨平台对比结果。
- 对主流专辑，10 秒内出现首批可用结果；慢平台可继续异步补齐。
- 用户能在一个页面确认歌手、专辑、首发年份和封面。
- 每个平台均显示状态、匹配分、证据、链接类型和复制操作。
- 用户可以一键复制最适合 NeoDB 的已支持平台详情 URL。
- 用户可以复制全部链接，免去逐个网站重新搜索。
- 接口失败时局部降级，不因单个平台故障导致整次检索失败。

### 2.3 非目标

MVP 不实现：

- 站内播放完整歌曲或绕过流媒体订阅；
- 下载专辑封面原图或音乐文件；
- 用户账号、社交、评论、榜单和评分社区；
- 批量导入数千张专辑；
- 自动修改 NeoDB 条目；
- 未经用户授权代表用户在 NeoDB 收藏、打分或发帖；
- 对第三方网站做高频、绕过登录、验证码或反爬措施的抓取；
- 把 Spotify、Apple Music 等平台内容用于训练模型；
- 保证 AOTY、Record Club 的链接可被 NeoDB 导入；
- 在没有证据时推断 UPC、条码、MBID、Spotify ID、Apple ID。

### 2.4 成功指标

MVP 上线后建议记录匿名事件：

| 指标 | 目标 |
|---|---:|
| 有效查询获得至少 1 个标准专辑候选 | ≥ 95% |
| 用户从查询到复制第一个链接的中位时长 | ≤ 20 秒 |
| 已配置的官方 API 平台成功返回率 | ≥ 95% |
| 精确详情链接被人工判定正确的比例 | ≥ 90% |
| 被标为“高置信”但用户手动改选的比例 | ≤ 10% |
| 首屏候选 API P95（不等待慢平台） | ≤ 3 秒 |
| 跨平台聚合在 10 秒内完成或明确超时 | ≥ 95% |
| 单个平台失败导致整页失败 | 0 次 |
| 复制操作成功率 | ≥ 99% |

匹配准确率必须基于人工标注的测试集测量，不能用“接口返回成功”替代。

---

## 3. 已确认事实、产品假设与待确认项

### 3.1 已确认事实

1. MusicBrainz 提供 Release Group 与 Release 搜索 API；可返回标题、歌手、首发日期、类型、MBID 等。
2. Cover Art Archive 可根据 MusicBrainz Release 或 Release Group 获取封面。
3. Spotify Web API 支持专辑搜索并返回 Spotify 专辑 URL，但需要 OAuth 访问令牌。
4. Apple Music API 支持目录搜索并需要开发者令牌。
5. YouTube Data API 的官方搜索对象是 YouTube 视频、频道与播放列表，不等同于一个稳定的 YouTube Music 专辑目录 API。
6. NeoDB 当前公布的音乐专辑支持站点包括 Apple Music、豆瓣、MusicBrainz、Spotify、YouTube Music 等。
7. NeoDB 当前公布的支持站点列表未列出 Album of the Year（AOTY）或 Record Club；这两个平台的链接在本产品中只作为交叉核验与访问链接。
8. AOTY、Record Club、豆瓣没有在本次调研中确认到适合本 MVP 的公开官方专辑搜索 API，因此默认不得将页面抓取当作稳定 API。

### 3.2 产品假设

- A-001：MVP 优先服务单个用户或小范围内部使用，不要求登录。
- A-002：用户输入歌手名和专辑名时，比只输入一个字段更期望直接得到精确专辑。
- A-003：只输入歌手名时，用户愿意先从该歌手的专辑列表中选择。
- A-004：用户真正需要的是“减少操作”，因此允许某些平台只提供已预填关键词的搜索入口，但必须明确标记。
- A-005：英文、中文、日文、韩文和其他 Unicode 专辑/歌手名都应保留；匹配时另做规范化。
- A-006：MVP 默认地区为用户可配置的 `CN`，Apple Music storefront 默认 `cn`，Spotify market 默认 `CN`；若服务在该地区不可用，可在设置中改为 `US`、`HK`、`JP` 等。

### 3.3 开发前无需阻塞、但应保留配置的事项

- 产品最终名称；
- 部署域名；
- 默认 NeoDB 实例，初始值建议为 `https://neodb.social`；
- Apple Developer、Spotify Developer 与通用网页搜索 API 凭证；
- 是否公开给多人使用；
- 是否在 V1.1 增加 Discogs、Bandcamp、Rate Your Music。

---

## 4. 平台接入策略

### 4.1 接入等级

| 等级 | 名称 | 含义 |
|---|---|---|
| P0 | 官方 API 精确结果 | 使用官方 API 获得结构化专辑实体和详情 URL |
| P1 | 官方关联精确结果 | 通过 MusicBrainz URL relationship 或强标识符获得平台详情 URL |
| P2 | 合规网页搜索结果 | 使用合法的通用网页搜索 API，以 `site:` 查询发现详情页，再做域名与内容摘要校验 |
| P3 | 站内搜索入口 | 构造平台公开搜索 URL，仅代表“去这里继续搜索” |
| P4 | 未配置或不可用 | 展示原因，不生成假链接 |

MVP 不允许未经批准的新接入方式。任何非官方 SDK、逆向接口或页面抓取必须放在实验功能开关之后，默认关闭。

### 4.2 各平台 MVP 方案

| 平台 | 主要用途 | 默认接入 | 精确详情 URL | NeoDB 用途 | 备注 |
|---|---|---|---|---|---|
| MusicBrainz | 标准元数据锚点 | P0 官方 API | 是 | 可导入候选 | 核心必需；服务端限速 |
| Cover Art Archive | 标准封面 | P0 官方 API | 图片 URL | 不直接用于导入 | 优先 500px 缩略图 |
| Spotify | 商业目录与链接 | P0 官方 API | 是 | 可导入候选 | 需 Client Credentials；按 market 查询 |
| Apple Music | 商业目录与链接 | P0 官方 API | 是 | 可导入候选 | 需服务端签发开发者 JWT |
| YouTube Music | 平台入口/候选 | P3 默认；P2 可选 | P2 时可能 | 仅精确专辑页可作为候选 | 官方 YouTube 搜索不能直接保证是 YT Music 专辑 |
| 豆瓣音乐 | 中文资料与链接 | P2 默认；P3 降级 | P2 时可能 | 可导入候选 | 只接受 `music.douban.com/subject/...` 等允许的专辑详情域名/路径 |
| AOTY | 评分站交叉核验 | P2 默认；P3 降级 | P2 时可能 | 不作为可导入链接 | 不抓取评分正文；MVP 只聚合链接与搜索摘要允许的字段 |
| Record Club | 社区资料交叉核验 | P2 默认；P3 降级 | P2 时可能 | 不作为可导入链接 | 无已确认公开 API；不得绕过 403、登录或反爬 |
| NeoDB | 最终操作目标 | 打开配置实例 | 不负责第三方数据 | 目标平台 | MVP 不自动写入用户账号 |

### 4.3 Provider 必须返回的统一状态

每个平台无论成功与否都必须返回一行结果：

```ts
type ProviderStatus =
  | "verified_exact"
  | "probable"
  | "needs_review"
  | "search_only"
  | "not_found"
  | "not_configured"
  | "rate_limited"
  | "temporarily_unavailable";
```

规则：

- `verified_exact`：必须存在强标识符、官方跨链或人工确认；
- `probable`：综合分达到阈值，但没有强标识符；
- `needs_review`：候选存在，但冲突或证据不足；
- `search_only`：URL 是搜索页，`matchScore` 必须为 `null`；
- `not_found`：已成功查询但没有合格候选；
- `not_configured`：缺少凭证、功能开关关闭或管理员未配置；
- `rate_limited`：上游返回限速；
- `temporarily_unavailable`：网络、超时或上游故障。

---

## 5. 用户故事

### US-01：歌手 + 专辑精确查找

作为 NeoDB 用户，我输入歌手和专辑名，希望直接看到最可能的标准专辑以及所有平台链接。

### US-02：只输入专辑名

作为用户，我只记得专辑名，希望看到不同歌手的候选并先确认目标。

### US-03：只输入歌手名

作为用户，我想先浏览该歌手的正式专辑，再选择其中一张做跨平台匹配。

### US-04：比较版本

作为用户，我想区分原版、重制版、豪华版、现场版、单曲和合辑，避免把错误版本带到 NeoDB。

### US-05：理解匹配分

作为用户，我想知道标题、歌手、年份、曲目数、条码或封面分别匹配到什么程度，而不是只看一个神秘百分比。

### US-06：复制到 NeoDB

作为用户，我想一键复制当前最可信、且 NeoDB 明确支持的专辑详情 URL。

### US-07：复制全部链接

作为用户，我想以纯文本或 Markdown 一次复制所有平台链接，方便保存或继续核对。

### US-08：手动纠正

作为用户，我想在某个平台改选第二或第三候选，并让页面立即重算状态和推荐复制链接。

### US-09：局部失败

作为用户，即使某个平台限流或不可访问，我仍想继续使用其他平台的结果，并看到清楚的失败原因与重试按钮。

---

## 6. 核心流程

### 6.1 流程 A：输入歌手与专辑

1. 用户输入 `artist` 和 `album`。
2. 前端提交结构化查询。
3. 后端先搜索 MusicBrainz Release Group。
4. 页面显示最多 10 个标准专辑候选。
5. 若第一名满足自动选择条件，则预选但仍允许改选。
6. 后端并发调用其他已配置 Provider。
7. 每个平台结果流式或轮询更新，不阻塞整页。
8. 用户查看封面、年份和证据。
9. 用户按需改选某个平台候选。
10. 用户点击“复制 NeoDB 链接”“复制此链接”或“复制全部”。

### 6.2 流程 B：只输入歌手

1. 用户输入歌手名。
2. 系统搜索 MusicBrainz Artist，显示最多 10 个歌手候选。
3. 用户选择歌手。
4. 系统加载该歌手 Release Groups，默认仅显示：
   - Album；
   - EP；
   - 可切换显示 Single、Live、Compilation、Soundtrack、Remix。
5. 用户选择专辑后进入跨平台匹配。

### 6.3 流程 C：只输入专辑

1. 用户输入专辑名。
2. 系统搜索 MusicBrainz Release Group。
3. 结果卡必须突出显示歌手，避免同名专辑误选，显示最多 10 个专辑候选。
4. 用户选择标准专辑后进入跨平台匹配。
5. 第一名即使分数很高，也不得在存在多个不同歌手同名候选时跳过确认。

### 6.4 流程 D：没有 MusicBrainz 结果

1. MusicBrainz 返回空结果或不可用。
2. 系统进入“无标准锚点模式”。
3. 若 Spotify 或 Apple Music 已配置，显示其候选。
4. 用户可选择一个候选作为临时 Canonical Album。
5. 所有匹配最高只能标记为 `probable`，不能标记为 `verified_exact`，除非存在 UPC 等强标识符。
6. 复制区仍可提供 NeoDB 支持的详情 URL。

---

## 7. 功能需求

### 7.1 查询输入

#### FR-001 结构化输入

页面必须包含：

- `歌手名`：可选；
- `专辑名`：可选；
- `发行年份`：可选，四位整数；
- `地区/商店`：高级选项，默认从设置读取；
- 主按钮：`搜索专辑`。

歌手名和专辑名至少填写一个。

#### FR-002 输入限制

- 每个文本字段去除首尾空格；
- 连续空白折叠为一个空格；
- 最长 200 个 Unicode 字符；
- 不删除重音符号、汉字、假名、韩文或标点；
- 年份范围：1900 至当前年份 + 1；
- 不执行 HTML；
- URL 编码必须在服务端或标准 URL API 中完成。

#### FR-003 查询历史

MVP 可在浏览器本地保存最近 20 条查询：

- 默认开启；
- 设置中可关闭并清空；
- 不上传原始搜索词用于分析；
- 不跨浏览器同步。

### 7.2 标准专辑候选

#### FR-010 候选数量

- 默认返回最多 8 个 Release Group；
- 每个候选显示封面、标题、歌手、首发日期、主要类型、次要类型和 MusicBrainz 链接；
- 无封面时显示中性占位图，不使用无来源图片替代。

#### FR-011 自动选择规则

仅当以下条件全部满足时，系统可以自动预选第一名：

- 用户同时填写了歌手和专辑；
- 第一名基础搜索分 ≥ 90；
- 第一名比第二名至少高 10 分；
- 第一名没有与用户年份相差超过 1 年；
- 第一名不是明显的 `Live`、`Compilation`、`Remix`，除非查询词本身包含对应限定词。

预选不是锁定，用户可随时切换。

#### FR-012 版本警告

候选或平台结果标题包含以下版本提示词时，必须展示标签：

`deluxe`、`expanded`、`remaster`、`remastered`、`anniversary`、`bonus`、`live`、`compilation`、`soundtrack`、`remix`、`karaoke`、`instrumental`、`clean`、`explicit`，以及配置的中文/日文等同义词。

版本提示词用于解释，不可直接把候选判为错误。

### 7.3 跨平台结果

#### FR-020 平台行

每个平台行必须显示：

- 平台名称与图标；
- 状态徽标；
- 匹配分或 `—`；
- 专辑标题；
- 歌手；
- 发行日期或年份；
- 缩略封面；
- 链接类型：`精确详情页` 或 `搜索入口`；
- `查看证据`；
- `打开`；
- `复制`；
- 多候选时的 `更换结果`。

#### FR-021 渐进加载

- MusicBrainz 候选先返回；
- 其他 Provider 独立加载；
- 单个平台默认超时 6 秒；
- 聚合请求总等待上限 10 秒；
- 超时平台可单独重试；
- 已完成结果不得因其他平台失败消失。

#### FR-022 多候选

- 每个平台保留最多 5 个原始候选；
- 默认展示最佳候选；
- 用户点“更换结果”可查看其他候选及其分数；
- 用户手动选择后，结果标记 `人工选择`；
- 在当前搜索会话内保持选择。

#### FR-023 搜索入口

对于 P3 结果：

- 文案必须显示 `仅搜索入口，尚未确认具体专辑`；
- 不显示匹配百分比；
- 不可作为默认的“复制 NeoDB 链接”；
- 可以单独复制；
- URL 查询词至少包含已知的歌手名与专辑名。

### 7.4 对比视图

#### FR-030 字段对比

页面必须提供紧凑对比表或卡片，字段包括：

- 封面；
- 专辑标题；
- 主艺人；
- 首发年份/平台发行年份；
- 专辑类型；
- 曲目数；
- UPC/条码（仅在来源允许展示时）；
- 平台；
- 匹配分；
- 链接状态。

#### FR-031 差异提示

当存在以下差异时显示：

- 年份相差 > 1：`年份不一致`；
- 曲目数差 > 2：`可能是不同版本`；
- 标题有版本限定词差异：`版本名称不同`；
- 主艺人不一致：`歌手不一致`；
- 封面视觉差异较大：`封面可能对应不同地区或版本`；
- 同 UPC：`条码一致`；
- MusicBrainz 官方外链直接指向该平台：`官方关联链接`。

### 7.5 复制与 NeoDB

#### FR-040 单链接复制

- 点击后复制完整 HTTPS URL；
- 成功提示：`已复制 {平台} 链接`；
- 失败时显示可选中文本框，不吞掉错误；
- 不附加跟踪参数，除非平台要求且在隐私说明中明确。

#### FR-041 复制 NeoDB 链接

系统从用户当前选择中推荐一个链接，优先级如下：

1. `verified_exact` 且 NeoDB 支持的平台详情 URL；
2. `probable`、分数最高且 ≥ 80 的 NeoDB 支持平台详情 URL；
3. 用户人工选择的 NeoDB 支持平台详情 URL；
4. 无合格链接时禁用按钮，提示 `暂无可确认的 NeoDB 支持链接`。

同级默认优先顺序：

1. MusicBrainz Release Group/Release；
2. Spotify；
3. Apple Music；
4. 豆瓣音乐；
5. YouTube Music 精确专辑页。

该顺序必须可配置。

按钮文案：`复制给 NeoDB`。  
按钮旁显示实际来源，例如：`将复制 MusicBrainz 链接`。

#### FR-042 打开 NeoDB

- 提供 `打开 NeoDB`；
- NeoDB 实例由用户设置，默认 `https://neodb.social`；
- 如果尚未验证目标实例的可带参搜索 URL，只打开实例的公开首页或已配置搜索页，不猜测路径；
- 浏览器安全限制导致无法同时复制和打开新页时，先完成复制，再让用户点击打开；
- MVP 不自动登录、不自动粘贴、不自动创建条目。

#### FR-043 复制全部

支持三种格式：

1. 纯 URL：每行一个；
2. 带标签纯文本：`Spotify: https://...`；
3. Markdown：`[Spotify](https://...)`。

默认只包含：

- 精确详情页；
- `probable` 及以上结果；
- 用户人工选择的结果。

提供开关 `包含搜索入口`，默认关闭。

### 7.6 设置

#### FR-050 用户设置

本地设置包含：

- NeoDB 实例 URL；
- 默认地区/商店；
- 默认复制格式；
- NeoDB 链接优先级；
- 是否保存本地查询历史；
- 是否显示实验性 Provider。

#### FR-051 管理配置

服务端环境变量控制：

- Spotify 是否启用；
- Apple Music 是否启用；
- 通用网页搜索 Provider；
- 各 Provider 超时、缓存和并发；
- 实验性适配器；
- 管理员联系信息与 MusicBrainz User-Agent。

密钥不得通过前端 bundle、日志或错误响应暴露。

---

## 8. 信息架构与界面状态

### 8.1 页面结构

MVP 单页即可，建议区域顺序：

1. 顶部：产品名、说明、设置；
2. 搜索表单；
3. 最近搜索（可选）；
4. 标准专辑候选；
5. 已选标准专辑摘要；
6. 跨平台匹配列表；
7. 字段对比区；
8. 固定或显眼的复制操作区；
9. 数据来源、匹配说明和免责声明。

### 8.2 桌面端低保真结构

```text
┌──────────────────────────────────────────────────────────┐
│ AlbumLinker                                  [设置]       │
│ [歌手名________] [专辑名________] [年份____] [搜索专辑]   │
├──────────────────────────────────────────────────────────┤
│ 标准专辑候选                                             │
│ [封面] 标题 / 歌手 / 1997 / Album      [已选择] [换一个] │
├──────────────────────────────────────────────────────────┤
│ 跨平台匹配                                               │
│ MusicBrainz  100 已验证  1997  精确详情页 [证据][打开][复制]│
│ Spotify      96  高置信  1997  精确详情页 [证据][打开][复制]│
│ Apple Music  91  高置信  1997  精确详情页 [证据][打开][复制]│
│ 豆瓣          78 需复核  1997  精确详情页 [证据][换一个]  │
│ AOTY          — 仅搜索入口                    [打开][复制] │
│ Record Club   — 仅搜索入口                    [打开][复制] │
├──────────────────────────────────────────────────────────┤
│ [复制给 NeoDB] [打开 NeoDB] [复制全部 ▾]                 │
└──────────────────────────────────────────────────────────┘
```

### 8.3 必须覆盖的状态

- 初始空白；
- 输入校验失败；
- 搜索中；
- 标准候选为空；
- 标准候选需要确认；
- 标准专辑已选、Provider 加载中；
- 部分平台成功；
- 全部平台失败；
- Provider 未配置；
- Provider 限速；
- 只有搜索入口；
- 封面失败；
- 复制成功；
- 剪贴板权限失败；
- 用户手动换选候选；
- 网络离线；
- 缓存结果。

### 8.4 无障碍

- 所有操作可用键盘完成；
- 有清晰焦点样式；
- 状态变化使用 `aria-live="polite"`；
- 封面 `alt` 为 `{歌手}《{专辑}》封面，来源：{平台}`；
- 图标按钮有可访问名称；
- 颜色不是状态的唯一表达；
- 匹配分同时显示数字和文字等级；
- 尊重 `prefers-reduced-motion`；
- 移动端点击目标至少 44×44 CSS px。

---

## 9. 匹配与评分规格

### 9.1 设计原则

匹配算法必须：

- 可解释；
- 确定性；
- 相同输入和相同 Provider 数据得到相同分数；
- 不依赖大模型做最终事实判断；
- 不把缺失字段当作不匹配；
- 对豪华版、重制版和地区版保留差异提示；
- 强标识符优先于文字相似度。

### 9.2 文本规范化

保存两份文本：

- `displayValue`：原始可读文字，只清理首尾和多余空白；
- `normalizedValue`：仅用于匹配。

`normalizedValue` 处理顺序：

1. Unicode NFKC；
2. 转小写；
3. `&` 规范为 `and`，仅在拉丁文本比较中启用；
4. 移除不影响语义的常见标点；
5. 连续空白折叠；
6. 艺人连接词 `feat.`、`featuring`、`ft.` 统一；
7. 保留 CJK 字符；
8. 生成一个额外的去变音符比较值，但原值也必须参与；
9. 版本词单独提取为 `editionTokens`，不直接从标题中静默删除。

不得将完全不同书写系统自动音译后直接判为强匹配。音译只可贡献少量辅助分，除非来源提供正式别名。

### 9.3 强标识符

强匹配依据：

- 相同 UPC/EAN/Barcode；
- MusicBrainz URL relationship 直接链接到对应平台实体；
- 同一平台稳定 ID；
- 用户人工确认；
- 未来接入时可使用专辑曲目 ISRC 高比例交集，但 MVP 不要求。

强标识符冲突时：

- 不得标记 `verified_exact`；
- 状态至少降为 `needs_review`；
- 展示 `标识符冲突`；
- 需要用户手动选择。

### 9.4 分数组成

`matchScore` 范围 0–100，按以下证据计算：

| 维度 | 最高分 | 计算说明 |
|---|---:|---|
| 强标识符 | 35 | 同 UPC/EAN 或官方外链 35；无数据 0；冲突触发降级 |
| 专辑标题 | 25 | 精确规范化 25；高相似按比例；版本词差异另扣分 |
| 主艺人 | 20 | 精确/正式别名 20；艺人集合大部分一致按比例 |
| 发行日期 | 8 | 同日 8；同年 6；相差 1 年 3；更大差异 0 |
| 曲目数 | 5 | 相同 5；相差 1 为 3；相差 2 为 1 |
| 专辑类型 | 3 | Album/EP/Single 等一致 |
| 封面相似 | 4 | 可选 pHash；无封面时 0 且不扣分 |

基础公式：

```text
rawScore =
  identifierScore +
  titleScore +
  artistScore +
  dateScore +
  trackCountScore +
  typeScore +
  coverScore

matchScore = clamp(round(rawScore - penalties), 0, 100)
```

惩罚项：

| 冲突 | 扣分 |
|---|---:|
| 主艺人明显不同 | -35 |
| 专辑标题相似度 < 0.6 | -25 |
| 一个是 Album、另一个是 Single | -20 |
| 一个是 Live/Compilation/Remix，标准专辑不是 | -15 |
| 版本限定词明显冲突 | -8 |
| 年份相差 > 5 | -8 |
| 强标识符冲突 | 分数可计算，但强制 `needs_review` |

### 9.5 缺失值归一

不能因为平台没有返回曲目数或 UPC，就天然比其他平台分数低很多。除强标识符外，展示分还需计算 `evidenceCoverage`：

```text
evidenceCoverage =
  本次实际可比较维度的权重总和 / 100
```

界面同时展示：

- `匹配分 88`；
- `证据覆盖 81%`。

当 `evidenceCoverage < 0.55` 时，即使分数较高也不得显示“已验证”，最多为 `probable`。

实现可使用“可比较权重归一后再映射”的方法，但必须在单元测试中固定样例，且前端证据项与服务端计算一致。强标识符 35 分不可因缺失而被其他字段完全补偿为“已验证”。

### 9.6 状态阈值

| 条件 | 状态 | UI 文案 |
|---|---|---|
| 强标识符一致且无严重冲突 | `verified_exact` | 已验证 |
| 分数 ≥ 85，覆盖 ≥ 0.70 | `probable` | 高置信 |
| 分数 70–84，覆盖 ≥ 0.55 | `needs_review` | 建议复核 |
| 分数 < 70 或存在严重冲突 | `needs_review` | 低置信 |
| 仅搜索页 | `search_only` | 仅搜索入口 |

不允许显示 `100% 正确`。即使分数为 100，文案也只能是 `已验证`。

### 9.7 MusicBrainz 基准分

MusicBrainz 搜索接口自己的 score 只能用于排列标准候选，不可直接作为跨平台 `matchScore`。跨平台分必须重新按本章计算。

### 9.8 封面比较

MVP 可选实现 pHash：

- 仅比较缩略图；
- 不做人物、人脸、OCR 或生成式识别；
- 图片只在内存或短期缓存中处理；
- Spotify 封面不得裁切、叠字或用作模型训练；
- 封面差异不能单独判定为错误版本；
- pHash 服务异常不得影响文字与标识符匹配。

---

## 10. 统一数据模型

### 10.1 查询

```ts
interface AlbumSearchQuery {
  artist?: string;
  album?: string;
  year?: number;
  market: string;      // ISO 3166-1 alpha-2, e.g. "CN"
  storefront: string;  // Apple storefront, e.g. "cn"
}
```

### 10.2 标准专辑

```ts
interface CanonicalAlbum {
  canonicalId: string;
  source: "musicbrainz" | "spotify" | "apple_music";
  musicBrainzReleaseGroupId?: string;
  title: string;
  normalizedTitle: string;
  artists: ArtistCredit[];
  firstReleaseDate?: string;
  primaryType?: "Album" | "EP" | "Single" | "Broadcast" | "Other";
  secondaryTypes: string[];
  trackCount?: number;
  barcodes: string[];
  cover?: CoverImage;
  sourceUrl: string;
}

interface ArtistCredit {
  name: string;
  normalizedName: string;
  musicBrainzArtistId?: string;
  joinPhrase?: string;
}

interface CoverImage {
  url: string;
  width?: number;
  height?: number;
  source: string;
  fallbackUrl?: string;
}
```

### 10.3 平台候选

```ts
type ProviderKey =
  | "musicbrainz"
  | "spotify"
  | "apple_music"
  | "youtube_music"
  | "douban"
  | "aoty"
  | "record_club";

interface ProviderCandidate {
  provider: ProviderKey;
  providerItemId?: string;
  title: string;
  artists: string[];
  releaseDate?: string;
  albumType?: string;
  trackCount?: number;
  barcode?: string;
  cover?: CoverImage;
  detailUrl?: string;
  searchUrl?: string;
  urlKind: "exact_detail" | "search";
  provenance:
    | "official_api"
    | "musicbrainz_relationship"
    | "web_search"
    | "constructed_search_url"
    | "manual";
  rawSourceScore?: number;
}
```

### 10.4 匹配结果

```ts
interface MatchEvidence {
  key:
    | "identifier"
    | "title"
    | "artist"
    | "date"
    | "track_count"
    | "album_type"
    | "cover";
  label: string;
  canonicalValue?: string;
  candidateValue?: string;
  score: number;
  maxScore: number;
  outcome: "match" | "partial" | "conflict" | "missing";
  explanation: string;
}

interface ProviderMatch {
  provider: ProviderKey;
  status: ProviderStatus;
  selectedCandidate?: ProviderCandidate;
  alternatives: ProviderCandidate[];
  matchScore: number | null;
  evidenceCoverage: number | null;
  evidence: MatchEvidence[];
  warnings: string[];
  neoDbSupported: boolean;
  lastUpdatedAt: string;
  cache: "hit" | "miss" | "stale";
  errorCode?: string;
  retryable: boolean;
}
```

### 10.5 搜索会话

```ts
interface SearchSession {
  id: string;
  query: AlbumSearchQuery;
  canonicalCandidates: CanonicalAlbum[];
  selectedCanonicalId?: string;
  providerMatches: Partial<Record<ProviderKey, ProviderMatch>>;
  createdAt: string;
  expiresAt: string;
}
```

搜索会话不需要包含用户身份。服务端默认 TTL 30 分钟。

---

## 11. Provider 适配器契约

### 11.1 统一接口

```ts
interface AlbumProvider {
  key: ProviderKey;
  capability: "official_api" | "web_search" | "search_url";
  search(
    canonical: CanonicalAlbum,
    context: ProviderContext
  ): Promise<ProviderCandidate[]>;
  healthcheck(): Promise<ProviderHealth>;
}
```

每个适配器必须：

- 独立超时；
- 接受取消信号；
- 统一错误映射；
- 验证返回 URL 的协议、域名与允许路径；
- 不把上游原始 HTML 或完整响应直接传给前端；
- 不在日志中写访问令牌；
- 有 fixture 和契约测试；
- 对 429/503 使用带抖动的指数退避；
- 遵守第三方缓存、展示与署名要求。

### 11.2 MusicBrainz

建议查询：

```text
GET https://musicbrainz.org/ws/2/release-group/
  ?query=releasegroup:"{album}" AND artist:"{artist}"
  &fmt=json
  &limit=8
```

要求：

- Lucene 特殊字符必须转义；
- 设置可联系维护者的 `User-Agent: ProductName/version (contact)`；
- 同一出口 IP 平均不超过 MusicBrainz 当前文档规定的请求频率；
- 服务端全局排队，不能由每个浏览器直接打 MusicBrainz；
- 缓存搜索结果；
- 对 503 视为可重试限流/繁忙；
- Release Group 链接格式从 MBID 安全生成；
- 查询具体 Release 时优先正式发行，保留地区和版本信息。

### 11.3 Cover Art Archive

- 优先 Release Group 的 front 500 缩略图；
- 404 表示无封面，不是整张专辑不存在；
- 前端加载失败后可尝试 250px；
- 不代理和永久存储原图，除非后续完成版权与缓存策略评审；
- 保存封面来源与 MusicBrainz 详情链接。

### 11.4 Spotify

- 使用服务端 Client Credentials；
- 令牌仅在服务端缓存；
- 使用 `type=album`；
- 查询词优先：`album:{title} artist:{artist}`；
- 传 `market`；
- 结果 URL 使用 API 返回的 `external_urls.spotify`；
- 封面必须保持原样并带回 Spotify 链接和归属；
- 处理 401 刷新令牌，429 读取 `Retry-After`；
- 不下载音频，不训练模型。

### 11.5 Apple Music

- 使用服务端生成的 ES256 Developer Token；
- 私钥不得进入前端；
- 使用目录搜索而不是用户音乐库搜索；
- storefront 来自用户设置；
- 保存 API 返回的专辑 URL；
- 处理 401、429 和 storefront 无结果；
- 若没有 Apple 凭证，状态为 `not_configured`，不得静默伪装成精确结果。

### 11.6 通用网页搜索适配器

用于 AOTY、Record Club、豆瓣和可选 YouTube Music。

要求：

- 使用有明确 API 条款的搜索服务；
- 查询模板由配置维护；
- 只读取搜索 API 明确返回的标题、URL、摘要；
- 验证 HTTPS、主域名和详情路径；
- 最多保留 5 个结果；
- 不自动打开或抓取目标页面以绕过限制；
- 不把摘要中的评分当作可靠结构化评分；
- 找不到详情页时退回 P3 搜索入口；
- 搜索 API 未配置时返回 `not_configured` 或 P3，不可报整页错误。

建议查询模板：

```text
site:music.douban.com/subject "{artist}" "{album}"
site:albumoftheyear.org/album "{artist}" "{album}"
site:record.club "{artist}" "{album}"
site:music.youtube.com "{artist}" "{album}"
```

域名允许列表至少为：

```ts
{
  douban: ["music.douban.com"],
  aoty: ["albumoftheyear.org", "www.albumoftheyear.org"],
  record_club: ["record.club"],
  youtube_music: ["music.youtube.com"]
}
```

### 11.7 搜索入口生成

搜索入口必须使用 `URL` 与 `URLSearchParams` 生成，不得字符串拼接未编码用户输入。

若平台公开搜索 URL 尚未经过人工验证：

- 不生成推测路径；
- 可以生成通用搜索服务的 `site:` 搜索 URL；
- 标记 `constructed_search_url` 和 `search_only`；
- 在配置和测试中固定模板后才能上线。

---

## 12. HTTP API 契约

所有响应使用 JSON；时间为 ISO 8601 UTC；错误包含稳定 `code`，不得只返回人类文案。

### 12.1 搜索标准候选

```http
POST /api/search/canonical
Content-Type: application/json
```

请求：

```json
{
  "artist": "Radiohead",
  "album": "OK Computer",
  "year": 1997,
  "market": "CN",
  "storefront": "cn"
}
```

成功：

```json
{
  "sessionId": "ses_01J...",
  "query": {
    "artist": "Radiohead",
    "album": "OK Computer",
    "year": 1997,
    "market": "CN",
    "storefront": "cn"
  },
  "candidates": [],
  "autoSelectedCanonicalId": "can_01J...",
  "requestId": "req_01J..."
}
```

校验失败：

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "歌手名和专辑名至少填写一个",
    "fields": {
      "artist": "required_without_album",
      "album": "required_without_artist"
    },
    "requestId": "req_01J..."
  }
}
```

### 12.2 选择标准专辑并开始聚合

```http
POST /api/search/{sessionId}/select-canonical
```

```json
{
  "canonicalId": "can_01J..."
}
```

响应为 `202 Accepted`：

```json
{
  "sessionId": "ses_01J...",
  "selectedCanonicalId": "can_01J...",
  "aggregationStatus": "running",
  "pollUrl": "/api/search/ses_01J...",
  "requestId": "req_01J..."
}
```

### 12.3 获取聚合进度

```http
GET /api/search/{sessionId}
```

```json
{
  "sessionId": "ses_01J...",
  "status": "partial",
  "canonical": {},
  "providers": {
    "musicbrainz": {},
    "spotify": {},
    "apple_music": {}
  },
  "pendingProviders": ["douban", "aoty", "record_club"],
  "completedProviders": ["musicbrainz", "spotify", "apple_music"],
  "expiresAt": "2026-07-25T10:30:00Z",
  "requestId": "req_01J..."
}
```

允许实现为 SSE：

```http
GET /api/search/{sessionId}/events
Accept: text/event-stream
```

但必须保留普通 GET 轮询作为降级路径。

### 12.4 重试单个平台

```http
POST /api/search/{sessionId}/providers/{provider}/retry
```

- 只重试指定 Provider；
- 每会话、每 Provider 最多 3 次；
- 限流时返回 `429` 和 `retryAfterSeconds`。

### 12.5 手动选择平台候选

```http
POST /api/search/{sessionId}/providers/{provider}/select
```

```json
{
  "providerItemId": "string"
}
```

响应必须返回重算后的 `ProviderMatch` 和 NeoDB 推荐链接。

### 12.6 统一错误码

| HTTP | code | 含义 |
|---:|---|---|
| 400 | `INVALID_QUERY` | 输入不合法 |
| 404 | `SESSION_NOT_FOUND` | 会话不存在或过期 |
| 404 | `CANONICAL_NOT_FOUND` | 标准候选不存在 |
| 409 | `CANONICAL_NOT_SELECTED` | 尚未选择标准专辑 |
| 422 | `INVALID_PROVIDER_URL` | Provider 返回域名或路径不合法 |
| 429 | `RATE_LIMITED` | 本服务或上游限流 |
| 502 | `PROVIDER_BAD_RESPONSE` | 上游响应无法解析 |
| 503 | `PROVIDER_UNAVAILABLE` | 上游暂时不可用 |
| 504 | `PROVIDER_TIMEOUT` | 上游超时 |

Provider 的局部错误优先放进 `ProviderMatch`，不应把整个聚合 GET 变成 5xx。

---

## 13. 非功能需求

### 13.1 性能

- 标准候选无缓存 P95 ≤ 3 秒；
- 有缓存 P95 ≤ 500 ms；
- Provider 独立超时默认 6 秒；
- 聚合 10 秒后返回已完成结果，并把剩余项标为超时；
- 前端首个有意义内容 ≤ 2.5 秒（正常网络、缓存命中）；
- 封面使用响应式尺寸和懒加载。

### 13.2 缓存

建议 TTL：

| 数据 | TTL |
|---|---:|
| MusicBrainz 搜索 | 24 小时 |
| MusicBrainz 实体 | 7 天 |
| Cover Art URL 元数据 | 7 天 |
| Spotify/Apple 搜索 | 6 小时 |
| 通用网页搜索结果 | 1 小时 |
| Provider 健康状态 | 1 分钟 |
| 搜索会话 | 30 分钟 |

缓存键必须包含规范化查询、market/storefront、Provider 和适配器版本。  
不得缓存 OAuth access token 到客户端。

### 13.3 可用性

- Provider 熔断：连续失败达到阈值后短暂跳过，并返回 `temporarily_unavailable`；
- 重试只针对幂等 GET/搜索；
- 退避带随机抖动；
- 服务关闭时不丢持久化配置；
- 任何时候至少可以生成平台搜索入口，前提是模板已经验证。

### 13.4 安全

- 所有用户输入通过 schema 校验；
- 防 SSRF：只允许固定 Provider base URL 和域名；
- 不接受前端传入任意抓取 URL；
- 外链使用 `rel="noopener noreferrer"`；
- 配置合理 CSP；
- 服务端日志脱敏；
- 密钥只读环境变量或密钥管理服务；
- 依赖锁文件提交；
- Provider URL 必须为 HTTPS；
- 对公共部署加 IP 与会话级限流；
- 剪贴板只在用户手势下调用；
- 不自动执行第三方页面脚本。

### 13.5 隐私

- 不要求账号；
- 默认不把原始查询写入长期服务端日志；
- 分析事件只记录字段是否存在、耗时、Provider 状态和匿名会话 ID；
- 本地历史可关闭和清空；
- 不将查询发送给未启用的平台；
- 设置页列出查询会被发送到哪些第三方。

### 13.6 法务与平台政策

- 页面底部声明：专辑封面及商标归各权利方所有；
- Spotify 内容保留归属与回链，不裁切、不叠加品牌、不用于模型训练；
- Apple 内容按 Apple Music API 与品牌要求展示；
- 不承诺封面可下载、再分发或商用；
- AOTY、Record Club、豆瓣默认不抓取页面正文；
- 若第三方条款或技术限制变化，Provider 应可单独关闭；
- 上线前由项目负责人完成第三方条款复核。

### 13.7 可观测性

每个请求生成 `requestId`，记录：

- Provider；
- 适配器版本；
- 耗时；
- cache hit/miss/stale；
- HTTP 状态；
- 统一错误码；
- 候选数；
- 最终状态；
- 不记录令牌、完整原始响应和用户敏感输入。

建议指标：

- `provider_request_duration_ms`;
- `provider_success_rate`;
- `provider_rate_limit_count`;
- `match_score_distribution`;
- `manual_candidate_override_rate`;
- `copy_action_success_rate`.

---

## 14. 参考技术架构

本章是推荐实现，不改变前述行为契约。

### 14.1 推荐栈

- Web：Next.js App Router + TypeScript；
- UI：React + 可访问的无头组件；
- Schema：Zod；
- 服务端缓存：开发环境内存/SQLite，部署环境 Redis 或兼容 KV；
- 测试：Vitest + Testing Library + Playwright；
- HTTP：原生 `fetch`，统一超时、重试与错误封装；
- 图片相似：可选独立服务或 Node pHash 库，默认关闭；
- 格式化与质量：ESLint + Prettier + TypeScript strict。

不建议浏览器直接调用 MusicBrainz、Spotify 或 Apple Music：

- 会泄漏凭证；
- 无法统一限速；
- CORS 和配额难以控制；
- 无法稳定缓存。

### 14.2 模块边界

```text
src/
  app/
    page.tsx
    api/
  components/
    search/
    canonical/
    providers/
    comparison/
    copy-actions/
    settings/
  domain/
    album/
    matching/
    neodb/
  providers/
    musicbrainz/
    cover-art-archive/
    spotify/
    apple-music/
    web-search/
    youtube-music/
    douban/
    aoty/
    record-club/
  server/
    cache/
    rate-limit/
    observability/
    sessions/
  schemas/
  tests/
    fixtures/
    contract/
    integration/
    e2e/
```

Provider 原始字段转换、匹配算法和 UI 必须分离。UI 不得直接理解 Spotify 或 Apple 的原始响应。

### 14.3 环境变量

```dotenv
APP_NAME=AlbumLinker
APP_BASE_URL=http://localhost:3000
CONTACT_URL=https://example.com/contact

MUSICBRAINZ_USER_AGENT=AlbumLinker/0.1.0 (https://example.com/contact)
MUSICBRAINZ_REQUESTS_PER_SECOND=1

SPOTIFY_ENABLED=false
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_DEFAULT_MARKET=CN

APPLE_MUSIC_ENABLED=false
APPLE_MUSIC_TEAM_ID=
APPLE_MUSIC_KEY_ID=
APPLE_MUSIC_PRIVATE_KEY=
APPLE_MUSIC_DEFAULT_STOREFRONT=cn

WEB_SEARCH_ENABLED=false
WEB_SEARCH_PROVIDER=
WEB_SEARCH_API_KEY=

NEODB_DEFAULT_BASE_URL=https://neodb.social
PROVIDER_TIMEOUT_MS=6000
AGGREGATION_TIMEOUT_MS=10000
SESSION_TTL_SECONDS=1800
```

`.env.example` 只能包含空值和说明，不得提交真实凭证。

---

## 15. 测试策略

### 15.1 固定人工标注集

至少包含 30 个查询：

- 10 个英文主流专辑；
- 5 个中文专辑；
- 3 个日文/韩文专辑；
- 3 个同名专辑；
- 3 个豪华版/重制版；
- 2 个现场专辑；
- 2 个多艺人合作；
- 2 个冷门或 MusicBrainz 缺失案例。

每条标注：

- 正确标准 Release Group；
- 至少 2 个平台正确详情 URL（若存在）；
- 正确首发年份；
- 应触发的版本警告；
- 可接受的匹配状态。

不得把测试时实时抓到的结果直接当作真值。

### 15.2 单元测试

必须覆盖：

- Unicode 与标点规范化；
- 艺人 join phrase；
- 版本词抽取；
- Lucene 查询转义；
- URL allowlist；
- 分数组成；
- 缺失字段覆盖率；
- UPC 一致；
- UPC 冲突；
- 年份差；
- 曲目数差；
- 状态阈值；
- NeoDB 推荐链接优先级；
- 搜索入口 `matchScore = null`；
- 复制格式。

### 15.3 Provider 契约测试

每个平台使用脱敏 fixture：

- 正常结果；
- 空结果；
- 401；
- 429；
- 500/503；
- 超时；
- 字段缺失；
- 非预期 schema；
- 恶意或错误域名 URL。

实时 Provider 测试必须单独标记，不进入默认 CI，避免配额和不稳定网络导致普通构建失败。

### 15.4 集成测试

- 标准候选返回后其他 Provider 渐进更新；
- 单个平台超时不影响其他结果；
- 缓存命中；
- 会话过期；
- 切换标准专辑后重新聚合；
- 手动选择候选后重算；
- 未配置凭证时正确降级；
- 熔断与恢复。

### 15.5 端到端测试

至少覆盖：

1. 歌手 + 专辑搜索并复制 NeoDB 链接；
2. 只输入歌手并选择专辑；
3. 同名专辑需要确认；
4. 平台部分失败；
5. 搜索入口不显示分数；
6. 更换平台候选；
7. 复制全部 Markdown；
8. 修改 NeoDB 实例；
9. 键盘完整操作；
10. 移动端布局。

---

## 16. 交付阶段

### M0：规格与样例

- 确认本 PRD；
- 建立 30 条人工标注测试集；
- 验证各平台真实 URL 规则；
- 明确部署方式和凭证。

完成定义：所有开放问题已记录，不存在会改变数据模型的未知项。

### M1：MusicBrainz 核心闭环

- 查询表单；
- MusicBrainz Artist/Release Group 搜索；
- Cover Art Archive；
- 标准候选确认；
- 对比基础 UI；
- 单链接复制；
- 复制 MusicBrainz 给 NeoDB。

完成定义：无 Spotify/Apple 凭证时产品仍可完整使用核心流程。

### M2：官方 API 聚合

- Spotify；
- Apple Music；
- 统一 Provider 状态；
- 匹配分与证据；
- 候选改选；
- 复制全部；
- 缓存与限速。

完成定义：官方 API Provider 的契约测试和 E2E 通过。

### M3：网页搜索与交叉核验

- 豆瓣；
- AOTY；
- Record Club；
- YouTube Music；
- P2/P3 降级；
- URL allowlist；
- 搜索入口标识。

完成定义：任何非精确链接都不显示伪匹配分，域名校验测试通过。

### M4：可靠性与上线

- 监控；
- 公共限流；
- 隐私与免责声明；
- 无障碍；
- 性能优化；
- 人工准确率抽查；
- 部署文档。

完成定义：第 18 章验收标准全部通过。

---

## 17. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 第三方 API 改版或收紧 | Provider 失效 | 适配器隔离、功能开关、契约测试 |
| AOTY/Record Club/豆瓣无公开 API | 无法稳定拿到精确页 | 合规网页搜索 + 搜索入口，明确状态 |
| YouTube 与 YouTube Music 实体混淆 | 复制错误链接 | 默认 P3；只有验证为专辑页才升级 |
| 同名专辑/艺人 | 错选 | 候选确认、歌手高权重、同名不自动跳过 |
| 豪华版与原版混淆 | 年份/曲目不一致 | 版本词、曲目数和年份警告 |
| MusicBrainz 限速 | 响应慢 | 服务端队列、缓存、1 req/s 配置 |
| 封面版权与跨域 | 图片失败或合规风险 | CAA 优先、署名回链、不提供下载 |
| 凭证泄漏 | 安全事件 | 全部密钥服务端保存、日志脱敏 |
| 匹配分造成过度信任 | 用户导入错误 | 展开证据、阈值、复核状态、不说 100% 正确 |
| NeoDB 实例路径不同 | “打开 NeoDB”失效 | 只配置 base URL；不猜测搜索路径 |

---

## 18. MVP 验收标准

### AC-001 输入

```gherkin
Given 歌手名和专辑名均为空
When 用户点击“搜索专辑”
Then 页面不发送请求
And 显示“歌手名和专辑名至少填写一个”
```

### AC-002 精确查询

```gherkin
Given 用户输入歌手名和专辑名
When MusicBrainz 返回候选
Then 页面显示最多 8 个标准专辑候选
And 每个候选包含歌手、标题、年份、类型和来源链接
And 符合自动选择规则时只做预选、不锁定
```

### AC-003 只输入歌手

```gherkin
Given 用户只输入歌手名
When 搜索成功
Then 页面先要求用户选择歌手
And 再展示该歌手的专辑列表
And 用户选择专辑后才开始跨平台聚合
```

### AC-004 同名专辑

```gherkin
Given 同一专辑名存在多个不同歌手候选
When 用户只输入专辑名
Then 系统不得跳过候选确认
And 歌手名必须是候选卡的主要信息
```

### AC-005 渐进结果

```gherkin
Given 已选择标准专辑
When Spotify 成功而豆瓣超时
Then Spotify 结果正常显示
And 豆瓣显示“暂时不可用”及重试
And 页面整体保持可复制状态
```

### AC-006 匹配分

```gherkin
Given 平台返回精确详情候选
When 系统计算匹配
Then 返回 0 到 100 的确定性分数
And 返回每个维度的得分、比较值和说明
And UI 显示证据覆盖率
```

### AC-007 搜索入口

```gherkin
Given 某平台只有搜索 URL
When 页面展示该平台
Then 状态为“仅搜索入口”
And matchScore 为 null
And 不将其选为默认 NeoDB 复制链接
```

### AC-008 NeoDB 推荐复制

```gherkin
Given 页面存在多个 NeoDB 支持平台的精确详情 URL
When 用户点击“复制给 NeoDB”
Then 系统按已配置的状态、分数与平台优先级选出一个 URL
And 剪贴板只包含该完整 HTTPS URL
And 页面提示实际复制的平台
```

### AC-009 AOTY 与 Record Club

```gherkin
Given AOTY 或 Record Club 返回链接
When 页面展示结果
Then 页面标记其为交叉核验来源
And 不宣称该链接受 NeoDB 支持
And 不把站点搜索页标记为精确专辑页
```

### AC-010 手动改选

```gherkin
Given 某平台有多个候选
When 用户选择非默认候选
Then 页面标记“人工选择”
And 立即更新证据与 NeoDB 推荐
And 当前搜索会话内刷新页面仍可恢复该选择
```

### AC-011 URL 安全

```gherkin
Given Provider 返回非 HTTPS、错误域名或不允许的详情路径
When 后端解析结果
Then 拒绝该 URL
And 记录 INVALID_PROVIDER_URL
And 前端不渲染可点击链接
```

### AC-012 未配置凭证

```gherkin
Given Spotify 或 Apple Music 未配置
When 用户开始聚合
Then 对应平台显示“未配置”
And MusicBrainz 核心流程仍然成功
And 服务端不返回空白 500
```

### AC-013 限流

```gherkin
Given MusicBrainz 或其他 Provider 返回限流
When 聚合继续
Then 系统遵守 Retry-After 或退避策略
And 不进行无上限重试
And 其他 Provider 不受影响
```

### AC-014 隐私与密钥

```gherkin
Given 应用已构建并运行
When 检查前端 bundle、浏览器网络响应和普通日志
Then 不存在 Spotify Client Secret、Apple 私钥或搜索 API Key
And 不存在完整 OAuth access token
```

### AC-015 无障碍

```gherkin
Given 用户不使用鼠标
When 通过键盘完成搜索、选择候选和复制
Then 所有步骤均可完成
And 焦点顺序与视觉顺序一致
And 状态变化可被辅助技术感知
```

### AC-016 测试与文档

```gherkin
Given 代码准备交付
When 执行 lint、typecheck、unit、integration 和 e2e
Then 所有必需测试通过
And README 包含配置、启动、测试、Provider 限制和已知风险
```

---

## 19. 明确不允许的实现

- 把 Google/Bing 搜索结果页 URL 当作某个平台专辑详情页；
- 只凭封面相同就标记为已验证；
- 直接使用 MusicBrainz 搜索 score 作为跨平台匹配分；
- 在前端保存 Spotify Client Secret 或 Apple 私钥；
- 运行时拼出未经验证的 AOTY、Record Club、豆瓣详情页 slug；
- 绕过 403、验证码、登录墙或 robots/条款限制；
- 失败时用虚构的示例 URL 填满 UI；
- 对搜索入口显示 `95% 匹配`；
- 将 AOTY、Record Club 标为 NeoDB 官方支持来源；
- 因一个 Provider 超时而返回整页 500；
- 不经用户动作自动打开多个标签页；
- 把用户查询或第三方内容发送给大模型做事实裁决；
- 依赖大模型输出作为唯一匹配依据。

---

## 20. 编码 AI 母提示词

下面内容可直接复制给编码 AI。使用时请同时附上本 PRD 文件：

```text
你正在实现 AlbumLinker MVP。请把 ALBUM_MATCHER_PRD.md 作为唯一产品行为真相源，严格遵循 spec-first 开发。

开始前：
1. 完整阅读 PRD。
2. 输出不超过 15 行的实现计划、目录结构、环境变量缺口和降级平台。
3. 建立需求追踪表，把 FR、AC 映射到代码模块和测试。
4. 不得虚构平台 ID、MBID、条码、精确详情 URL 或匹配分。
5. 不得抓取或绕过第三方的登录、403、验证码或反爬限制。

实现顺序：
M1 MusicBrainz + Cover Art Archive 核心闭环；
M2 Spotify + Apple Music 官方 API 和可解释匹配；
M3 豆瓣/AOTY/Record Club/YouTube Music 的合规网页搜索与搜索入口降级；
M4 性能、安全、无障碍、监控与上线准备。

工程要求：
- TypeScript strict；
- Provider 适配器与领域匹配算法解耦；
- 所有外部响应经过 schema 校验；
- 所有 URL 经过 HTTPS、域名和路径 allowlist；
- 所有密钥只在服务端；
- 使用 fixture 做确定性测试；
- 实时第三方测试不得进入默认 CI；
- 单个平台失败不得影响其他平台；
- 搜索入口的 matchScore 必须为 null；
- 每完成一个里程碑运行 lint、typecheck、unit、integration 和相应 e2e。

交付时输出：
1. 已实现 FR/AC 清单；
2. 未实现项与原因；
3. 启动、配置、测试命令；
4. 第三方平台限制；
5. 安全与隐私检查结果；
6. 已知问题和下一阶段建议。
```

---

## 21. 需求追踪模板

实现仓库应维护下表，避免“做了页面但没有完成行为”：

| Requirement | Module | Test | Status |
|---|---|---|---|
| FR-001 | `components/search` | `search-form.test` | Todo |
| FR-010 | `providers/musicbrainz` | `musicbrainz.contract.test` | Todo |
| FR-020 | `components/providers` | `provider-row.test` | Todo |
| FR-041 | `domain/neodb` | `recommend-link.test` | Todo |
| AC-005 | aggregation service | `partial-failure.e2e` | Todo |
| AC-007 | provider mapper | `search-only.test` | Todo |
| AC-014 | build/security | `secret-exposure.test` | Todo |

---

## 22. 参考资料与调研日期

以下资料在 2026-07-25 核对；第三方能力可能变化，实现前应再次验证：

- [MusicBrainz Web Service](https://musicbrainz.org/doc/MusicBrainz_API)
- [MusicBrainz Search API](https://musicbrainz.org/doc/MusicBrainz_API/Search)
- [MusicBrainz Rate Limiting](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)
- [Cover Art Archive API](https://musicbrainz.org/doc/Cover_Art_Archive/API)
- [Spotify Search for Item](https://developer.spotify.com/documentation/web-api/reference/search)
- [Spotify Get Album 与内容政策提示](https://developer.spotify.com/documentation/web-api/reference/get-an-album)
- [Spotify Authorization](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [Apple Music API Search](https://developer.apple.com/documentation/applemusicapi/search)
- [Apple Music Developer Token](https://developer.apple.com/documentation/AppleMusicAPI/generating-developer-tokens)
- [YouTube Data API Search](https://developers.google.com/youtube/v3/docs/search)
- [NeoDB API](https://neodb.net/api/)
- [NeoDB Supported Sites](https://neodb.net/sites/)
- [NeoDB Catalog Internals](https://neodb.net/internals/catalog/)
- [Album of the Year](https://www.albumoftheyear.org/)
- [Record Club](https://record.club/)

---

## 23. 产品决策日志

| ID | 决策 | 原因 | 状态 |
|---|---|---|---|
| D-001 | MVP 无账号，个人工具优先 | 先验证减少操作的核心价值 | Accepted |
| D-002 | MusicBrainz Release Group 为默认标准锚点 | 开放、结构化、适合合并不同发行版本 | Accepted |
| D-003 | 匹配分必须可解释 | 避免黑箱百分比导致误导 | Accepted |
| D-004 | 搜索入口不显示匹配分 | 搜索 URL 不是专辑实体 | Accepted |
| D-005 | AOTY/Record Club 仅作交叉核验 | NeoDB 支持列表未列出，且无已确认公开 API | Accepted |
| D-006 | 非官方逆向适配器默认关闭 | 降低合规与稳定性风险 | Accepted |
| D-007 | MVP 不自动写入 NeoDB | 需要额外 OAuth、权限和更高误操作风险 | Accepted |
| D-008 | 先复制再打开 NeoDB | 浏览器无法可靠自动粘贴到另一站点 | Accepted |

