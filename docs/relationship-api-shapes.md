# Daptin Relationship API Shapes

Captured: 2026-05-25

Source instance:

- Daptin binary: `/Users/artpar/go/bin/daptin`
- Base URL: `http://localhost:18081`
- Database: fresh sqlite database under `/tmp/daptin-js-client-shapes.G4ZxMn`
- Storage/cache/Olric: isolated temp paths and ports

The SDK relationship manager implementation is based on these live request and response shapes, not on mocked assumptions.

## Setup

The instance was booted with a fresh database, then a user was created through:

```http
POST /action/user_account/signup
POST /action/user_account/signin
```

The signin response returned a `client.store.set` action response containing the JWT token used for the authenticated probes.

The relation-bearing records used for probes were created through normal JSON:API endpoints:

```http
POST /api/credential
POST /api/cloud_store
POST /api/usergroup
```

## Fetch Related Records

Fetching a relationship uses the parent entity, parent reference id, and Daptin relation/FK key:

```http
GET /api/user_account/{user_account_reference_id}/usergroup_id?page%5Bsize%5D=5
Authorization: Bearer <token>
```

The response is JSON:API:

```json
{
  "data": [
    {
      "type": "usergroup",
      "id": "019e5d86-5909-7445-ba53-26c608b76212",
      "attributes": {
        "name": "sdk-shape-group",
        "reference_id": "019e5d86-5909-7445-ba53-26c608b76212",
        "relation_created_at": "2026-05-25T10:35:46.24935+05:30",
        "relation_reference_id": "019e5d86-588c-72b3-ad4e-fad81e0ff7f7",
        "relation_updated_at": "2026-05-25T10:35:46.24935+05:30"
      }
    }
  ]
}
```

Important: for this multi-value relation response, `data[].id` was the relation row reference id, while `data[].attributes.relation_reference_id` was the target `usergroup` reference id supplied in the PATCH payload.

## Set a Single Relation

Setting `cloud_store.credential_id` accepted a JSON:API relationship payload on the parent resource:

```http
PATCH /api/cloud_store/{cloud_store_reference_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "type": "cloud_store",
    "id": "019e5d86-5879-7cb5-87aa-d295583c8f8c",
    "relationships": {
      "credential_id": {
        "data": {
          "type": "credential",
          "id": "019e5d86-5865-7c2d-ab69-2a6304025068"
        }
      }
    }
  }
}
```

The response was JSON:API and preserved the updated relationship:

```json
{
  "data": {
    "type": "cloud_store",
    "id": "019e5d86-5879-7cb5-87aa-d295583c8f8c",
    "relationships": {
      "credential_id": {
        "data": {
          "type": "credential",
          "id": "019e5d86-5865-7c2d-ab69-2a6304025068"
        }
      }
    }
  }
}
```

## Replace Multi-Value Relations

Replacing `user_account.usergroup_id` accepted an array in the same parent PATCH shape:

```http
PATCH /api/user_account/{user_account_reference_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "type": "user_account",
    "id": "019e5d85-71c3-7e53-b4e5-9a046ca290dc",
    "relationships": {
      "usergroup_id": {
        "data": [
          {
            "type": "usergroup",
            "id": "019e5d86-588c-72b3-ad4e-fad81e0ff7f7"
          }
        ]
      }
    }
  }
}
```

The response included `attributes.usergroup_id` as the target ids:

```json
{
  "data": {
    "type": "user_account",
    "id": "019e5d85-71c3-7e53-b4e5-9a046ca290dc",
    "attributes": {
      "usergroup_id": [
        "019e5d86-588c-72b3-ad4e-fad81e0ff7f7"
      ]
    }
  }
}
```

Sending an empty array was accepted by the parent PATCH route and the immediate response omitted that relation from attributes:

```json
{
  "data": {
    "type": "user_account",
    "id": "019e5d85-71c3-7e53-b4e5-9a046ca290dc",
    "relationships": {
      "usergroup_id": {
        "data": []
      }
    }
  }
}
```

## Remove One Multi-Value Relation

The plain relation endpoint was not the removal endpoint:

```http
DELETE /api/user_account/{user_account_reference_id}/usergroup_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "type": "usergroup",
    "id": "019e5d86-588c-72b3-ad4e-fad81e0ff7f7"
  }
}
```

The response body was the admin HTML shell with `200 text/html; charset=UTF-8`, not JSON.

The verified remove shape uses Daptin's JSON:API relationship linkage route and an array payload:

```http
DELETE /api/sdk_book/{book_reference_id}/relationships/sdk_tag_id
Authorization: Bearer <token>
Content-Type: application/vnd.api+json

{
  "data": [
    {
      "type": "sdk_tag",
      "id": "019e5d8e-5f52-7eb1-932f-21f824e2e73e"
    }
  ]
}
```

The live response was `204` with no JSON body.

## Clear Single Relation

This PATCH shape was accepted with HTTP 200:

```json
{
  "data": {
    "type": "cloud_store",
    "id": "019e5d87-1adf-7d98-977b-5c9d87e70bf3",
    "relationships": {
      "credential_id": {
        "data": null
      }
    }
  }
}
```

On the tested `cloud_store.credential_id` relation, the response still contained the previous `credential_id`, and a follow-up fetch still returned the credential. The SDK can expose the null payload shape as `clear`, but completion should not claim that every nullable relation is cleared unless a specific runtime relation is verified.

## Error and Fallback Responses

An invalid target id on PATCH returned a JSON:API error:

```json
{
  "errors": [
    {
      "status": "500",
      "title": "sql: no rows in result set"
    }
  ]
}
```

An invalid relation route such as:

```http
GET /api/cloud_store/{cloud_store_reference_id}/not_a_relation
```

returned `200 text/html; charset=UTF-8` with the admin SPA shell, not a JSON:API error.

## SDK Implications

- Use `GET /api/{entity}/{reference_id}/{relation_key}` for fetch.
- Use `PATCH /api/{entity}/{reference_id}` with `data.relationships[relation_key].data` for set and replace.
- Use `PATCH` with `data: []` to clear the tested multi-value relation.
- Use `DELETE /api/{entity}/{reference_id}/relationships/{relation_key}` with `{"data":[target]}` to remove one multi-value relation target.
- Return `response.data` directly so callers can inspect Daptin metadata such as `relation_reference_id`.
- Omit the `Authorization` header when the token getter returns an empty token.
