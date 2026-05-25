# Daptin Storage, Site, And Asset API Shapes

Captured: 2026-05-25

Source instance:

- Daptin binary: `/Users/artpar/go/bin/daptin`
- Base URL: `http://localhost:18082`
- Database: fresh sqlite database under `/tmp/daptin-js-client-storage.xgJRl6`
- Storage/cache/Olric: isolated temp paths and ports

The SDK storage helpers are based on Daptin's actual action and asset route
shapes. `cloud_store` is backing storage; asset columns and sites are the
fronting APIs for file access.

## Cloud Store Backing Actions

The SDK calls Daptin actions with the selected record reference id in the
attributes through `ActionManager`'s `referenceId` option:

```http
POST /action/cloud_store/create_folder
Authorization: Bearer <token>

{
  "attributes": {
    "cloud_store_id": "{cloud_store_reference_id}",
    "path": "",
    "name": "sdk-folder"
  }
}
```

The live instance returned Daptin action responses:

```json
[
  {
    "ResponseType": "client.notify",
    "Attributes": {
      "message": "Cloud storage file upload queued",
      "title": "Success",
      "type": "success"
    }
  }
]
```

The same action response shape was returned for `cloud_store/upload_file`.
`cloud_store/move_path` returned `Cloud storage path moved`, and
`cloud_store/delete_path` returned `Cloud storage deletion queued`.

## Site File Actions

Site file actions require Daptin's runtime subsite cache to know about the site.
In the live probe, a direct `site` JSON:API row existed but `site/list_files`
failed until the Daptin instance was restarted and the enabled site was loaded
into the subsite cache.

After that registration, the SDK sent:

```http
POST /action/site/list_files
Authorization: Bearer <token>

{
  "attributes": {
    "site_id": "{site_reference_id}",
    "path": "/"
  }
}
```

The live response was:

```json
[
  {
    "ResponseType": "file",
    "Attributes": {
      "list": [
        {
          "is_dir": false,
          "mod_time": "2026-05-25T11:43:38.884265886+05:30",
          "name": "hello-site.txt",
          "size": 22
        }
      ]
    }
  }
]
```

`site/get_file` returned base64 file content:

```json
[
  {
    "ResponseType": "file",
    "Attributes": {
      "data": "aGVsbG8gZnJvbSBzaXRlIGNhY2hlCg=="
    }
  }
]
```

`site/sync_site_storage` returned:

```json
[
  {
    "ResponseType": "client.notify",
    "Attributes": {
      "message": "Cloud storage file upload queued",
      "title": "Success",
      "type": "success"
    }
  }
]
```

There is no first-class `site/upload_file` action in the inspected Daptin server
action declarations.

## Asset URLs

Daptin serves asset-column files through:

```http
GET /asset/{typename}/{resource_id}/{columnname}
GET /asset/{typename}/{resource_id}/{columnname}?file={file_name}
GET /asset/{typename}/{resource_id}/{columnname}?index={number}
GET /asset/{typename}/{resource_id}/{columnname}?file={file_name}&processImage=true&resize=100x100
```

The server route selects files from the `file` or `index` query values. Image
processing is enabled when `processImage=true`; other image operation query
parameters are passed through to Daptin's image processor.
