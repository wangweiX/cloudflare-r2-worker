/**
 * 认证中间件
 */

/**
 * API 密钥验证中间件
 */
export async function authMiddleware(c, next) {
    // OPTIONS 请求直接放行
    if (c.req.method === 'OPTIONS') {
        return await next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({error: 'API 密钥缺失'}, 401);
    }

    const providedKey = authHeader.substring(7);
    const expectedKey = c.env.API_KEY;

    if (!expectedKey || providedKey !== expectedKey) {
        return c.json({error: 'API 密钥无效'}, 401);
    }

    await next();
}