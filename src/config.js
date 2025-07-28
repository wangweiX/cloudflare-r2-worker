/**
 * 应用配置
 */

// 文件上传限制
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// 允许的文件类型
export const ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// CORS 配置
export const CORS_CONFIG = {
    origin: '*', // 生产环境请修改为具体域名
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'Accept'],
    maxAge: 86400,
};