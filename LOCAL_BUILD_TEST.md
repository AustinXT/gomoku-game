# 本地构建测试指南

本文档说明如何在本地模拟 GitHub Actions 的构建流程，用于在推送到 CI 之前验证配置。

## 测试目的

在推送 tag 触发 GitHub Actions 之前，在本地验证：
1. ✅ 所有依赖能正确安装
2. ✅ 前端代码能成功编译
3. ✅ Tauri 应用能成功构建
4. ✅ Universal binary 包含正确的架构

## 环境要求

### macOS
- **Node.js**: v20+ (推荐使用与 CI 相同的版本)
- **pnpm**: v8+
- **Rust**: stable (1.70+)
- **Xcode Command Line Tools**: 已安装
- **Rust targets**: 需要安装 x86_64 和 aarch64 两个 target

### 检查环境版本

```bash
node --version    # 应该是 v20.x 或更高
pnpm --version    # 应该是 8.x 或更高
rustc --version   # 应该是 1.70+ stable
```

## 本地测试步骤

### 步骤 1: 安装 Rust Targets (仅首次)

Universal binary 需要同时安装 Intel 和 Apple Silicon 的编译目标：

```bash
# 检查已安装的 targets
rustup target list --installed

# 安装 macOS Intel target (如果缺失)
rustup target add x86_64-apple-darwin

# 安装 macOS Apple Silicon target (如果缺失)
rustup target add aarch64-apple-darwin
```

**重要**: 如果缺少任一 target，universal build 会失败并提示：
```
failed to build x86_64-apple-darwin binary: Target x86_64-apple-darwin is not installed
```

### 步骤 2: 清理并安装依赖

模拟 CI 的干净环境：

```bash
# 清理旧的 node_modules
rm -rf node_modules

# 安装前端依赖
pnpm install
```

### 步骤 3: 构建前端

```bash
# 编译前端代码
pnpm build
```

**预期输出**:
```
vite v7.x.x building for production...
✓ xxxx modules transformed.
✓ built in x.xxs
```

### 步骤 4: 构建 Tauri 应用 (Universal Binary)

这是模拟 GitHub Actions macOS 构建的关键步骤：

```bash
# 构建 macOS Universal binary
pnpm tauri build --target universal-apple-darwin
```

**构建时间**: 首次构建约 3-5 分钟，后续构建约 1-2 分钟

**预期输出**:
```
   Compiling ...
   Finished `release` profile [optimized] target(s) in XXs
   Built application at: .../target/universal-apple-darwin/release/gomoku-game
   Bundling 五子棋.app (...)
   Bundling 五子棋_0.1.0_universal.dmg (...)
   Finished 2 bundles at:
       .../五子棋.app
       .../五子棋_0.1.0_universal.dmg
```

### 步骤 5: 验证 Universal Binary

检查生成的二进制文件是否包含两个架构：

```bash
# 验证 universal binary 包含 x86_64 和 arm64
lipo -info "src-tauri/target/universal-apple-darwin/release/bundle/macos/五子棋.app/Contents/MacOS/gomoku-game"
```

**预期输出**:
```
Architectures in the fat file: ... are: x86_64 arm64
```

### 步骤 6: 检查构建产物

```bash
# 查看生成的 DMG 文件
ls -lh src-tauri/target/universal-apple-darwin/release/bundle/dmg/

# 应该看到类似:
# 五子棋_0.1.0_universal.dmg  (约 9-10 MB)
```

## 测试其他构建配置

### 仅构建当前架构 (更快)

如果只需要快速测试功能，不需要 universal binary：

```bash
# 构建当前架构 (Apple Silicon Mac 会生成 aarch64 版本)
pnpm tauri build
```

生成文件: `五子棋_0.1.0_aarch64.dmg`

### 测试开发模式

```bash
# 启动开发服务器 (热重载)
pnpm tauri:dev
```

## 常见问题排查

### 问题 1: Target 未安装

**错误信息**:
```
failed to build x86_64-apple-darwin binary: Target x86_64-apple-darwin is not installed
```

**解决方案**:
```bash
rustup target add x86_64-apple-darwin
```

### 问题 2: pnpm 版本不匹配

**症状**: 依赖安装警告或失败

**解决方案**:
```bash
# 安装指定版本的 pnpm
npm install -g pnpm@8
```

### 问题 3: 前端编译错误

**解决方案**:
1. 检查 TypeScript 类型错误: `pnpm run lint`
2. 清理缓存: `rm -rf node_modules dist && pnpm install`
3. 确保 Node.js 版本 >= 20

### 问题 4: Rust 编译失败

**解决方案**:
1. 清理 Rust 构建缓存: `cd src-tauri && cargo clean`
2. 更新 Rust: `rustup update stable`
3. 检查 `Cargo.toml` 依赖版本

### 问题 5: DMG 创建失败

**症状**: 应用编译成功但 DMG 打包失败

**解决方案**:
1. 确保有足够的磁盘空间 (至少 2GB)
2. 检查是否有其他 DMG 文件被挂载
3. 删除旧的构建产物后重试

## 与 GitHub Actions 的差异

### 环境版本
- **本地**: 可能使用更新的 Node.js、pnpm、Rust
- **CI**: 固定版本 (Node 20, pnpm 8, Rust stable)

### 缓存
- **本地**: Rust 和 Node 依赖会被缓存，后续构建更快
- **CI**: 使用 GitHub Actions cache，首次构建较慢

### 并行构建
- **本地**: 通常一次只构建一个平台
- **CI**: 三个平台并行构建 (macOS, Windows, Linux)

## 模拟完整 CI 流程

如果想要完全模拟 GitHub Actions 的行为：

```bash
#!/bin/bash
# simulate-ci.sh

echo "=== Simulating GitHub Actions Release Build ==="

echo "Step 1: Clean environment"
rm -rf node_modules dist src-tauri/target

echo "Step 2: Check Rust targets"
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

echo "Step 3: Install dependencies"
pnpm install

echo "Step 4: Build frontend"
pnpm build

echo "Step 5: Build Tauri app (Universal)"
pnpm tauri build --target universal-apple-darwin

echo "Step 6: Verify universal binary"
lipo -info "src-tauri/target/universal-apple-darwin/release/bundle/macos/五子棋.app/Contents/MacOS/gomoku-game"

echo "Step 7: Check build artifacts"
ls -lh src-tauri/target/universal-apple-darwin/release/bundle/dmg/

echo "=== Build simulation complete ==="
```

使用方法:
```bash
chmod +x simulate-ci.sh
./simulate-ci.sh
```

## 构建性能优化

### 使用 Rust 缓存

GitHub Actions 使用 `rust-cache` action 来加速构建。本地可以依赖 Cargo 的自动缓存。

### 增量构建

```bash
# 增量编译 (保留上次构建结果)
pnpm tauri build --target universal-apple-darwin

# 完全重新编译 (清理后构建)
cd src-tauri && cargo clean && cd .. && pnpm tauri build --target universal-apple-darwin
```

### 并行编译

Rust 默认使用所有 CPU 核心并行编译，可以通过环境变量调整：

```bash
# 使用 4 个核心编译
CARGO_BUILD_JOBS=4 pnpm tauri build --target universal-apple-darwin
```

## 验证清单

在推送 tag 到 GitHub 之前，确保本地测试通过以下检查：

- [ ] ✅ 所有 Rust targets 已安装
- [ ] ✅ `pnpm install` 成功无错误
- [ ] ✅ `pnpm build` 前端编译成功
- [ ] ✅ `pnpm tauri build --target universal-apple-darwin` 构建成功
- [ ] ✅ 生成的 binary 包含 x86_64 和 arm64 两个架构
- [ ] ✅ DMG 文件大小合理 (约 9-10 MB)
- [ ] ✅ 版本号在三个文件中一致:
  - `package.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/tauri.conf.json`

## 下一步

本地测试通过后，即可推送 tag 触发 GitHub Actions：

```bash
# 更新版本号后提交
git add .
git commit -m "chore: prepare release v1.0.0"

# 创建并推送 tag
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

查看 CI 构建进度:
```
https://github.com/YOUR_USERNAME/gomoku-game/actions
```
