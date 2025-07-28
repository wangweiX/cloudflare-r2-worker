/**
 * R2 存储服务
 */

/**
 * 获取 R2 存储桶
 */
export function getBucket(bucketName, env) {
    const bucket = env[bucketName];
    if (!bucket) {
        throw new Error(`存储桶 "${bucketName}" 不存在`);
    }
    return bucket;
}

/**
 * 生成安全的文件名
 */
export function generateSafeFilename(originalName, contentType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = getFileExtension(contentType);

    if (originalName) {
        // 清理原始文件名
        const cleanName = originalName
            .split('.')[0]
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '_')
            .substring(0, 50);
        return `${timestamp}_${random}_${cleanName}.${ext}`;
    }

    return `${timestamp}_${random}.${ext}`;
}

/**
 * 获取文件扩展名
 */
function getFileExtension(contentType) {
    const typeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };

    return typeMap[contentType] || 'bin';
}

/**
 * 创建 JSON 响应
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

/**
 * 创建错误响应
 */
export function errorResponse(message, status = 400) {
    return jsonResponse({error: message}, status);
}