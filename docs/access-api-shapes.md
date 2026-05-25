# Daptin Access API Shapes

Captured: 2026-05-25

Source instance:

- Daptin binary: `/Users/artpar/go/bin/daptin`
- Base URL: `http://localhost:18085`
- Database: fresh sqlite database under `/tmp/daptin-js-client-access-sdk.dqa5j2`
- Storage/cache/Olric: isolated temp paths and ports

The SDK access manager implementation was smoke-tested against the built SDK
and this fresh Daptin instance.

## Permission Bits

Permission bit constants match Daptin backend `auth.AuthPermission` values:

| Scope | Peek | Read | Create | Update | Delete | Execute | Refer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Guest | 1 | 2 | 4 | 8 | 16 | 32 | 64 |
| User | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 |
| Group | 16384 | 32768 | 65536 | 131072 | 262144 | 524288 | 1048576 |

Backend aggregate values exposed by the SDK:

| Name | Value |
| --- | ---: |
| GuestCrud | 95 |
| UserCrud | 12160 |
| GroupCrud | 1556480 |
| Default | 561441 |
| AllowAll | 2097151 |

## Add Object Usergroup

Adding an object to a usergroup uses the parent resource PATCH shape. Daptin
creates or keeps the join row.

```http
PATCH /api/template/{template_reference_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "type": "template",
    "id": "{template_reference_id}",
    "relationships": {
      "usergroup_id": {
        "data": [
          {
            "type": "usergroup",
            "id": "{usergroup_reference_id}"
          }
        ]
      }
    }
  }
}
```

The live smoke added two usergroups to one `template` by calling this shape
twice through `DaptinClient.accessManager.addObjectUsergroup`.

## List Object Usergroups

Fetching object usergroups uses Daptin's relation endpoint and preserves caller
pagination/query params.

```http
GET /api/template/{template_reference_id}/usergroup_id?page[size]=10&page[number]=1
Authorization: Bearer <token>
```

The response rows use two different reference ids:

```json
{
  "data": [
    {
      "type": "usergroup",
      "id": "019e5e2a-e14b-72bf-8330-a09655fdb4ce",
      "attributes": {
        "name": "sdk-access-read-{suffix}",
        "permission": 2097151,
        "reference_id": "019e5e2a-e14b-72bf-8330-a09655fdb4ce",
        "relation_reference_id": "019e5e2a-e147-7b2f-8c40-b19954dc324c",
        "relation_created_at": "2026-05-25T13:35:29...",
        "relation_updated_at": "2026-05-25T13:35:29..."
      }
    }
  ]
}
```

Important:

- `data[].id` and `attributes.reference_id` are the relation row reference id.
- `attributes.relation_reference_id` is the target `usergroup` reference id.
- `attributes.permission` is the relation row permission for that group on that
  object.

The SDK normalizes this into `DaptinObjectUsergroupAccess` rows with explicit
`relationReferenceId`, `groupReferenceId`, `permission`, relation timestamps,
and a `group` object.

## Update Relation Permission

Permission updates use the generated join-table resource and the relation row
reference id, not the target group id.

```http
PATCH /api/template_template_id_has_usergroup_usergroup_id/{relation_reference_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "type": "template_template_id_has_usergroup_usergroup_id",
    "id": "{relation_reference_id}",
    "attributes": {
      "permission": 32768
    }
  }
}
```

Live smoke result for one `template` with two groups:

```json
{
  "permissions": {
    "019e5e2a-e147-7b2f-8c40-b19954dc324c": 32768,
    "019e5e2a-e149-756e-9939-37ed755430ee": 131072
  }
}
```

This validates that each group has a separate permission value on its relation
row. The SDK method `updateObjectUsergroupPermission(entity, objectId, groupId,
permission)` first lists the object's usergroups, resolves the matching
`groupReferenceId` to `relationReferenceId`, and patches the join-table row.

## Remove Object Usergroup

Removing one object/usergroup relation uses Daptin's relationship linkage route:

```http
DELETE /api/template/{template_reference_id}/relationships/usergroup_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": [
    {
      "type": "usergroup",
      "id": "{usergroup_reference_id}"
    }
  ]
}
```
