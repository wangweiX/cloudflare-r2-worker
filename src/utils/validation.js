/**
 * 输入验证工具
 */

/**
 * 验证文件名是否安全（支持带目录的文件路径）
 */
export function isValidFilename(filename) {
    if (!filename || typeof filename !== 'string' || filename.length > 255) {
        return false;
    }

    // 防止路径遍历
    if (filename.includes('..') || filename.includes('\\')) {
        return false;
    }

    // 允许字母、数字、中文、斜杠、点、下划线、横线
    return /^[a-zA-Z0-9\u4e00-\u9fa5/_.-]+$/.test(filename);
}

/**
 * 验证存储桶名称
 */
export function isValidBucketName(bucketName) {
    return /^[a-z0-9-]+$/.test(bucketName) && bucketName.length <= 63;
}

/**
 * 验证文件大小
 */
export function isValidFileSize(size, maxSize) {
    return typeof size === 'number' && size > 0 && size <= maxSize;
}

/**
 * 验证内容类型
 */
export function isAllowedContentType(contentType, allowedTypes) {
    const type = contentType?.split(';')[0].toLowerCase().trim();
    return allowedTypes.some(allowed => allowed.toLowerCase() === type);
}

/**
 * 验证文件夹路径是否安全
 */
export function isValidFolderPath(folderPath) {
    if (!folderPath || typeof folderPath !== 'string') {
        return true; // 空路径是允许的
    }

    // 防止路径遍历
    if (folderPath.includes('..') || folderPath.includes('\\')) {
        return false;
    }

    // 允许字母、数字、中文、斜杠、横线、下划线
    return /^[a-zA-Z0-9\u4e00-\u9fa5/_-]+$/.test(folderPath);
}
