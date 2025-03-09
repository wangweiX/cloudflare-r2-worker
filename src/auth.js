/**
 * 认证模块 - 处理 API 认证
 */

/**
 * 验证 API 密钥
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @returns {boolean} - 是否验证通过
 */
export function isValidApiKey(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const providedKey = authHeader.substring(7); // 去掉 "Bearer " 部分
    return providedKey === env.API_KEY;
} 