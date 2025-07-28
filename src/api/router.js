/**
 * API 路由定义
 */
import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {CORS_CONFIG} from '../config.js';
import {authMiddleware} from '../middleware/auth.js';
import {handleDeleteFile, handleGetFile, handleUploadFile} from './handlers/files.js';

// 创建路由器
const app = new Hono();


// CORS 中间件
app.use('*', cors(CORS_CONFIG));

// API 认证
app.use('/api/*', authMiddleware);

// 错误处理
app.onError((err, c) => {
    console.error('请求处理错误:', err);
    return c.json({
        error: '服务器内部错误'
    }, 500);
});

// API 路由
const v1 = app.basePath('/api/v1');

// 文件操作路由（使用通配符支持带目录的文件路径）
v1.get('/buckets/:bucketName/files/*', handleGetFile);
v1.post('/buckets/:bucketName/files/*', handleUploadFile);
v1.delete('/buckets/:bucketName/files/*', handleDeleteFile);

// 404 处理
app.notFound((c) => {
    return c.json({error: '无效的 API 路径'}, 404);
});

export default app;