import {YjsManager} from '../lib/clients/yjsmanager';

describe('YjsManager', () => {
  test('builds a tokenized YJS websocket URL', () => {
    const yjsManager = new YjsManager(
      {getEndpoint: () => 'https://example.com'} as any,
      {getToken: () => 'token value'} as any
    );

    expect(yjsManager.url('doc name')).toBe('wss://example.com/yjs/doc%20name?token=token%20value');
  });
});
