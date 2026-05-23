import {RuntimeManager} from '../lib/clients/runtime_manager';

describe('RuntimeManager request shape', () => {
  const appConfig = {getEndpoint: () => 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  test('pings the Daptin health endpoint', async () => {
    const axios = jest.fn().mockResolvedValue({data: 'pong'});
    const runtimeManager = new RuntimeManager(appConfig as any, tokenGetter, axios as any);

    await expect(runtimeManager.ping()).resolves.toBe('pong');
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/ping',
      method: 'GET'
    });
  });

  test('fetches metadata endpoints with the current token', async () => {
    const axios = jest.fn().mockResolvedValue({data: {ok: true}});
    const runtimeManager = new RuntimeManager(appConfig as any, tokenGetter, axios as any);

    await runtimeManager.getStatistics();
    await runtimeManager.getOpenIdConfiguration();

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/statistics',
      method: 'GET',
      headers: {Authorization: 'Bearer test-token'}
    });
    expect(axios.mock.calls[1][0]).toMatchObject({
      url: 'http://localhost:6336/.well-known/openid-configuration',
      method: 'GET',
      headers: {Authorization: 'Bearer test-token'}
    });
  });
});
