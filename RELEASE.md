# Release 发布指南

本文档说明如何使用 GitHub Actions 自动构建和发布 Gomoku Game。

## 自动构建触发条件

GitHub Actions 会在以下情况自动触发构建:

- 推送符合语义化版本的 tag，格式为 `v主版本号.次版本号.修订号`
- 示例: `v1.0.0`, `v1.2.3`, `v2.0.0`
- 不会触发的格式: `1.0.0`, `test-v1.0.0`, `v1.0.0-beta`

## 发布新版本步骤

### 1. 更新版本号

确保以下文件中的版本号一致:

```bash
# src-tauri/Cargo.toml
version = "1.0.0"

# src-tauri/tauri.conf.json
"version": "1.0.0"

# package.json
"version": "1.0.0"
```

### 2. 创建并推送 tag

```bash
# 确保所有更改已提交
git add .
git commit -m "chore: prepare release v1.0.0"

# 创建 tag (使用语义化版本)
git tag v1.0.0

# 推送代码和 tag
git push origin main
git push origin v1.0.0
```

### 3. 自动构建流程

推送 tag 后，GitHub Actions 会自动:

1. ✅ 并行构建三个平台的应用:
   - macOS (Universal binary: Intel + Apple Silicon)
   - Windows (x64)
   - Linux (x64)

2. ✅ 创建 GitHub Release:
   - Release 标题: `Gomoku Game v1.0.0`
   - 自动生成发布说明
   - 自动设置为正式版本 (非草稿、非预发布)

3. ✅ 上传构建产物:
   - macOS: `.dmg` 安装包
   - Windows: `.msi` 安装程序和 `.exe` 便携版
   - Linux: `.AppImage` 便携版和 `.deb` 软件包

### 4. 查看构建进度

访问项目的 GitHub Actions 页面查看构建状态:
```
https://github.com/YOUR_USERNAME/gomoku-game/actions
```

构建大约需要 10-20 分钟完成所有平台。

## 构建产物说明

### macOS
- **gomoku-game_版本号_universal.dmg**: 通用二进制安装包
  - 支持 Intel 和 Apple Silicon Mac
  - 需要 macOS 11.0+
  - 未签名版本在首次运行时需要右键 -> 打开

### Windows
- **gomoku-game_版本号_x64_en-US.msi**: Windows 安装程序
  - 标准安装体验
  - 添加到开始菜单
- **gomoku-game_版本号_x64.exe**: 便携版
  - 无需安装，直接运行

### Linux
- **gomoku-game_版本号_amd64.AppImage**: 便携版
  - 需要添加执行权限: `chmod +x gomoku-game_*.AppImage`
  - 双击运行
- **gomoku-game_版本号_amd64.deb**: Debian/Ubuntu 软件包
  - 使用 `sudo dpkg -i` 安装

## 版本号规范

遵循语义化版本 (Semantic Versioning):

- **主版本号 (Major)**: 不兼容的 API 变更
- **次版本号 (Minor)**: 向下兼容的功能新增
- **修订号 (Patch)**: 向下兼容的问题修正

示例:
```
v1.0.0  初始发布版本
v1.0.1  修复 bug
v1.1.0  添加新功能
v2.0.0  重大重构或不兼容更新
```

## 故障排查

### 构建失败
1. 检查 GitHub Actions 日志找到具体错误
2. 常见问题:
   - 依赖安装失败 → 检查 `package.json` 和 `Cargo.toml`
   - 编译错误 → 确保本地 `pnpm tauri:build` 能成功
   - 版本号不一致 → 检查三个文件中的版本号

### Tag 已推送但未触发构建
1. 确认 tag 格式正确: `v1.0.0` (不是 `1.0.0` 或 `v1.0.0-beta`)
2. 检查仓库是否有 `.github/workflows/release.yml` 文件
3. 确认 GitHub Actions 在仓库设置中已启用

### 删除错误的 tag
```bash
# 删除本地 tag
git tag -d v1.0.0

# 删除远程 tag
git push origin --delete v1.0.0

# 重新创建正确的 tag
git tag v1.0.0
git push origin v1.0.0
```

## 未来改进建议

当需要代码签名时，可以添加:

### macOS 代码签名
1. 申请 Apple Developer 证书
2. 在 GitHub 仓库添加 Secrets:
   - `APPLE_CERTIFICATE`: 开发者证书 (base64 编码)
   - `APPLE_CERTIFICATE_PASSWORD`: 证书密码
   - `APPLE_ID`: Apple ID 邮箱
   - `APPLE_PASSWORD`: App-specific password
   - `APPLE_TEAM_ID`: Team ID

### Windows 代码签名
1. 获取 Windows Code Signing Certificate
2. 添加 Secrets:
   - `WINDOWS_CERTIFICATE`: 证书文件
   - `WINDOWS_CERTIFICATE_PASSWORD`: 证书密码

## 相关链接

- [Tauri Actions 文档](https://github.com/tauri-apps/tauri-action)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
