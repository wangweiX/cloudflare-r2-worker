/**
 * 路由模块 - 使用 Hono 框架处理 API 请求路由
 */
import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {CORS_HEADERS} from './config.js';
import {isValidApiKey} from './auth.js';
import {handleDeleteFile, handleGetFile, handleGetFiles, handlePostFile, handlePutFile,} from './request-handlers.js';

// 创建 Hono 应用实例
const app = new Hono();

// 全局中间件：CORS 处理
app.use('*', cors({
    origin: '*',
    allowHeaders: Object.keys(CORS_HEADERS),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
}));

// API 密钥验证中间件
const apiKeyMiddleware = async (c, next) => {
    // OPTIONS 请求直接放行
    if (c.req.method === 'OPTIONS') {
        return await next();
    }

    const request = c.req.raw;
    const env = c.env;

    if (!isValidApiKey(request, env)) {
        return c.json({error: 'API 密钥无效或缺失'}, 401);
    }

    await next();
};

// 应用 API 密钥验证中间件
app.use('/api/*', apiKeyMiddleware);

// 错误处理中间件
app.onError((err, c) => {
    console.error('处理请求时发生错误:', err);
    return c.json({
        error: '处理请求时发生错误',
        message: err.message
    }, 500);
});

// 1. 获取存储桶下所有文件列表
app.get('/api/v1/buckets/:bucketName/files', async (c) => {
    const bucketName = c.req.param('bucketName');
    return await handleGetFiles(c.req.raw, c.env, bucketName);
});

// 2. 获取/下载特定文件
app.get('/api/v1/buckets/:bucketName/files/:filename', async (c) => {
    const bucketName = c.req.param('bucketName');
    const filename = c.req.param('filename');
    return await handleGetFile(c.req.raw, c.env, bucketName, filename);
});

// 3. 删除特定文件
app.delete('/api/v1/buckets/:bucketName/files/:filename', async (c) => {
    const bucketName = c.req.param('bucketName');
    const filename = c.req.param('filename');
    return await handleDeleteFile(c.req.raw, c.env, bucketName, filename);
});

// 4. 更新特定文件
app.put('/api/v1/buckets/:bucketName/files/:filename', async (c) => {
    const bucketName = c.req.param('bucketName');
    const filename = c.req.param('filename');
    return await handlePutFile(c.req.raw, c.env, bucketName, filename);
});

// 5. 上传新文件
app.post('/api/v1/buckets/:bucketName/files', async (c) => {
    const bucketName = c.req.param('bucketName');
    return await handlePostFile(c.req.raw, c.env, bucketName);
});

// 404 处理
app.notFound((c) => {
    return c.json({error: '无效的 API 路径'}, 404);
});

/**
 * 路由处理器 - 处理所有 API 请求
 */
export class Router {
    /**
     * 处理请求
     * @param {Request} request - 请求对象
     * @param {object} env - 环境变量
     * @returns {Promise<Response>} - 响应对象
     */
    static async handleRequest(request, env) {
        try {
            console.log(`处理请求: ${request.method} ${request.url}`);
            // 将环境变量注入 Hono 上下文
            return app.fetch(request, env);
        } catch (error) {
            console.error('路由处理请求时发生错误:', error);
            return new Response(JSON.stringify({
                error: '处理请求时发生内部错误',
                message: error.message || '未知错误'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }
} 