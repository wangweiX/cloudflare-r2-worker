/**
 * 文件操作处理器
 */
import {ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE} from '../../config.js';
import {errorResponse, getBucket, jsonResponse} from '../../services/storage.js';
import {isAllowedContentType, isValidBucketName, isValidFilename, isValidFileSize} from '../../utils/validation.js';

/**
 * 获取/下载文件
 */
export async function handleGetFile(c) {
    try {
        const bucketName = c.req.param('bucketName');
        // 从URL路径中提取文件路径（包括子目录）
        const url = new URL(c.req.url);
        const pathMatch = url.pathname.match(/^\/api\/v1\/buckets\/[^\/]+\/files\/(.+)$/);
        const filename = pathMatch ? pathMatch[1] : '';

        if (!isValidBucketName(bucketName)) {
            return errorResponse('无效的存储桶名称');
        }

        if (!isValidFilename(filename)) {
            return errorResponse('无效的文件名');
        }

        const bucket = getBucket(bucketName, c.env);
        const object = await bucket.get(filename);

        if (!object) {
            return errorResponse(`文件 "${filename}" 不存在`, 404);
        }

        // 仅返回元数据
        const metadataOnly = url.searchParams.get('metadata') === 'true';
        if (metadataOnly) {
            return jsonResponse({
                success: true,
                bucket: bucketName,
                filename,
                size: object.size,
                etag: object.etag,
                uploaded: object.uploaded,
                contentType: object.httpMetadata?.contentType || 'application/octet-stream'
            });
        }

        // 返回文件内容
        const headers = new Headers();
        const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

        headers.set('Content-Type', contentType);
        headers.set('Content-Length', object.size.toString());
        headers.set('ETag', object.etag);
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);

        return new Response(object.body, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('获取文件失败:', error);
        return errorResponse(error.message || '获取文件失败', 500);
    }
}

/**
 * 删除文件
 */
export async function handleDeleteFile(c) {
    try {
        const bucketName = c.req.param('bucketName');
        // 从URL路径中提取文件路径（包括子目录）
        const url = new URL(c.req.url);
        const pathMatch = url.pathname.match(/^\/api\/v1\/buckets\/[^\/]+\/files\/(.+)$/);
        const filename = pathMatch ? pathMatch[1] : '';

        if (!isValidBucketName(bucketName)) {
            return errorResponse('无效的存储桶名称');
        }

        if (!isValidFilename(filename)) {
            return errorResponse('无效的文件名');
        }

        const bucket = getBucket(bucketName, c.env);
        await bucket.delete(filename);

        return jsonResponse({
            success: true,
            bucket: bucketName,
            filename,
            message: '文件删除成功'
        });
    } catch (error) {
        console.error('删除文件失败:', error);
        return errorResponse(error.message || '删除文件失败', 500);
    }
}

/**
 * 上传/更新文件（POST）
 */
export async function handleUploadFile(c) {
    try {
        const bucketName = c.req.param('bucketName');
        // 从URL路径中提取文件路径（包括子目录）
        const url = new URL(c.req.url);
        const pathMatch = url.pathname.match(/^\/api\/v1\/buckets\/[^\/]+\/files\/(.+)$/);
        const filename = pathMatch ? pathMatch[1] : '';

        if (!isValidBucketName(bucketName)) {
            return errorResponse('无效的存储桶名称');
        }

        if (!isValidFilename(filename)) {
            return errorResponse('无效的文件名');
        }

        const contentType = c.req.header('Content-Type') || 'application/octet-stream';
        const contentLength = parseInt(c.req.header('Content-Length') || '0');

        if (!isValidFileSize(contentLength, MAX_FILE_SIZE)) {
            return errorResponse(`文件大小必须在 1 字节到 ${MAX_FILE_SIZE / (1024 * 1024)}MB 之间`);
        }

        if (!isAllowedContentType(contentType, ALLOWED_CONTENT_TYPES)) {
            return errorResponse('不支持的文件类型');
        }

        const bucket = getBucket(bucketName, c.env);

        const result = await bucket.put(filename, c.req.raw.body, {
            httpMetadata: {contentType}
        });

        return jsonResponse({
            success: true,
            bucket: bucketName,
            filename,
            contentType,
            size: contentLength,
            etag: result.etag,
            message: '文件更新成功'
        });
    } catch (error) {
        console.error('更新文件失败:', error);
        return errorResponse(error.message || '更新文件失败', 500);
    }
}