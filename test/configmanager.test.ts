import {ConfigManager} from '../lib/clients/configmanager';

describe('ConfigManager request shape', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test('deletes a config entry through DELETE /_config/{section}/{key}', async () => {
    const axios = jest.fn().mockResolvedValue({data: {deleted: true}});
    const configManager = new ConfigManager(appConfig as any, tokenGetter, axios as any);

    const result = await configManager.deleteConfig('theme', 'ui');

    expect(result).toEqual({deleted: true});
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/_config/ui/theme',
      headers: {
        Authorization: 'Bearer test-token'
      },
      method: 'DELETE'
    });
  });
});
