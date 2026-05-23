import {ActionManager} from '../lib/clients/actionmanager';

describe('ActionManager request shape', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test('posts ordinary action attributes without changing the existing call shape', async () => {
    const axios = jest.fn().mockResolvedValue({data: [{ResponseType: 'ok'}]});
    const actionManager = new ActionManager(appConfig, tokenGetter, axios as any);

    const result = await actionManager.doAction('user_account', 'signin', {
      email: 'user@example.com',
      password: 'secret'
    });

    expect(result).toEqual([{ResponseType: 'ok'}]);
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/action/user_account/signin',
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token'
      },
      data: {
        attributes: {
          email: 'user@example.com',
          password: 'secret'
        }
      }
    });
  });

  test('omits Authorization when token is empty', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const emptyTokenGetter = {getToken: jest.fn(() => '')};
    const actionManager = new ActionManager(appConfig, emptyTokenGetter, axios as any);

    await actionManager.doAction('user_account', 'signup', {
      email: 'user@example.com'
    });

    expect(axios.mock.calls[0][0].headers).toEqual({});
  });

  test('omits Authorization when token is null or undefined', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const nullTokenManager = new ActionManager(appConfig, {getToken: () => null} as any, axios as any);
    const undefinedTokenManager = new ActionManager(appConfig, {getToken: () => undefined} as any, axios as any);

    await nullTokenManager.doAction('user_account', 'signin', {});
    await undefinedTokenManager.doAction('user_account', 'signin', {});

    expect(axios.mock.calls[0][0].headers).toEqual({});
    expect(axios.mock.calls[1][0].headers).toEqual({});
  });

  test('keeps instance ids in action attributes instead of query params', async () => {
    const axios = jest.fn().mockResolvedValue({data: [{ResponseType: 'client.notify'}]});
    const actionManager = new ActionManager(appConfig, tokenGetter, axios as any);

    await actionManager.doAction('cloud_store', 'create_folder', {
      cloud_store_id: 'store-ref-id',
      name: 'assets',
      path: ''
    });

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/cloud_store/create_folder',
      data: {
        attributes: {
          cloud_store_id: 'store-ref-id',
          name: 'assets',
          path: ''
        }
      }
    });
    expect(axios.mock.calls[0][0].url).not.toContain('?');
  });

  test('supports optional action query params without changing attributes', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const actionManager = new ActionManager(appConfig, tokenGetter, axios as any);

    await actionManager.doAction('cloud_store', 'create_folder', {
      name: 'assets'
    }, {
      query: {
        cloud_store_id: 'store-ref-id'
      }
    });

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/cloud_store/create_folder',
      params: {
        cloud_store_id: 'store-ref-id'
      },
      data: {
        attributes: {
          name: 'assets'
        }
      }
    });
  });

  test('can add an instance reference id to attributes', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const actionManager = new ActionManager(appConfig, tokenGetter, axios as any);

    await actionManager.doAction('site', 'list_files', {
      path: '/'
    }, {
      referenceId: 'site-ref-id'
    });

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/site/list_files',
      data: {
        attributes: {
          site_id: 'site-ref-id',
          path: '/'
        }
      }
    });
  });
});
