/**
 * Asset upload manager for Daptin
 * Handles streaming uploads, presigned URLs, and progress tracking
 */
import axios, {AxiosInstance, AxiosProgressEvent} from "axios"
import {AppConfigProvider, TokenGetter} from "./interface";

export interface UploadOptions {
    onProgress?: (progress: ProgressEvent) => void;
    chunkSize?: number;
    metadata?: Record<string, any>;
}

export interface UploadInitResponse {
    upload_id: string;
    upload_type: 'stream' | 'presigned' | 'multipart';
    upload_url?: string;
    presigned_url?: string;
    method?: string;
    headers?: Record<string, string>;
    expires_at?: number;
    presigned_data?: {
        upload_type: string;
        presigned_url?: string;
        method?: string;
        headers?: Record<string, string>;
        expires_at?: number;
        upload_id?: string;
        parts?: Array<{
            part_number: number;
            presigned_url: string;
            headers?: Record<string, string>;
        }>;
        complete_multipart_endpoint?: string;
    };
    complete_url: string;
}

export interface ProgressEvent {
    loaded: number;
    total: number;
    percent: number;
    uploadId: string;
}

export class AssetManager {
    private appConfig: AppConfigProvider;
    private tokenGetter: TokenGetter;
    private axios: AxiosInstance;

    constructor(appConfig: AppConfigProvider, tokenGetter: TokenGetter, axios: AxiosInstance) {
        this.appConfig = appConfig;
        this.tokenGetter = tokenGetter;
        this.axios = axios;
    }

    /**
     * Get asset URL for downloading/viewing
     */
    getAssetUrl(typeName: string, resourceId: string, columnName: string, fileName: string): string {
        return `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}?filename=${fileName}`;
    }

    /**
     * Initialize an upload session
     */
    async initUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        fileName: string,
        fileSize: number,
        fileType: string = 'application/octet-stream'
    ): Promise<UploadInitResponse> {
        const response = await this.axios.post<UploadInitResponse>(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?operation=init&filename=${fileName}`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
                    'X-File-Name': fileName,
                    'X-File-Size': fileSize.toString(),
                    'X-File-Type': fileType
                }
            }
        );
        return response.data;
    }

    /**
     * Upload a file with automatic method selection (streaming or presigned URL)
     */
    async uploadFile(
        typeName: string,
        resourceId: string,
        columnName: string,
        file: File | Blob,
        fileName?: string,
        options?: UploadOptions
    ): Promise<void> {
        const actualFileName = fileName || (file instanceof File ? file.name : 'upload');

        // Initialize upload
        const initResponse = await this.initUpload(
            typeName,
            resourceId,
            columnName,
            actualFileName,
            file.size,
            file.type
        );

        if ((initResponse.upload_type === 'presigned' || initResponse.presigned_url) && 
            (initResponse.presigned_data || initResponse.presigned_url)) {
            // Use presigned URL upload (S3, GCS, Azure)
            await this.uploadViaPresignedUrl(file, initResponse, options);
        } else {
            // Use streaming upload (through server)
            await this.uploadViaStreaming(
                typeName,
                resourceId,
                columnName,
                actualFileName,
                file,
                initResponse.upload_id,
                options
            );
        }

        // Mark upload as complete
        await this.completeUpload(typeName, resourceId, columnName, actualFileName, initResponse.upload_id, {
            size: file.size,
            type: file.type
        });
    }

    /**
     * Stream upload directly to server
     */
    private async uploadViaStreaming(
        typeName: string,
        resourceId: string,
        columnName: string,
        fileName: string,
        file: File | Blob,
        uploadId: string,
        options?: UploadOptions
    ): Promise<void> {
        const formData = new FormData();
        formData.append('file', file, fileName);

        await this.axios.put(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/${fileName}/upload?operation=stream&upload_id=${uploadId}&filename=${fileName}`,
            file,
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
                    'Content-Type': file.type || 'application/octet-stream'
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (options?.onProgress && progressEvent.total) {
                        const progress: ProgressEvent = {
                            loaded: progressEvent.loaded,
                            total: progressEvent.total,
                            percent: (progressEvent.loaded / progressEvent.total) * 100,
                            uploadId: uploadId
                        };
                        options.onProgress!(progress);
                    }
                }
            }
        );
    }

    /**
     * Upload via presigned URL (S3, GCS, Azure)
     */
    private async uploadViaPresignedUrl(
        file: File | Blob,
        initResponse: UploadInitResponse,
        options?: UploadOptions
    ): Promise<void> {
        // Check if we have presigned data structure or direct presigned URL
        const presignedData = initResponse.presigned_data;
        const directPresignedUrl = initResponse.presigned_url;
        const method = initResponse.method || presignedData?.method || 'PUT';
        const headers = initResponse.headers || presignedData?.headers || {};

        if (presignedData?.parts && presignedData.parts.length > 0) {
            // Multipart upload for large files
            await this.uploadMultipart(file, presignedData, initResponse.upload_id, options);
        } else {
            // Single upload - use direct presigned URL or from presigned_data
            const uploadUrl = directPresignedUrl || presignedData?.presigned_url;
            
            if (!uploadUrl) {
                throw new Error('No presigned URL found in response');
            }

            // Use axios with no authentication headers for presigned URLs
            const uploadAxios = axios.create();
            
            await uploadAxios.request({
                method: method,
                url: uploadUrl,
                data: file,
                headers: {
                    ...headers,
                    'Content-Type': file.type || 'application/octet-stream'
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (options?.onProgress && progressEvent.total) {
                        const progress: ProgressEvent = {
                            loaded: progressEvent.loaded,
                            total: progressEvent.total,
                            percent: (progressEvent.loaded / progressEvent.total) * 100,
                            uploadId: initResponse.upload_id
                        };
                        options.onProgress!(progress);
                    }
                }
            });
        }
    }

    /**
     * Handle multipart upload for large files
     */
    private async uploadMultipart(
        file: File | Blob,
        presignedData: any,
        uploadId: string,
        options?: UploadOptions
    ): Promise<void> {
        const chunkSize = options?.chunkSize || 5 * 1024 * 1024; // 5MB default
        const parts = presignedData.parts;
        let uploadedBytes = 0;
        const uploadedParts: Array<{part_number: number, etag: string}> = [];

        // Use separate axios instance without auth headers for S3
        const uploadAxios = axios.create();

        for (const part of parts) {
            const start = (part.part_number - 1) * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const response = await uploadAxios.put(part.presigned_url, chunk, {
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                    ...(part.headers || {})
                },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    if (options?.onProgress) {
                        const totalUploaded = uploadedBytes + progressEvent.loaded;
                        const progress: ProgressEvent = {
                            loaded: totalUploaded,
                            total: file.size,
                            percent: (totalUploaded / file.size) * 100,
                            uploadId: uploadId
                        };
                        options.onProgress!(progress);
                    }
                }
            });

            // Store ETag for completion
            const etag = response.headers['etag'] || response.headers['ETag'];
            if (etag) {
                uploadedParts.push({
                    part_number: part.part_number,
                    etag: etag.replace(/"/g, '') // Remove quotes from ETag
                });
            }

            uploadedBytes += (end - start);
        }

        // Complete multipart upload if endpoint is provided
        if (presignedData.complete_multipart_endpoint) {
            await this.axios.post(
                `${this.appConfig.getEndpoint()}${presignedData.complete_multipart_endpoint}`,
                {
                    upload_id: uploadId,
                    parts: uploadedParts
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
    }

    /**
     * Complete an upload session
     */
    private async completeUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        fileName: string,
        uploadId: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.axios.post(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?operation=complete&upload_id=${uploadId}&filename=${fileName}`,
            metadata || {},
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    /**
     * Upload multiple files to the same asset column
     */
    async uploadMultipleFiles(
        typeName: string,
        resourceId: string,
        columnName: string,
        files: FileList | File[],
        options?: UploadOptions
    ): Promise<void> {
        const fileArray = Array.from(files);

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            // Create a progress callback that includes file index
            const fileOptions: UploadOptions = {
                ...options,
                onProgress: options?.onProgress ? (progress) => {
                    options.onProgress!({
                        ...progress,
                        loaded: progress.loaded,
                        total: progress.total,
                        percent: progress.percent,
                        uploadId: `${progress.uploadId}_file_${i + 1}_of_${fileArray.length}`
                    });
                } : undefined
            };

            await this.uploadFile(
                typeName,
                resourceId,
                columnName,
                file,
                file.name,
                fileOptions
            );
        }
    }

    /**
     * Create a resumable upload session for large files
     */
    async createResumableUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        fileName: string,
        fileSize: number,
        fileType: string = 'application/octet-stream'
    ): Promise<string> {
        const initResponse = await this.initUpload(
            typeName,
            resourceId,
            columnName,
            fileName,
            fileSize,
            fileType
        );

        // Store upload session info in localStorage for resumption
        const sessionKey = `daptin_upload_${initResponse.upload_id}`;
        localStorage.setItem(sessionKey, JSON.stringify({
            typeName,
            resourceId,
            columnName,
            fileName,
            fileSize,
            fileType,
            uploadId: initResponse.upload_id,
            createdAt: new Date().toISOString()
        }));

        return initResponse.upload_id;
    }

    /**
     * Resume an interrupted upload
     */
    async resumeUpload(uploadId: string, file: File | Blob, options?: UploadOptions): Promise<void> {
        const sessionKey = `daptin_upload_${uploadId}`;
        const sessionData = localStorage.getItem(sessionKey);

        if (!sessionData) {
            throw new Error('Upload session not found');
        }

        const session = JSON.parse(sessionData);

        // Continue with streaming upload
        await this.uploadViaStreaming(
            session.typeName,
            session.resourceId,
            session.columnName,
            session.fileName,
            file,
            uploadId,
            options
        );

        // Complete and cleanup
        await this.completeUpload(
            session.typeName,
            session.resourceId,
            session.columnName,
            session.fileName,
            uploadId,
            {
                size: file.size,
                type: file.type
            }
        );

        localStorage.removeItem(sessionKey);
    }

    /**
     * Cancel an upload and cleanup
     */
    async cancelUpload(uploadId: string): Promise<void> {
        const sessionKey = `daptin_upload_${uploadId}`;
        localStorage.removeItem(sessionKey);

        // TODO: Add server-side cleanup endpoint if needed
    }
}

export default AssetManager;
