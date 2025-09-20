# Tasks: 最小化客户端加密实现 (避免过度工程化)

**核心目标**: 仅添加必要的加密功能避免明文传输，最大化复用现有代码

## 📋 **现状分析**
- ✅ 类型定义完整 (`src/types/art.ts`)
- ✅ 组件架构完整 (`ParamParseTest.vue`)
- ✅ 服务层完整 (`artGenerator.ts`)
- ✅ 后端API完整 (`api/generate.ts`)
- ✅ 服务端加密完整 (`crypto.ts`)
- ✅ 原始客户端加密逻辑 (git历史中)

## 🎯 **最小化实现方案**

### 核心任务 (仅4个文件改动)

**T001 [30分钟]** 恢复客户端加密逻辑到 `src/components/ParamParseTest.vue`
```typescript
// 从git历史恢复这些函数到ParamParseTest.vue:
// - deriveKey(), compress(), decompress()
// - encrypt(), decrypt(), toBase64Url(), fromBase64Url()
// - 复用原始加密常量 (SALT, HKDF_INFO, etc.)
```

**T002 [15分钟]** 添加密码字段到 `src/components/ParamParseTest.vue`
```vue
<!-- 添加艺术密钥输入框 (伪装为艺术参数) -->
<input
  type="password"
  v-model="artisticKey"
  placeholder="艺术增强密钥 (可选)"
/>
```

**T003 [15分钟]** 修改 `src/services/artGenerator.ts`
```typescript
// 修改 generateArt() 方法:
// if (hasArtisticKey) {
//   payload = await encrypt(params, key)
// } else {
//   payload = params
// }
```

**T004 [15分钟]** 增强 `api/generate.ts` payload检测
```typescript
// 在POST handler中添加:
// if (typeof body === 'string') {
//   params = await decrypt(body)  // 加密payload
// } else {
//   params = body  // 明文payload (现有逻辑)
// }
```

## ⚡ **执行顺序**
1. **T001** - 恢复加密函数 (独立任务)
2. **T002** - 添加UI字段 (依赖T001)
3. **T003** - 修改服务调用 (依赖T001,T002)
4. **T004** - 后端兼容 (独立任务，可并行)

## 🧪 **简单验证**
```bash
# 测试加密传输
curl -X POST /api/generate -d '"加密字符串"'

# 测试明文传输 (向后兼容)
curl -X POST /api/generate -d '{"style":"geometric"}'

# UI测试: 有无艺术密钥的对比
```

## 📦 **复用策略**

### 从原始ParamParseTest.vue复用 (git 536713d)
```typescript
// 这些函数直接复制到当前ParamParseTest.vue
const SALT = textEncoder.encode("my-blog-easter-egg");
const HKDF_INFO = textEncoder.encode('blog-encryption');
async function deriveKey(passwordStr: string): Promise<CryptoKey>
async function compress(data: Uint8Array): Promise<Uint8Array>
async function encrypt(params: any, password: string): Promise<string>
async function decrypt(encryptedString: string, password: string): Promise<any>
```

### 现有架构保持不变
- ✅ `ArtParameters` 接口无需修改
- ✅ `ArtGenerationResult` 无需修改
- ✅ 现有组件样式保持
- ✅ 现有API契约保持
- ✅ 宪法合规性天然满足

### 渐进增强策略
- **无密钥** = 现有明文流程 (零破坏)
- **有密钥** = 加密流程 (新增功能)
- **错误处理** = 降级到明文 (保持可用性)

## 🎨 **艺术伪装保持**
- 密钥字段 → "艺术增强密钥"
- 加密过程 → "参数处理中..."
- 错误信息 → "艺术参数格式问题"
- 无可见加密术语

## ⏱️ **预估时间**
- **总时间**: 1.5小时 (而非15-20小时)
- **T001**: 30分钟 (复制粘贴+调试)
- **T002**: 15分钟 (UI字段)
- **T003**: 15分钟 (服务调用)
- **T004**: 15分钟 (后端检测)
- **测试**: 15分钟

## 🚫 **避免的过度工程化**
- ❌ 不创建独立crypto模块
- ❌ 不重构现有架构
- ❌ 不添加复杂类型系统
- ❌ 不创建测试基础设施
- ❌ 不重新设计UI组件
- ❌ 不创建新的服务抽象

## ✅ **成功标准**
1. 有密钥时传输加密 (阻止中间人攻击)
2. 无密钥时保持现状 (向后兼容)
3. UI无明显加密痕迹 (宪法合规)
4. 一天内完成实现 (简单可行)

---
**核心原则**: 最小必要改动，最大现有复用，避免架构重构