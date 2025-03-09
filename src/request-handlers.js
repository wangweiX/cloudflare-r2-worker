/**
 * 请求处理模块 - 处理不同类型的 HTTP 请求
 */
import {ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE} from './config.js';
import {createJsonResponse, generateSafeFilename} from './utils.js';
import {getBucket} from './bucket-manager.js';

/**
 * 获取存储桶文件列表
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} bucketName - 存储桶名称
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleGetFiles(request, env, bucketName) {
    try {
        const bucket = getBucket(bucketName, env);

        if (!bucket) {
            return createJsonResponse({error: `存储桶 "${bucketName}" 不存在`}, 404);
        }

        const url = new URL(request.url);
        // 获取查询参数，支持分页和过滤
        const prefix = url.searchParams.get('prefix') || '';
        const delimiter = url.searchParams.get('delimiter') || '/';
        const maxKeys = parseInt(url.searchParams.get('maxKeys') || '100');

        // 列出对象
        const listed = await bucket.list({
            prefix,
            delimiter,
            maxKeys,
        });

        return createJsonResponse({
            success: true,
            bucket: bucketName,
            objects: listed.objects.map(obj => ({
                key: obj.key,
                size: obj.size,
                etag: obj.etag,
                uploaded: obj.uploaded,
                contentType: obj.httpMetadata?.contentType
            })),
            prefixes: listed.delimitedPrefixes,
            truncated: listed.truncated
        });
    } catch (error) {
        console.error('获取文件列表时发生错误:', error);
        return createJsonResponse({error: '获取文件列表时发生错误'}, 500);
    }
}

/**
 * 获取（下载）单个文件
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} bucketName - 存储桶名称
 * @param {string} filename - 文件名
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleGetFile(request, env, bucketName, filename) {
    try {
        const bucket = getBucket(bucketName, env);

        if (!bucket) {
            return createJsonResponse({error: `存储桶 "${bucketName}" 不存在`}, 404);
        }

        // 获取文件对象
        const object = await bucket.get(filename);

        if (!object) {
            return createJsonResponse({error: `文件 "${filename}" 不存在`}, 404);
        }

        // 检查是否是仅请求元数据而非下载
        const url = new URL(request.url);
        const metadataOnly = url.searchParams.get('metadata') === 'true';

        if (metadataOnly) {
            // 只返回文件元数据
            return createJsonResponse({
                success: true,
                bucket: bucketName,
                filename,
                size: object.size,
                etag: object.etag,
                uploaded: object.uploaded,
                contentType: object.httpMetadata?.contentType || 'application/octet-stream'
            });
        }

        // 获取文件内容和元数据
        const headers = new Headers();

        // 设置内容类型
        const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
        headers.set('Content-Type', contentType);

        // 设置内容处置（告诉浏览器这是可下载的文件）
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // 设置缓存控制
        headers.set('Cache-Control', 'public, max-age=31536000');

        // 返回文件流
        return new Response(object.body, {
            headers
        });
    } catch (error) {
        console.error('获取文件时发生错误:', error);
        return createJsonResponse({error: '获取文件时发生错误'}, 500);
    }
}

/**
 * 删除文件
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} bucketName - 存储桶名称
 * @param {string} filename - 文件名
 * @returns {Promise<Response>} - 响应对象
 */
export async function handleDeleteFile(request, env, bucketName, filename) {
    try {
        const bucket = getBucket(bucketName, env);

        if (!bucket) {
            return createJsonResponse({error: `存储桶 "${bucketName}" 不存在`}, 404);
        }

        // 检查文件是否存在
        const object = await bucket.head(filename);
        if (!object) {
            return createJsonResponse({error: `文件 "${filename}" 不存在`}, 404);
        }

        // 删除文件
        await bucket.delete(filename);

        return createJsonResponse({
            success: true,
            bucket: bucketName,
            filename,
            message: '文件已成功删除'
        });
    } catch (error) {
        console.error('删除文件时发生错误:', error);
        return createJsonResponse({error: '删除文件时发生错误'}, 500);
    }
}

/**
 * 更新文件（PUT）
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} bucketName - 存储桶名称
 * @param {string} filename - 文件名
 * @returns {Promise<Response>} - 响应对象
 */
export async function handlePutFile(request, env, bucketName, filename) {
    try {
        const bucket = getBucket(bucketName, env);

        if (!bucket) {
            return createJsonResponse({error: `存储桶 "${bucketName}" 不存在`}, 404);
        }

        // 验证内容类型
        const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

        if (ALLOWED_CONTENT_TYPES.length > 0 && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
            return createJsonResponse({error: `不支持的文件类型 ${contentType}`}, 400);
        }

        // 检查文件大小（如果有 Content-Length 头）
        const contentLength = parseInt(request.headers.get('Content-Length') || '0');
        if (contentLength > MAX_FILE_SIZE) {
            return createJsonResponse({
                error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`
            }, 400);
        }

        // 获取文件内容
        const fileData = request.body;

        // 上传文件到 R2 存储
        await bucket.put(filename, fileData, {
            httpMetadata: {
                contentType
            },
        });

        // 获取上传后的文件信息
        const object = await bucket.head(filename);

        // 返回上传成功的响应
        return createJsonResponse({
            success: true,
            bucket: bucketName,
            filename,
            contentType,
            size: object?.size || contentLength,
            etag: object?.etag,
            message: '文件已成功更新'
        });
    } catch (error) {
        console.error('更新文件时发生错误:', error);
        return createJsonResponse({error: '更新文件时发生错误'}, 500);
    }
}

/**
 * 上传文件（POST）
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} bucketName - 存储桶名称
 * @returns {Promise<Response>} - 响应对象
 */
export async function handlePostFile(request, env, bucketName) {
    try {
        const bucket = getBucket(bucketName, env);

        if (!bucket) {
            return createJsonResponse({error: `存储桶 "${bucketName}" 不存在`}, 404);
        }

        // 检查请求的内容类型
        const contentType = request.headers.get('Content-Type') || '';

        // 根据请求的内容类型选择不同的处理方式
        if (contentType.includes('multipart/form-data')) {
            // 处理 multipart/form-data 请求（表单上传）
            const formData = await request.formData();
            const file = formData.get('file');

            if (!file || !(file instanceof File)) {
                return createJsonResponse({error: '未找到文件数据'}, 400);
            }

            // 验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                return createJsonResponse({
                    error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`
                }, 400);
            }

            // 验证文件类型
            if (ALLOWED_CONTENT_TYPES.length > 0 && !ALLOWED_CONTENT_TYPES.includes(file.type)) {
                return createJsonResponse({error: `不支持的文件类型 ${file.type}`}, 400);
            }

            // 获取自定义文件夹路径（如果提供）
            const folder = formData.get('folder') || '';
            const folderPath = folder ? `${folder.trim().replace(/^\/+|\/+$/g, '')}/` : '';

            // 获取文件名（如果提供），否则生成安全的文件名
            const customFilename = formData.get('filename');
            let finalFilename;

            if (customFilename) {
                // 使用自定义文件名，但确保安全
                finalFilename = customFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
            } else {
                // 生成安全的文件名
                finalFilename = generateSafeFilename(file.name, file.type);
            }

            const fullPath = `${folderPath}${finalFilename}`;

            // 上传文件到 R2 存储
            await bucket.put(fullPath, file.stream(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });

            // 返回上传成功的响应
            return createJsonResponse({
                success: true,
                bucket: bucketName,
                filename: finalFilename,
                path: fullPath,
                contentType: file.type,
                size: file.size,
            });

        } else if (contentType.includes('application/json')) {
            // 处理 JSON 请求
            const jsonData = await request.json();

            if (!jsonData.fileUrl) {
                return createJsonResponse({error: '缺少文件 URL'}, 400);
            }

            // 从 JSON 中获取文件 URL 并下载
            const fileResponse = await fetch(jsonData.fileUrl);

            if (!fileResponse.ok) {
                return createJsonResponse({
                    error: `获取文件失败: ${fileResponse.status} ${fileResponse.statusText}`
                }, 400);
            }

            // 获取文件内容类型
            const fileContentType = fileResponse.headers.get('Content-Type') || 'application/octet-stream';

            // 检查内容类型
            if (ALLOWED_CONTENT_TYPES.length > 0 && !ALLOWED_CONTENT_TYPES.includes(fileContentType)) {
                return createJsonResponse({error: `不支持的文件类型 ${fileContentType}`}, 400);
            }

            // 获取文件名
            let fileName = jsonData.filename;

            if (!fileName) {
                // 尝试从 URL 中提取文件名
                const urlParts = new URL(jsonData.fileUrl).pathname.split('/');
                fileName = urlParts[urlParts.length - 1] || 'downloaded_file';
            }

            // 生成安全的文件名
            const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

            // 将文件保存到 R2
            await bucket.put(safeFileName, fileResponse.body, {
                httpMetadata: {
                    contentType: fileContentType,
                },
            });

            // 获取文件信息
            const fileObject = await bucket.head(safeFileName);

            return createJsonResponse({
                success: true,
                bucket: bucketName,
                filename: safeFileName,
                contentType: fileContentType,
                size: fileObject?.size || 0,
                source: 'external_url',
            });
        } else {
            // 其他内容类型（直接上传二进制数据）
            return createJsonResponse({
                error: '不支持的内容类型，请使用 multipart/form-data 或 application/json'
            }, 400);
        }
    } catch (error) {
        console.error('上传文件时发生错误:', error);
        return createJsonResponse({error: '上传文件时发生错误', message: error.message}, 500);
    }
}
