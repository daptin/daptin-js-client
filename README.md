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

TypeScript APIs
==

The package exports reusable Daptin entity, JSON:API, schema, action, and system-table contracts. Custom app rows can extend `DaptinEntity<T>`, while built-in Daptin tables have named interfaces.

```ts
import type {
  DaptinActionResponse,
  DaptinCloudStoreEntity,
  DaptinEntity,
  DaptinSiteEntity,
  DaptinTableInfo,
  DaptinWorldEntity
} from 'daptin-client';

interface ProductFields {
  name: string;
  photo?: Array<{name?: string; path?: string; type?: string}>;
}

type Product = DaptinEntity<ProductFields>;

const products = await daptinClient.jsonApi.findAll<ProductFields>('product');
const firstProduct = products.data[0] as Product;
const productName = firstProduct.name;

const worlds: Record<string, DaptinWorldEntity> = daptinClient.worldManager.getWorlds();
const site: DaptinSiteEntity | undefined = undefined;
const cloudStore: DaptinCloudStoreEntity | undefined = undefined;

const response: DaptinActionResponse = await daptinClient.actionManager.doAction(
  'user_account',
  'signin',
  {email: 'user@example.com', password: 'password'}
);

const tableInfo: DaptinTableInfo | undefined = undefined;
```

Action APIs
==

Use `actionManager.doAction(type, actionName, attributes)` to call Daptin actions. For instance-scoped actions, pass the instance reference id in the attributes using the `{type}_id` field expected by Daptin.

```js
// Guest actions omit Authorization when no token is available.
await daptinClient.actionManager.doAction('user_account', 'signin', {
  email: 'user@example.com',
  password: 'password'
});

// Instance-scoped cloud_store action
await daptinClient.actionManager.doAction('cloud_store', 'create_folder', {
  cloud_store_id: storeId,
  name: 'assets',
  path: ''
});

// Equivalent helper form for an instance id
await daptinClient.actionManager.doAction('cloud_store', 'create_folder', {
  name: 'assets',
  path: ''
}, {
  referenceId: storeId
});

await daptinClient.actionManager.doAction('cloud_store', 'upload_file', {
  cloud_store_id: storeId,
  path: '',
  file: [{
    name: 'file.txt',
    file: 'data:text/plain;base64,...',
    type: 'text/plain'
  }]
});

// Instance-scoped site actions use site_id in the same attributes object.
await daptinClient.actionManager.doAction('site', 'list_files', {
  site_id: siteId,
  path: '/'
});
```

Asset URLs
==

Asset columns are the fronting API for files stored behind a `cloud_store`. The
options-object URL helper uses Daptin's asset route query names (`file`, `index`,
and `processImage`) and URL-encodes path/query values.

```ts
const displayUrl = daptinClient.assetManager.getAssetUrl({
  entity: 'gallery_image',
  referenceId: imageId,
  columnName: 'photo',
  file: 'hero.png'
});

const processedUrl = daptinClient.assetManager.getAssetDisplayUrl({
  entity: 'gallery_image',
  referenceId: imageId,
  columnName: 'photo',
  index: 0,
  processImage: true,
  imageOptions: {
    resize: '320x320',
    grayscale: true
  }
});
```

The existing positional call remains available for compatibility:

```ts
daptinClient.assetManager.getAssetUrl('gallery_image', imageId, 'photo', 'hero.png');
```

Storage And Site File APIs
==

`cloud_store` is backing storage. User-facing file access is normally fronted by
asset columns or sites. The SDK exposes typed wrappers only for Daptin actions
that exist on the server.

```ts
await daptinClient.storageManager.cloudStore.createFolder(cloudStoreId, {
  path: '',
  name: 'uploads'
});

await daptinClient.storageManager.cloudStore.uploadFile(cloudStoreId, {
  path: 'uploads',
  file: {
    name: 'hello.txt',
    file: 'SGVsbG8=',
    type: 'text/plain'
  }
});

await daptinClient.storageManager.site.syncStorage(siteId, {path: ''});
const files = await daptinClient.storageManager.site.listFiles(siteId, {path: '/'});
const file = await daptinClient.storageManager.site.getFile(siteId, {path: 'index.html'});
await daptinClient.storageManager.site.deleteFile(siteId, {path: 'old.html'});
```

There is intentionally no `site.uploadFile` helper. Daptin does not expose a
first-class `site/upload_file` action; upload through an asset column or through
a cloud-store-backed workflow, then sync the site storage.

Config APIs
==

```js
await daptinClient.configManager.setConfig('theme', 'ui', {mode: 'dark'});
await daptinClient.configManager.getConfig('theme', 'ui');
await daptinClient.configManager.deleteConfig('theme', 'ui');
```

Relationship APIs
==

Daptin relationship helpers use relation/FK keys such as `credential_id`, `usergroup_id`, `cloud_store_id`, and `mail_server_id`. Pass those keys directly; do not pass join-table names or display labels.

```js
// Fetch related records with GET /api/{entity}/{reference_id}/{relation_key}
const groups = await daptinClient.relationshipManager.fetch(
  'user_account',
  userId,
  'usergroup_id',
  {'page[size]': 10}
);

// Link a single relation with PATCH /api/{entity}/{reference_id}
await daptinClient.relationshipManager.set(
  'cloud_store',
  storeId,
  'credential_id',
  {type: 'credential', id: credentialId}
);

// Clear using the JSON:API null relationship payload. Verify the target
// relation supports clearing in your Daptin schema.
await daptinClient.relationshipManager.clear(
  'cloud_store',
  storeId,
  'credential_id'
);

// Replace a multi-value relation.
await daptinClient.relationshipManager.setMany(
  'user_account',
  userId,
  'usergroup_id',
  [
    {type: 'usergroup', id: groupId},
    {type: 'usergroup', id: anotherGroupId}
  ]
);

// Remove one multi-value relation target.
await daptinClient.relationshipManager.remove(
  'user_account',
  userId,
  'usergroup_id',
  {type: 'usergroup', id: groupId}
);

// Relation endpoint responses can include Daptin relation metadata.
const targetId = groups.data[0].attributes.relation_reference_id;
```

Integration APIs
==

Provider-scoped integration APIs are available through `integrationManager` once an integration is installed in Daptin.

```js
const operations = await daptinClient.integrationManager.listOperations('github.com');
const operation = await daptinClient.integrationManager.describeOperation('github.com', 'repos/get');
const openapi = await daptinClient.integrationManager.getOpenApi('github.com');

const result = await daptinClient.integrationManager.execute('github.com', 'repos/get', {
  oauth_token_id: oauthTokenId,
  input: {
    owner: 'daptin',
    repo: 'daptin'
  }
});
```

Runtime APIs
==

```js
await daptinClient.runtimeManager.ping();
await daptinClient.runtimeManager.getStatistics();
await daptinClient.runtimeManager.getOpenApi();
await daptinClient.runtimeManager.getOpenIdConfiguration();
await daptinClient.runtimeManager.checkLive();
```

LLM APIs
==

OpenAI-compatible Daptin endpoints are available through `llmManager`.

```js
await daptinClient.llmManager.listModels();
await daptinClient.llmManager.createChatCompletion({
  model: 'gpt-4.1-mini',
  messages: [{role: 'user', content: 'Hello'}]
});
await daptinClient.llmManager.createCompletion({
  model: 'gpt-4.1-mini',
  prompt: 'Hello'
});
await daptinClient.llmManager.createEmbedding({
  model: 'text-embedding-3-small',
  input: 'Hello'
});

// Diagnostic variants preserve HTTP response metadata.
const diagnostic = await daptinClient.llmManager.createChatCompletionResponse({
  model: 'gpt-4.1-mini',
  messages: [{role: 'user', content: 'Hello'}]
});
console.log(diagnostic.status, diagnostic.headers, diagnostic.data);
```

GraphQL APIs
==

```js
const response = await daptinClient.graphqlManager.execute(
  'query CurrentType { __typename }'
);
```

YJS APIs
==

```js
const yjsUrl = daptinClient.yjsManager.url('document-name');
const socket = daptinClient.yjsManager.connect('document-name', {
  onOpen: () => console.log('connected')
});
```

State Machine APIs
==

```js
const started = await daptinClient.stateMachineManager.start(stateMachineId, {
  typeName: 'document',
  referenceId: documentId
});

const transitioned = await daptinClient.stateMachineManager.event(
  'document',
  started.data.reference_id,
  'approve',
  {comment: 'Looks good'}
);
```

Feed APIs
==

```js
const rss = await daptinClient.feedManager.getRss('updates');
const atom = await daptinClient.feedManager.getAtom('updates');
const json = await daptinClient.feedManager.getJson('updates');

const preview = await daptinClient.feedManager.preview('updates', 'rss');
console.log(preview.contentType, preview.body);
```

Live APIs
==

```js
const live = daptinClient.liveManager.connect({
  onMessage: (message) => console.log(message)
});

await live.createTopic('dashboard-updates');
await live.subscribe('dashboard-updates');
await live.publish('dashboard-updates', {message: 'hello'});
await live.unsubscribe('dashboard-updates');
await live.destroyTopic('dashboard-updates');

// The manager also delegates to the active connection.
await daptinClient.liveManager.getTopicPermission('dashboard-updates');
```


Publish
==

```bash
npm adduser
npm publish
```
