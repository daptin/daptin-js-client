Daptin Client for JavaScript and TypeScript
=

[![NPM](https://nodei.co/npm/daptin-client.png)](https://npmjs.org/package/daptin-client)
![Node.js CI](https://github.com/daptin/daptin-js-client/workflows/Node.js%20CI/badge.svg)

Daptin Client for Node/JS/TS ecosystem which extends over the basic JSON API calls and allows you to execute Action APIs, handle user auth, and perform efficient file uploads with **S3 presigned URL support** for direct browser-to-S3 transfers.

## 🚀 New: S3 Presigned URL Support

The client now supports **direct S3 uploads** using presigned URLs, dramatically improving upload performance by bypassing your server:

- ✅ **Direct browser-to-S3 uploads** with presigned URLs
- ✅ **Automatic multipart uploads** for large files  
- ✅ **Real-time progress tracking** with callbacks
- ✅ **Multiple file uploads** with batch processing
- ✅ **Video streaming uploads** with chunked transfers (MP4, WebM)
- ✅ **Live recording and streaming** from webcam/microphone
- ✅ **Automatic method selection** (presigned URL or streaming)

```javascript
// Simple file upload with S3 presigned URLs
await client.assetManager.uploadFile(
    'user_profile', 'user-123', 'avatar', 
    file, file.name,
    {
        onProgress: (progress) => {
            console.log(`Upload: ${progress.percent.toFixed(1)}%`);
        }
    }
);
```

📖 **[Complete S3 Upload Guide](S3_PRESIGNED_URL_USAGE.md)**  
🎥 **[Video Streaming Upload Guide](VIDEO_STREAMING_UPLOAD_GUIDE.md)**


Checkout starter kit here: https://github.com/daptin/vue_typescript_starter_kit

Install
==

NPM
=== 

```bash
npm install daptin-client --save
```

Yarn
===

```bash
yarn add daptin-client
```

Usage
==


```js
import {DaptinClient} from 'daptin-client'

const daptinClient = new DaptinClient("http://localhost:6336", false);
daptinClient.worldManager.loadModels().then(function () {
  daptinClient.jsonApi.findAll("todo").then(function(res: any){
    console.log("all todos", res.data)
  })
})


```


Publish
==

```bash
npm adduser
npm publish
```
