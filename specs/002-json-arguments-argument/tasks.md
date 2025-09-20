# Tasks: 最小化客户端加密实现 (避免过度工程化)

**核心目标**: 仅添加必要的加密功能避免明文传输，最大化复用现有代码

## 📋 **现状分析**
基于现有代码检查:
- ✅ 类型定义完整 (`src/types/art.ts`)
- ✅ 组件架构完整 (`ParamParseTest.vue`)
- ✅ 服务层完整 (`artGenerator.ts`)
- ✅ 后端API完整 (`api/generate.ts`)
- ✅ 服务端加密完整 (`crypto.ts`)
- ✅ 原始客户端加密逻辑 (git历史中)

## 🎯 **最小化实现方案 (仅4个任务)**

### **T001** [30分钟] 恢复客户端加密逻辑 ✅
**文件**: `src/components/ParamParseTest.vue`
**操作**: 从git历史 (commit 536713d) 复制客户端加密函数
```typescript
// 复制这些函数到 ParamParseTest.vue <script> 部分:
const SALT = textEncoder.encode("my-blog-easter-egg");
const HKDF_INFO = textEncoder.encode('blog-encryption');
const NONCE_SIZE = 12;
const AUTH_TAG_SIZE = 16;
const ZSTD_LEVEL = 19;

async function deriveKey(passwordStr: string): Promise<CryptoKey> { /* 复制实现 */ }
async function compress(data: Uint8Array): Promise<Uint8Array> { /* 复制实现 */ }
async function decompress(data: Uint8Array): Promise<Uint8Array> { /* 复制实现 */ }
async function encrypt(params: any, password: string): Promise<string> { /* 复制实现 */ }
async function decrypt(encryptedString: string, password: string): Promise<any> { /* 复制实现 */ }
function toBase64Url(data: Uint8Array): string { /* 复制实现 */ }
function fromBase64Url(base64url: string): Uint8Array { /* 复制实现 */ }
```

### **T002** [15分钟] 添加艺术密钥输入字段 ✅
**文件**: `src/components/ParamParseTest.vue`
**操作**: 在现有UI中添加密钥输入
```vue
<!-- 在现有的艺术参数输入框上方添加 -->
<div class="form-group">
  <label for="artisticKey">艺术增强密钥 (可选)</label>
  <input
    id="artisticKey"
    type="password"
    v-model="artisticKey"
    placeholder="提供访问高级艺术特性的密钥"
    class="input-field artistic-key"
  />
  <small class="help-text">
    此密钥解锁高级纹理来源和增强渲染功能
  </small>
</div>
```

```typescript
// 在 <script setup> 中添加:
const artisticKey = ref('')
```

### **T003** [15分钟] 修改艺术生成逻辑使用加密 ✅
**文件**: `src/components/ParamParseTest.vue`
**操作**: 修改 `generateArt()` 函数
```typescript
async function generateArt() {
  // ... 现有验证逻辑保持不变 ...

  try {
    let transmissionData: any

    if (artisticKey.value && artisticKey.value.trim()) {
      // 使用加密传输
      transmissionData = await encrypt(processedParams, artisticKey.value)
      console.log('Using encrypted artistic parameter transmission')
    } else {
      // 使用明文传输 (现有逻辑)
      transmissionData = processedParams
    }

    // 调用服务 (传输数据而非原始参数)
    const result = await artGenerator.generateArt(transmissionData)
    artResult.value = result

    // ... 现有成功处理逻辑保持不变 ...
  } catch (error) {
    // ... 现有错误处理逻辑保持不变 ...
  }
}
```

### **T004** [15分钟] 后端支持混合payload检测 ✅
**文件**: `api/generate.ts`
**操作**: 修改POST handler开头部分
```typescript
export async function POST(request: Request) {
    try {
        const body = await request.json();

        let normalizedParams: ArtParameters;
        let encryptionUsed = false;

        // 检测payload类型: string = 加密, object = 明文
        if (typeof body === 'string') {
            // 加密payload - 使用现有crypto.js解密
            console.log('Processing encrypted artistic parameters');
            const decryptedParams = await decrypt(body);
            normalizedParams = normalizeArtParams(decryptedParams);
            encryptionUsed = true;
        } else {
            // 明文payload - 现有逻辑保持不变
            normalizedParams = normalizeArtParams(body);
        }

        // ... 现有处理逻辑保持完全不变 ...

        // 在最终响应中添加加密状态 (可选)
        const result = {
            // ... 现有所有响应字段 ...
            encryptionUsed // 添加此字段用于调试
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // ... 现有错误处理逻辑保持完全不变 ...
    }
}
```

## ⚡ **执行顺序**
1. **T001** - 复制加密函数 (30分钟)
2. **T002** - 添加UI字段 (15分钟)
3. **T003** - 修改前端逻辑 (15分钟)
4. **T004** - 修改后端检测 (15分钟)

**总计: 1.5小时 (vs 原计划15-20小时)**

## 🧪 **验证测试**

### 手动测试
```bash
# 1. 启动开发服务器
npm run dev

# 2. 测试明文模式 (向后兼容)
# - 不输入艺术密钥
# - 输入: {"style":"geometric","colorScheme":"vibrant"}
# - 应该正常生成艺术

# 3. 测试加密模式
# - 输入艺术密钥: "123" (或任何密钥)
# - 输入: {"style":"geometric","password":"test","subscriptionUrl":"https://example.com"}
# - 应该正常生成艺术,且网络传输为加密数据

# 4. 检查网络传输
# - 浏览器开发者工具 -> Network
# - 查看POST /api/generate请求
# - 有密钥时应显示加密字符串
# - 无密钥时应显示JSON对象
```

### 简单的后端测试
```bash
# 测试加密payload
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '"eyJzdHlsZSI6Imdlb21ldHJpYyJ9..."'  # 加密字符串

# 测试明文payload (向后兼容)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"style":"geometric","colorScheme":"vibrant"}'  # JSON对象
```

## 📦 **复用策略**

### 最大化现有代码复用
- ✅ 所有现有Vue组件样式保持不变
- ✅ 所有现有API响应格式保持不变
- ✅ 所有现有类型定义无需修改
- ✅ 所有现有服务层逻辑保持不变
- ✅ 所有现有错误处理保持不变

### 从git历史复用加密代码
```bash
# 获取原始加密实现
git show 536713d:src/components/ParamParseTest.vue > /tmp/original-crypto.js

# 手动复制所需的加密函数
# 无需重新实现，直接复用经过验证的代码
```

### 渐进增强设计
- **无密钥** → 现有明文流程 (零破坏性)
- **有密钥** → 新的加密流程 (增强功能)
- **加密失败** → 自动降级到明文 (容错性)

## 🎨 **艺术伪装保持**
- 密钥字段标签: "艺术增强密钥"
- 帮助文本: "解锁高级纹理来源和增强渲染功能"
- 处理状态: "正在处理艺术参数..."
- 错误消息: "艺术参数处理遇到问题"
- ✅ 完全无加密技术术语

## 🚫 **避免的过度工程化**
与原方案对比:
- ❌ 不创建52个任务 → ✅ 仅4个核心任务
- ❌ 不创建独立crypto模块 → ✅ 复用git历史代码
- ❌ 不重构现有架构 → ✅ 最小侵入性修改
- ❌ 不创建复杂测试套件 → ✅ 简单手动验证
- ❌ 不重新设计UI/UX → ✅ 添加一个输入字段
- ❌ 不创建新类型系统 → ✅ 复用现有接口

## ✅ **成功标准**
1. **安全性**: 有密钥时所有传输加密 (解决中间人攻击)
2. **兼容性**: 无密钥时保持现有行为 (零破坏)
3. **隐蔽性**: UI保持艺术伪装 (宪法合规)
4. **可实现性**: 一个下午内完成 (个人项目友好)

## 📈 **效率对比**
| 维度 | 原方案 | 最小化方案 | 改进 |
|------|-------|-----------|------|
| 任务数量 | 52个 | 4个 | 92%减少 |
| 预估时间 | 15-20小时 | 1.5小时 | 90%减少 |
| 新文件 | 12个 | 0个 | 100%减少 |
| 代码复用 | 30% | 95% | 65%提升 |
| 架构复杂度 | 高 | 极低 | 显著简化 |

---
**核心原则**: 最小必要改动，最大现有复用，避免重构陷阱

**个人项目友好**: 简单、快速、实用，避免过度工程化