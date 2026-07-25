# CoverTune

输入 1–10 个英文字母，用真实音乐发行的专辑封面在视觉上拼出名字。

当前可运行版本位于 [`demo/`](./demo)。它包含：

- A–Z 共 111 张原型视觉预筛候选，每个字母至少 3 张。
- 按名字实时更新结果，并通过 seed 切换不同组合。
- 1、2–3、4–6、7–10 个字母的四种移动端排版。
- PNG 海报导出和真实音乐资料来源链接。
- MusicBrainz、Cover Art Archive 与 Internet Archive 数据适配。

## 本地运行

```bash
cd demo
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

验证：

```bash
cd demo
npm run check:runtime
npm run build
npm run test:sites
```

## 项目结构

- [`SPEC.md`](./SPEC.md)：Spec-first 产品与技术规格。
- [`demo/`](./demo)：当前 CoverTune 移动端 Demo。
- [`album-linker-prototype/`](./album-linker-prototype)：早期专辑资料匹配原型。

## 数据与版权

音乐元数据来自开放目录，但专辑封面不因此自动成为开源或可自由商用素材。
仓库中的低分辨率封面仅用于本地、非商业原型展示；正式发布前仍需逐张完成
质量、内容和图片权利审核。

