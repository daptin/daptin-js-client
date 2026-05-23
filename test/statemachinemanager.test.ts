import {StateMachineManager} from '../lib/clients/statemachinemanager';

describe('StateMachineManager request shape', () => {
  const appConfig = {getEndpoint: () => 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  test('starts object tracking and returns status/body details', async () => {
    const axios = jest.fn().mockResolvedValue({status: 200, data: {ok: true}, headers: {server: 'daptin'}});
    const stateMachineManager = new StateMachineManager(appConfig as any, tokenGetter, axios as any);

    await expect(stateMachineManager.start('smd-ref', {
      typeName: 'ticket',
      referenceId: 'ticket-ref'
    })).resolves.toEqual({
      status: 200,
      data: {ok: true},
      headers: {server: 'daptin'}
    });

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/track/start/smd-ref',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token'
      },
      data: {
        typeName: 'ticket',
        referenceId: 'ticket-ref'
      }
    });
  });

  test('preserves transition error status and body', async () => {
    const axios = jest.fn().mockRejectedValue({
      response: {status: 400, data: {error: 'invalid transition'}, headers: {}}
    });
    const stateMachineManager = new StateMachineManager(appConfig as any, tokenGetter, axios as any);

    await expect(stateMachineManager.event('ticket', 'state-ref', 'close')).rejects.toEqual({
      status: 400,
      data: {error: 'invalid transition'},
      headers: {}
    });
  });
});
