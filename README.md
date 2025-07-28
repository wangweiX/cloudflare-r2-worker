# Cloudflare R2 Worker API

一个基于 Cloudflare Workers 的 RESTful API，用于管理 Cloudflare R2 存储桶中的文件。

## 功能特点

✨ **核心功能**
- 基础文件操作（上传、下载、删除）
- 支持多个 R2 存储桶管理
- **层次目录结构支持**（通过文件路径实现嵌套目录）
- 流式文件上传，优化内存使用
- 文件元数据查询
- 支持中文文件名和路径

🔒 **安全特性**
- Bearer Token 认证机制
- 文件路径安全验证（防止路径遍历攻击）
- 文件大小限制（最大 100MB）
- 文件类型白名单机制

🚀 **性能优化**
- 流式上传和下载
- 高效的内存管理
- 优化的错误处理

## 快速开始

### 前置要求

- Node.js 16+
- Cloudflare 账号
- 已创建的 R2 存储桶

### 安装依赖

```bash
npm install
```

### 配置

1. **配置 R2 存储桶**

编辑 `wrangler.toml` 文件：

```toml
name = "cloudflare-r2-worker"
main = "src/index.js"
compatibility_date = "2023-08-01"
compatibility_flags = ["nodejs_compat"]

# 配置 R2 存储桶
[[r2_buckets]]
binding = "image"      # 在代码中使用的绑定名称
bucket_name = "image"  # R2 中的实际存储桶名称

[[r2_buckets]]
binding = "file"
bucket_name = "file"
```

2. **设置环境变量**

在 Cloudflare Workers 设置页面中添加：
- `API_KEY`: 用于 API 认证的密钥

### 开发

```bash
# 启动本地开发服务器
npm run dev

# 部署到 Cloudflare Workers
npm run deploy
```

## API 文档

### 认证

所有 API 请求都需要在请求头中包含 Bearer Token：

```
Authorization: Bearer YOUR_API_KEY
```

### 基础路径

所有 API 端点都以 `/api/v1` 开头。

### 端点列表

#### 1. 下载文件

```
GET /api/v1/buckets/{bucketName}/files/{filePath}
```

**支持目录结构：**
- 单层文件：`GET /api/v1/buckets/file/files/report.pdf`
- 嵌套目录：`GET /api/v1/buckets/file/files/2024/documents/report.pdf`
- 深层目录：`GET /api/v1/buckets/file/files/projects/web/assets/images/logo.png`

**查询参数：**
- `metadata` (可选): 设置为 `true` 只返回文件元数据

**响应：**
- 默认返回文件内容（二进制流）
- `metadata=true` 时返回 JSON 格式的元数据

#### 2. 上传文件

```
POST /api/v1/buckets/{bucketName}/files/{filePath}
```

**说明：**
- 文件路径必须在URL中指定完整路径（包括文件名）
- 支持嵌套目录，如：`2024/documents/report.pdf`
- 直接发送文件内容作为请求体（流式上传）

**示例：**
```javascript
// 上传到根目录
fetch('/api/v1/buckets/file/files/report.pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/pdf'
  },
  body: fileBlob
});

// 上传到子目录
fetch('/api/v1/buckets/file/files/2024/documents/annual-report.pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/pdf'
  },
  body: fileBlob
});
```

**响应示例：**
```json
{
  "success": true,
  "bucket": "file",
  "filename": "2024/documents/annual-report.pdf",
  "contentType": "application/pdf",
  "size": 204800,
  "etag": "\"abc123...\"",
  "message": "文件更新成功"
}
```

#### 3. 删除文件

```
DELETE /api/v1/buckets/{bucketName}/files/{filePath}
```

**支持目录结构：**
- 删除根目录文件：`DELETE /api/v1/buckets/file/files/report.pdf`
- 删除目录中文件：`DELETE /api/v1/buckets/file/files/2024/reports/annual.pdf`

## 配置说明

### 文件类型限制

在 `src/config.js` 中配置允许的文件类型：

```javascript
export const ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    // ... 更多类型
];
```


### CORS 配置

默认允许所有域名访问（`*`）。生产环境建议修改为具体域名：

```javascript
export const CORS_CONFIG = {
    origin: 'https://yourdomain.com',
    // ...
};
```

## 错误处理

API 使用标准 HTTP 状态码，错误响应格式：

```json
{
  "error": "错误描述信息"
}
```

常见错误码：
- `400` - 请求参数错误
- `401` - 认证失败
- `404` - 资源不存在
- `413` - 文件过大
- `500` - 服务器内部错误

## 项目结构

```
src/
├── index.js          # Worker 入口点
├── config.js         # 应用配置（文件类型、CORS、大小限制）
├── api/             
│   ├── router.js    # Hono 路由定义（3个端点，使用通配符支持目录路径）
│   └── handlers/    
│       └── files.js # 文件操作处理器（下载、上传、删除）
├── middleware/      
│   └── auth.js      # Bearer Token 认证中间件
├── services/        
│   └── storage.js   # R2 存储服务工具类
└── utils/          
    └── validation.js # 输入验证（支持目录路径，防止路径遍历）
```

## 安全建议

1. **生产环境配置**
   - 使用强密码作为 API_KEY
   - 限制 CORS 来源域名

2. **存储桶权限**
   - 为 Worker 配置最小必要权限
   - 定期审查存储桶访问日志

3. **监控和日志**
   - 启用 Cloudflare Workers 分析
   - 监控异常请求模式
   - 设置告警规则

## 部署步骤

1. 确保已安装并配置 Wrangler CLI
2. 修改 `wrangler.toml` 中的配置
3. 设置必要的环境变量
4. 运行部署命令：

```bash
npm run deploy
```

## 目录操作示例

### 文件路径操作

**所有操作都通过URL路径指定文件位置：**

```bash
# 上传文件到根目录
curl -X POST "https://your-worker.workers.dev/api/v1/buckets/file/files/report.pdf" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @report.pdf

# 上传文件到子目录
curl -X POST "https://your-worker.workers.dev/api/v1/buckets/file/files/2024/documents/annual.pdf" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @annual.pdf

# 上传到深层目录
curl -X POST "https://your-worker.workers.dev/api/v1/buckets/file/files/projects/web/assets/images/logo.jpg" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: image/jpeg" \
  --data-binary @logo.jpg

# 下载文件
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://your-worker.workers.dev/api/v1/buckets/file/files/2024/documents/annual.pdf" \
  -o annual.pdf

# 删除文件
curl -X DELETE \
  -H "Authorization: Bearer YOUR_API_KEY" \
  "https://your-worker.workers.dev/api/v1/buckets/file/files/2024/documents/annual.pdf"
```

### JavaScript 示例

```javascript
// 上传文件到指定路径
async function uploadFile(filePath, fileBlob, contentType) {
  const response = await fetch(`/api/v1/buckets/file/files/${filePath}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': contentType
    },
    body: fileBlob
  });
  return response.json();
}

// 使用示例
uploadFile('2024/images/photo.jpg', fileBlob, 'image/jpeg');
uploadFile('documents/readme.txt', textBlob, 'text/plain');
```

### 路径约定

- **分隔符**：使用正斜杠 `/` 作为目录分隔符
- **路径规则**：支持中文、英文、数字、下划线、横线
- **安全限制**：禁止 `..`（防止路径遍历）和 `\`（Windows路径）
- **示例路径**：
  - `documents/2024/reports/annual.pdf`
  - `images/products/thumbnails/item-001.jpg`
  - `备份文件/2024年/数据库备份.sql`

## 常见问题

**Q: 如何增加文件大小限制？**
A: 修改 `src/config.js` 中的 `MAX_FILE_SIZE` 值。注意 Workers 有请求体大小限制。

**Q: 如何添加新的文件类型？**
A: 在 `src/config.js` 的 `ALLOWED_CONTENT_TYPES` 数组中添加 MIME 类型。

**Q: 如何使用多个存储桶？**
A: 在 `wrangler.toml` 中添加更多 `[[r2_buckets]]` 配置。

**Q: 如何创建目录结构？**
A: 通过上传文件时在URL路径中指定完整路径，如 `POST /api/v1/buckets/file/files/2024/reports/file.pdf`

**Q: 如何处理文件名中的特殊字符？**
A: API 支持中文文件名和目录名，但不允许 `..` 和 `\` 等危险字符。

**Q: 如何获取文件列表？**
A: 当前版本不提供文件列表API，需要通过其他方式管理文件索引。

**Q: 是否支持文件更新？**
A: 直接上传到相同路径即可覆盖原文件，API会返回"文件更新成功"消息。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！