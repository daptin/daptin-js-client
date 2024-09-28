Daptin Client for JavaScript and TypeScript
=

[![NPM](https://nodei.co/npm/daptin-client.png)](https://npmjs.org/package/daptin-client)
![Node.js CI](https://github.com/daptin/daptin-js-client/workflows/Node.js%20CI/badge.svg)

Daptin Client for Node/JS/TS ecosystem which extends over the basic JSON API calls and allowes you to execute Action APIs as well handling user auth configurably using a tokenGetter.


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
