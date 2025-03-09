# Cloudflare R2 存储桶管理器

这是一个基于Cloudflare Workers的Web应用程序，允许用户通过直观的界面管理他们的Cloudflare R2存储桶文件。

## 功能特点

- 简单的身份验证机制，使用API密钥
- 浏览、搜索R2存储桶中的文件
- 上传文件到R2存储桶，支持拖放功能
- 下载R2存储桶中的文件
- 删除不需要的文件
- 直观美观的用户界面，带有过渡动画
- 移动设备响应式设计
- 本地存储用户配置，方便下次使用

## 技术栈

- 前端：原生JavaScript, HTML5, CSS3
- 后端：Cloudflare Workers
- 存储：Cloudflare R2

## 使用方法

1. 访问Worker的域名，将会显示登录界面
2. 输入您的API密钥和存储桶名称
3. 点击"连接"按钮
4. 成功连接后，您可以：
   - 浏览文件列表
   - 搜索特定文件
   - 上传新文件
   - 下载或删除已有文件

## 部署说明

### 前提条件

- Cloudflare账户
- 已配置的R2存储桶
- 已创建的API密钥，具有适当的权限

### 部署步骤

1. 克隆此仓库
2. 安装依赖: `npm install`
3. 配置wrangler.toml:
   ```toml
   name = "cloudflare-r2-worker"
   main = "src/index.js"
   compatibility_date = "2023-07-10"
   
   [[r2_buckets]]
   binding = "BUCKET" # 将在Worker中使用的变量名
   bucket_name = "<YOUR_BUCKET_NAME>" # 您的实际R2存储桶名称
   ```
4. 部署到Cloudflare Workers: `npx wrangler publish`


## API文档

### 身份验证

所有API请求需要在请求头中包含有效的API密钥：

```
X-API-Key: 您的API密钥
```

### 端点

所有API端点都以 `/api/v1` 开头

#### 获取文件列表

```
GET /api/v1/buckets/:bucketName/files
```

获取指定存储桶中的所有文件列表。

**参数：**

| 参数名 | 位置 | 类型 | 说明 |
|-------|------|------|------|
| bucketName | 路径 | string | 存储桶名称 |
| prefix | 查询 | string | 可选。用于按前缀过滤文件 |
| delimiter | 查询 | string | 可选。文件路径分隔符，默认为 '/' |
| maxKeys | 查询 | number | 可选。返回的最大文件数量，默认为100 |

**响应：**

```json
{
  "success": true,
  "bucket": "bucketName",
  "objects": [
    {
      "key": "file1.txt",
      "size": 1024,
      "etag": "etag值",
      "uploaded": "2023-07-10T12:00:00.000Z",
      "contentType": "text/plain"
    }
  ],
  "prefixes": [
    "folder1/"
  ],
  "truncated": false
}
```

#### 获取/下载文件

```
GET /api/v1/buckets/:bucketName/files/:filename
```

获取或下载指定文件。

**参数：**

| 参数名 | 位置 | 类型 | 说明 |
|-------|------|------|------|
| bucketName | 路径 | string | 存储桶名称 |
| filename | 路径 | string | 文件名 |
| metadata | 查询 | boolean | 可选。设置为'true'时只返回文件元数据而不是文件内容 |

**响应：**

当 `metadata=true` 时:
```json
{
  "success": true,
  "bucket": "bucketName",
  "filename": "file1.txt",
  "size": 1024,
  "etag": "etag值",
  "uploaded": "2023-07-10T12:00:00.000Z",
  "contentType": "text/plain"
}
```

当 `metadata` 未设置或为 `false` 时，返回文件内容，带有以下响应头：
- Content-Type: 文件的MIME类型
- Content-Disposition: 附件下载配置
- Cache-Control: 缓存指令

#### 删除文件

```
DELETE /api/v1/buckets/:bucketName/files/:filename
```

删除指定文件。

**参数：**

| 参数名 | 位置 | 类型 | 说明 |
|-------|------|------|------|
| bucketName | 路径 | string | 存储桶名称 |
| filename | 路径 | string | 要删除的文件名 |

**响应：**

```json
{
  "success": true,
  "bucket": "bucketName",
  "filename": "file1.txt",
  "message": "文件已成功删除"
}
```

#### 更新文件

```
PUT /api/v1/buckets/:bucketName/files/:filename
```

更新（替换）指定文件。

**参数：**

| 参数名 | 位置 | 类型 | 说明 |
|-------|------|------|------|
| bucketName | 路径 | string | 存储桶名称 |
| filename | 路径 | string | 文件名 |
| file | 请求体 | binary | 文件内容 |
| Content-Type | 请求头 | string | 文件的MIME类型 |
| Content-Length | 请求头 | number | 文件大小（字节） |

**响应：**

```json
{
  "success": true,
  "bucket": "bucketName",
  "filename": "file1.txt",
  "contentType": "text/plain",
  "size": 1024,
  "etag": "etag值",
  "message": "文件已成功更新"
}
```

#### 上传文件

```
POST /api/v1/buckets/:bucketName/files
```

上传新文件到存储桶。

**参数：**

| 参数名 | 位置 | 类型 | 说明 |
|-------|------|------|------|
| bucketName | 路径 | string | 存储桶名称 |

**请求体：**
- `multipart/form-data` 形式，包含 `file` 字段
- 或直接发送文件内容，并通过 `X-Filename` 请求头指定文件名

**响应：**

```json
{
  "success": true,
  "bucket": "bucketName",
  "filename": "file1.txt",
  "contentType": "text/plain",
  "size": 1024,
  "etag": "etag值",
  "message": "文件已成功上传"
}
```

### 错误响应

当API请求失败时，将返回以下格式的错误响应：

```json
{
  "error": "错误描述",
  "message": "详细错误信息（如有）"
}
```

**常见错误状态码：**

- 400: 请求参数错误或文件大小/类型不符合要求
- 401: API密钥无效或缺失
- 404: 存储桶或文件不存在
- 500: 服务器内部错误


## 安全考虑

- API密钥只存储在客户端本地存储中，并在API请求中作为头部发送
- 建议为此应用创建专用的API密钥，并限制其权限
- 考虑为Workers添加额外的安全机制，如IP限制或地理位置限制

## 许可证

MIT

## 贡献

欢迎贡献！请随时提交问题或拉取请求。