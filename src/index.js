/**
 * Cloudflare R2 Worker 入口
 */
import app from './api/router.js';

export default {
    async fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    }
};