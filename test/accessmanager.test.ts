import {
  AccessManager,
  addPermission,
  decodePermission,
  DaptinPermissionFlags,
  DaptinPermissionSets,
  hasPermission,
  removePermission,
  summarizePermission
} from '../lib/clients/accessmanager';

describe('AccessManager permission helpers', () => {
  test('exports Daptin backend permission bit values', () => {
    expect(DaptinPermissionFlags.GuestPeek).toBe(1);
    expect(DaptinPermissionFlags.GuestRead).toBe(2);
    expect(DaptinPermissionFlags.UserRead).toBe(256);
    expect(DaptinPermissionFlags.GroupRead).toBe(32768);
    expect(DaptinPermissionFlags.GroupUpdate).toBe(131072);
    expect(DaptinPermissionSets.Default).toBe(561441);
    expect(DaptinPermissionSets.AllowAll).toBe(2097151);
  });

  test('adds removes decodes and summarizes permission bits', () => {
    const readWrite = addPermission(DaptinPermissionFlags.GroupRead, DaptinPermissionFlags.GroupUpdate);

    expect(hasPermission(readWrite, DaptinPermissionFlags.GroupRead)).toBe(true);
    expect(hasPermission(readWrite, DaptinPermissionFlags.GroupDelete)).toBe(false);
    expect(removePermission(readWrite, DaptinPermissionFlags.GroupRead)).toBe(DaptinPermissionFlags.GroupUpdate);
    expect(decodePermission(readWrite).group.update).toBe(true);
    expect(summarizePermission(readWrite)).toEqual([
      {scope: 'group', action: 'read', flag: DaptinPermissionFlags.GroupRead},
      {scope: 'group', action: 'update', flag: DaptinPermissionFlags.GroupUpdate}
    ]);
  });
});

describe('AccessManager object usergroup helpers', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test('fetches object usergroups and normalizes relation and group reference ids', async () => {
    const response = {
      data: [{
        type: 'usergroup',
        id: 'relation-row-ref',
        attributes: {
          name: 'Editors',
          permission: 32768,
          reference_id: 'relation-row-ref',
          relation_reference_id: 'target-usergroup-ref',
          relation_created_at: '2026-05-25T10:35:46+05:30',
          relation_updated_at: '2026-05-25T10:36:46+05:30'
        }
      }],
      meta: {total: 1}
    };
    const axios = jest.fn().mockResolvedValue({data: response});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    const result = await accessManager.listObjectUsergroups('template', 'template-ref', {
      'page[size]': 10,
      'page[number]': 1
    });

    expect(result.data[0]).toMatchObject({
      type: 'usergroup',
      relationReferenceId: 'relation-row-ref',
      groupReferenceId: 'target-usergroup-ref',
      permission: 32768,
      relationCreatedAt: '2026-05-25T10:35:46+05:30',
      relationUpdatedAt: '2026-05-25T10:36:46+05:30',
      group: {
        id: 'target-usergroup-ref',
        reference_id: 'target-usergroup-ref',
        name: 'Editors'
      }
    });
    expect(result.raw).toBe(response);
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/template/template-ref/usergroup_id',
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: {
        'page[size]': 10,
        'page[number]': 1
      },
      data: undefined
    });
  });

  test('adds an object usergroup relation through the parent relationship payload', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: {type: 'template'}}});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    await accessManager.addObjectUsergroup('template', 'template-ref', 'group-ref');

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/template/template-ref',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: undefined,
      data: {
        data: {
          type: 'template',
          id: 'template-ref',
          relationships: {
            usergroup_id: {
              data: [{type: 'usergroup', id: 'group-ref'}]
            }
          }
        }
      }
    });
  });

  test('removes an object usergroup relation through the relationship linkage route', async () => {
    const axios = jest.fn().mockResolvedValue({data: ''});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    await accessManager.removeObjectUsergroup('template', 'template-ref', 'group-ref');

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/api/template/template-ref/relationships/usergroup_id',
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: undefined,
      data: {
        data: [{type: 'usergroup', id: 'group-ref'}]
      }
    });
  });

  test('updates object usergroup permission by resolving the group to a relation row', async () => {
    const listResponse = {
      data: [{
        type: 'usergroup',
        id: 'relation-row-ref',
        attributes: {
          permission: 2097151,
          reference_id: 'relation-row-ref',
          relation_reference_id: 'group-ref'
        }
      }]
    };
    const patchResponse = {data: {type: 'template_template_id_has_usergroup_usergroup_id'}};
    const axios = jest.fn()
      .mockResolvedValueOnce({data: listResponse})
      .mockResolvedValueOnce({data: patchResponse});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    const result = await accessManager.updateObjectUsergroupPermission(
      'template',
      'template-ref',
      'group-ref',
      DaptinPermissionFlags.GroupUpdate
    );

    expect(result).toBe(patchResponse);
    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/api/template/template-ref/usergroup_id',
      method: 'GET',
      params: {'page[size]': 1000}
    });
    expect(axios.mock.calls[1][0]).toEqual({
      url: 'http://localhost:6336/api/template_template_id_has_usergroup_usergroup_id/relation-row-ref',
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-token'
      },
      params: undefined,
      data: {
        data: {
          type: 'template_template_id_has_usergroup_usergroup_id',
          id: 'relation-row-ref',
          attributes: {
            permission: DaptinPermissionFlags.GroupUpdate
          }
        }
      }
    });
  });

  test('updates object usergroup permission when the relation row id is already known', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: {id: 'relation-row-ref'}}});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    await accessManager.updateObjectUsergroupRelationPermission('template', 'relation-row-ref', DaptinPermissionFlags.GroupRead);

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/api/template_template_id_has_usergroup_usergroup_id/relation-row-ref',
      method: 'PATCH',
      data: {
        data: {
          type: 'template_template_id_has_usergroup_usergroup_id',
          id: 'relation-row-ref',
          attributes: {
            permission: DaptinPermissionFlags.GroupRead
          }
        }
      }
    });
  });

  test('throws when a group relation cannot be found for permission update', async () => {
    const axios = jest.fn().mockResolvedValue({data: {data: []}});
    const accessManager = new AccessManager(appConfig as any, tokenGetter, axios as any);

    await expect(accessManager.updateObjectUsergroupPermission(
      'template',
      'template-ref',
      'missing-group-ref',
      DaptinPermissionFlags.GroupRead
    )).rejects.toThrow('Usergroup relation not found');
    expect(axios).toHaveBeenCalledTimes(1);
  });
});
