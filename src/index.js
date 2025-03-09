/**
 * Cloudflare R2 多存储桶 API
 * 提供完整的 API 接口用于操作多个 Cloudflare R2 存储桶
 */
import {Router} from './router.js';

// Worker 入口点
export default {
    async fetch(request, env, ctx) {
        try {
            return Router.handleRequest(request, env);
        } catch (error) {
            console.error('处理请求时发生错误:', error);
            return new Response(JSON.stringify({
                error: '处理请求时发生内部错误',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }
};
