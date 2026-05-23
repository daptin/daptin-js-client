import {IntegrationManager} from '../lib/clients/integrationmanager';

describe('IntegrationManager request shape', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test('lists provider operations', async () => {
    const axios = jest.fn().mockResolvedValue({data: {operations: []}});
    const integrationManager = new IntegrationManager(appConfig as any, tokenGetter, axios as any);

    const result = await integrationManager.listOperations('github.com');

    expect(result).toEqual({operations: []});
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/integration/github.com/operations',
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token'
      },
      data: undefined
    });
  });

  test('describes an encoded provider operation', async () => {
    const axios = jest.fn().mockResolvedValue({data: {operation_id: 'repos/get'}});
    const integrationManager = new IntegrationManager(appConfig as any, tokenGetter, axios as any);

    await integrationManager.describeOperation('github.com', 'repos/get');

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/integration/github.com/operations/repos%2Fget',
      method: 'GET'
    });
  });

  test('fetches provider scoped openapi yaml', async () => {
    const axios = jest.fn().mockResolvedValue({data: 'openapi: 3.1.0'});
    const integrationManager = new IntegrationManager(appConfig as any, tokenGetter, axios as any);

    const result = await integrationManager.getOpenApi('github.com');

    expect(result).toBe('openapi: 3.1.0');
    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/integration/github.com/openapi.yaml',
      method: 'GET'
    });
  });

  test('executes provider operation with input and auth selectors', async () => {
    const axios = jest.fn().mockResolvedValue({data: [{ResponseType: 'ok'}]});
    const integrationManager = new IntegrationManager(appConfig as any, tokenGetter, axios as any);

    const body = {
      oauth_token_id: 'oauth-token-ref',
      input: {
        owner: 'daptin',
        repo: 'daptin'
      }
    };
    const result = await integrationManager.execute('github.com', 'repos/get', body);

    expect(result).toEqual([{ResponseType: 'ok'}]);
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/integration/github.com/repos%2Fget',
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token'
      },
      data: body
    });
  });
});
