/**
 * 工具模块 - 提供通用工具方法
 */
import {CORS_HEADERS} from './config.js';

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} - 生成的随机字符串
 */
export function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charsLength = chars.length;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
}

/**
 * 获取文件扩展名
 * @param {string} contentType - 文件的 MIME 类型
 * @returns {string} - 对应的文件扩展名
 */
export function getExtension(contentType) {
    const extensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };

    return extensionMap[contentType] || 'bin';
}

/**
 * 生成安全的文件名
 * @param {string} originalName - 原始文件名
 * @param {string} contentType - 文件的 MIME 类型
 * @returns {string} - 生成的安全文件名
 */
export function generateSafeFilename(originalName, contentType) {
    // 移除路径信息，只保留文件名
    const filename = originalName.split('/').pop().split('\\').pop();

    // 移除原有扩展名，只保留文件名部分
    const nameWithoutExtension = filename.split('.')[0]; // 获取不带扩展名的部分

    // 处理特殊字符：将空格和其他非字母数字字符替换为下划线
    const safeName = nameWithoutExtension.replace(/[^a-zA-Z0-9-]/g, '_');

    // 获取扩展名
    const extension = getExtension(contentType);

    // 添加时间戳和随机字符串，确保唯一性
    return `${Date.now()}_${generateRandomString()}_${safeName}.${extension}`;
}

/**
 * 创建 JSON 响应
 * @param {object} data - 响应数据
 * @param {number} status - HTTP 状态码
 * @returns {Response} - 格式化的 Response 对象
 */
export function createJsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
        },
    });
}

