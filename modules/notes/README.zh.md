# Notes 形狀的模組模板

Language: [English](README.md) · 中文

`ysk-kit add module` 的複製來源在 `tooling/ysk-cli/templates/module/`。本目錄說明該形狀。

本倉的 API 不掛載 notes 路由，示範業務資料才不會混入平台。在產品裏產生模組：

```bash
pnpm ysk-kit add module note --prisma --web
```

見 [docs/recipes/add-module.zh.md](../../docs/recipes/add-module.zh.md)。
