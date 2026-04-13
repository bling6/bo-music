# BO-Music

AI 音乐生成网站，基于 MiniMax 音乐生成大模型，输入描述或歌词即可生成完整歌曲并自动配封面。

**在线地址：** https://bo-music-tbrn.vercel.app/

## 功能

- **简单模式** — 输入描述，AI 自动生成歌词并谱曲
- **专业模式** — 三步流程：生成歌词 → 编辑歌词 → 生成音乐，适合创作者精细控制
- **自动封面** — 生成完成后自动创建歌曲封面图
- **在线播放** — 内置播放器，支持进度拖拽和歌词同步展示
- **中英双语** — 支持中文/英文界面切换

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000，在设置页面填入你的 [MiniMax API Key](https://platform.minimaxi.com/) 即可开始使用。

## 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · shadcn/ui

## License

MIT
