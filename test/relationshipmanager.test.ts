import {RelationshipManager} from '../lib/clients/relationshipmanager';

describe('RelationshipManager request shape', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test('fetches related resources through the Daptin relation endpoint', async () => {
    const response = {
      data: [{
        type: 'usergroup',
        id: 'relation-row-ref',
        attributes: {
          relation_reference_id: 'target-usergroup-ref'
        }
      }]
    };
    const axios = jest.fn().mockResolvedValue({data: response});
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    const result = await relationshipManager.fetch('user_account', 'user-ref', 'usergroup_id', {
      'page[size]': 5
    });

    expect(result).toEqual(response);
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/user_account/user-ref/usergroup_id',
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: {
        'page[size]': 5
      },
      data: undefined
    });
  });

  test('sets a single relationship through a parent PATCH payload', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: {type: 'cloud_store'}}});
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    await relationshipManager.set('cloud_store', 'store-ref', 'credential_id', {
      type: 'credential',
      id: 'credential-ref'
    });

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/cloud_store/store-ref',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: undefined,
      data: {
        data: {
          type: 'cloud_store',
          id: 'store-ref',
          relationships: {
            credential_id: {
              data: {
                type: 'credential',
                id: 'credential-ref'
              }
            }
          }
        }
      }
    });
  });

  test('sets many relationship targets through an array payload', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: {attributes: {usergroup_id: ['group-ref']}}}});
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    await relationshipManager.setMany('user_account', 'user-ref', 'usergroup_id', [
      {type: 'usergroup', id: 'group-ref'},
      {type: 'usergroup', id: 'group-two-ref'}
    ]);

    expect(axios.mock.calls[0][0].data).toEqual({
      data: {
        type: 'user_account',
        id: 'user-ref',
        relationships: {
          usergroup_id: {
            data: [
              {type: 'usergroup', id: 'group-ref'},
              {type: 'usergroup', id: 'group-two-ref'}
            ]
          }
        }
      }
    });
  });

  test('clears through a null relationship payload', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: {type: 'cloud_store'}}});
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    await relationshipManager.clear('cloud_store', 'store-ref', 'credential_id');

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/api/cloud_store/store-ref',
      method: 'PATCH',
      data: {
        data: {
          relationships: {
            credential_id: {
              data: null
            }
          }
        }
      }
    });
  });

  test('removes one relationship target through the Daptin relationships route', async () => {
    const axios = jest.fn().mockResolvedValue({data: ''});
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    const result = await relationshipManager.remove('user_account', 'user-ref', 'usergroup_id', 'group-ref', {
      type: 'usergroup'
    });

    expect(result).toBe('');
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/user_account/user-ref/relationships/usergroup_id',
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: undefined,
      data: {
        data: [
          {
            type: 'usergroup',
            id: 'group-ref'
          }
        ]
      }
    });
  });

  test('omits Authorization when token is absent', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: []}});
    const relationshipManager = new RelationshipManager(appConfig as any, {getToken: () => ''}, axios as any);

    await relationshipManager.fetch('cloud_store', 'store-ref', 'credential_id');

    expect(axios.mock.calls[0][0].headers).toEqual({});
  });

  test('requires a type when string target ids are used', async () => {
    const axios = jest.fn();
    const relationshipManager = new RelationshipManager(appConfig as any, tokenGetter, axios as any);

    expect(() => relationshipManager.set('cloud_store', 'store-ref', 'credential_id', 'credential-ref')).toThrow(
      'Relationship target type is required'
    );
    expect(axios).not.toHaveBeenCalled();
  });
});
