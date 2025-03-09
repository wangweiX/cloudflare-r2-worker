/**
 * 存储桶管理模块 - 管理多个 R2 存储桶
 */

/**
 * 获取指定名称的存储桶
 * @param {string} bucketName - 存储桶名称，需与Cloudflare R2绑定名称保持一致
 * @param {object} env - 环境变量
 * @returns {object|null} - 存储桶对象或 null
 */
export function getBucket(bucketName, env) {
    // 直接从环境变量中获取对应名称的存储桶
    const bucket = env[bucketName];
    
    if (!bucket) {
        console.warn(`未找到名为 ${bucketName} 的存储桶绑定`);
        return null;
    }
    
    return bucket;
}

