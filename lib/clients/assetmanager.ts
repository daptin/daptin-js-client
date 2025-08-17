/**
 * Asset upload manager for Daptin
 * Handles streaming uploads, presigned URLs, and progress tracking
 */
import axios, {AxiosInstance, Method} from "axios"
import {AppConfigProvider, TokenGetter} from "./interface";

export interface UploadOptions {
    onProgress?: (progress: ProgressEvent) => void;
    chunkSize?: number;
    metadata?: Record<string, any>;
}

export interface UploadInitResponse {
    upload_id: string;
    upload_type: 'stream' | 'presigned' | 'multipart';
    
    // For regular presigned uploads
    presigned_data?: {
        upload_type: string;
        presigned_url: string;
        method: string;
        headers?: Record<string, string>;
        expires_at: number;
    };
    
    // For multipart uploads
    s3_upload_id?: string;
    min_part_size?: number;
    max_parts?: number;
    get_part_url?: string;
    abort_url?: string;
    
    // Common
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
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?filename=${fileName}`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
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

        switch (initResponse.upload_type) {
            case 'multipart':
                // Handle S3 multipart upload for large files
                await this.uploadViaMultipart(
                    typeName,
                    resourceId,
                    columnName,
                    actualFileName,
                    file,
                    initResponse,
                    options
                );
                break;
                
            case 'presigned':
                // Handle regular presigned URL upload
                await this.uploadViaPresignedUrl(file, initResponse, options);
                // Complete the upload
                await this.completeUpload(
                    typeName, resourceId, columnName, 
                    initResponse.upload_id, 
                    { size: file.size, type: file.type, fileName: actualFileName }
                );
                break;
                
            case 'stream':
            default:
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
                // Complete the upload
                await this.completeUpload(
                    typeName, resourceId, columnName,
                    initResponse.upload_id,
                    { size: file.size, type: file.type, fileName: actualFileName }
                );
                break;
        }
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
                onUploadProgress: (progressEvent: any) => {
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
     * Upload via presigned URL (regular S3, GCS, Azure single upload)
     */
    private async uploadViaPresignedUrl(
        file: File | Blob,
        initResponse: UploadInitResponse,
        options?: UploadOptions
    ): Promise<void> {
        const presignedData = initResponse.presigned_data;
        
        if (!presignedData?.presigned_url) {
            throw new Error('No presigned URL found in response');
        }

        const method = (presignedData.method || 'PUT') as Method;
        const headers = presignedData.headers || {};

        // Use axios with no authentication headers for presigned URLs
        const uploadAxios = axios.create();

        await uploadAxios.request({
            method: method,
            url: presignedData.presigned_url,
            data: file,
            headers: {
                ...headers,
                'Content-Type': file.type || 'application/octet-stream'
            },
            onUploadProgress: (progressEvent) => {
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

    /**
     * Upload via S3 multipart for large files
     */
    private async uploadViaMultipart(
        typeName: string,
        resourceId: string,
        columnName: string,
        fileName: string,
        file: File | Blob,
        initResponse: UploadInitResponse,
        options?: UploadOptions
    ): Promise<void> {
        if (!initResponse.s3_upload_id) {
            throw new Error('No S3 upload ID found for multipart upload');
        }

        const minPartSize = initResponse.min_part_size || (5 * 1024 * 1024); // 5MB default
        const maxParts = initResponse.max_parts || 10000;
        
        // Calculate optimal part size
        const partSize = Math.max(minPartSize, Math.ceil(file.size / maxParts));
        const parts: Array<{part_number: number, etag: string}> = [];
        
        // Upload parts
        let uploadedBytes = 0;
        const uploadAxios = axios.create(); // No auth headers for S3 presigned URLs
        
        for (let i = 0; i < file.size; i += partSize) {
            const partNumber = Math.floor(i / partSize) + 1;
            const start = i;
            const end = Math.min(i + partSize, file.size);
            const chunk = file.slice(start, end);
            
            // Get presigned URL for this part
            const partUrlResponse = await this.axios.get<{presigned_url: string, part_number: number}>(
                `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?` +
                `upload_id=${initResponse.s3_upload_id}&filename=${fileName}&part_number=${partNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.tokenGetter.getToken()}`
                    }
                }
            );
            
            // Upload the part to S3
            const uploadResponse = await uploadAxios.put(partUrlResponse.data.presigned_url, chunk, {
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                onUploadProgress: (progressEvent) => {
                    if (options?.onProgress && progressEvent.total) {
                        const totalProgress = uploadedBytes + progressEvent.loaded;
                        const progress: ProgressEvent = {
                            loaded: totalProgress,
                            total: file.size,
                            percent: (totalProgress / file.size) * 100,
                            uploadId: initResponse.upload_id
                        };
                        options.onProgress!(progress);
                    }
                }
            });
            
            // Collect ETag for completion
            const etag = uploadResponse.headers['etag'];
            if (!etag) {
                throw new Error(`No ETag received for part ${partNumber}`);
            }
            
            parts.push({
                part_number: partNumber,
                etag: etag
            });
            
            uploadedBytes += chunk.size;
        }
        
        // Complete multipart upload
        await this.completeMultipartUpload(
            typeName, resourceId, columnName,
            initResponse.upload_id,
            initResponse.s3_upload_id,
            parts,
            fileName,
            file.size
        );
    }

    /**
     * Complete a regular upload session
     */
    private async completeUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        uploadId: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.axios.post(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?operation=complete&upload_id=${uploadId}`,
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
     * Complete a multipart upload session
     */
    private async completeMultipartUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        uploadId: string,
        s3UploadId: string,
        parts: Array<{part_number: number, etag: string}>,
        fileName: string,
        fileSize: number
    ): Promise<void> {
        await this.axios.post(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?operation=complete&upload_id=${uploadId}`,
            {
                s3_upload_id: s3UploadId,
                parts: parts,
                fileName: fileName,
                size: fileSize
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    /**
     * Abort a multipart upload
     */
    async abortMultipartUpload(
        typeName: string,
        resourceId: string,
        columnName: string,
        s3UploadId: string,
        fileName: string
    ): Promise<void> {
        await this.axios.delete(
            `${this.appConfig.getEndpoint()}/asset/${typeName}/${resourceId}/${columnName}/upload?upload_id=${s3UploadId}&filename=${fileName}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.tokenGetter.getToken()}`
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
            uploadId,
            {
                size: file.size,
                type: file.type,
                fileName: session.fileName
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
