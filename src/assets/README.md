# Assets（二进制资源说明）

本目录包含以下二进制图片资源。它们以二进制形式存在，
无法通过 GitHub 内容 API 直接提交（仅支持文本文件），
因此在此列出文件名与用途；克隆仓库后请手动上传到本目录，
或从原始备份（aba-mobile-full-project.zip）中恢复。

| 文件 | 大小 | 用途 |
|---|---|---|
| aba-balance-dots.png | ~11 KB | 主页余额卡点阵背景/图标 |
| aba-loan-banner.jpg | ~380 KB | 主页贷款横幅图 |
| aba-personal-qr.png | ~220 KB | 个人收款二维码（真实二维码） |
| miniapps-1.png | ~149 KB | 首页小程序图标组 1 |
| miniapps-2.png | ~149 KB | 首页小程序图标组 2 |

上传命令示例（在本目录下执行）：

```bash
git add aba-balance-dots.png aba-loan-banner.jpg aba-personal-qr.png miniapps-1.png miniapps-2.png
git commit -m "Add binary assets"
git push origin main
```