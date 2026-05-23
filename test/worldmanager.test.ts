import {WorldManager} from '../lib/clients/worldmanager';

describe('WorldManager loadModels error handling', () => {
  test('rejects when the world JSON:API request fails', async () => {
    const worldError = new Error('world request failed');
    const jsonApi = {
      define: jest.fn(),
      findAll: jest.fn().mockRejectedValue(worldError)
    };
    const axios = jest.fn().mockImplementation((url) => {
      const typeName = String(url).match(/\/jsmodel\/(.+)\.js/)![1];
      return Promise.resolve({
        status: 200,
        data: {
          Actions: [],
          StateMachines: [],
          IsStateMachineEnabled: false,
          ColumnModel: {
            id: {ColumnType: 'id'},
            reference_id: {ColumnType: 'label'},
            table_name: {ColumnType: 'label'}
          },
          TableName: typeName
        }
      });
    });
    const worldManager = new WorldManager(
      {getEndpoint: () => 'http://localhost:6336'} as any,
      {getToken: () => 'test-token'} as any,
      jsonApi,
      {addAllActions: jest.fn()} as any,
      axios as any
    );

    await expect(worldManager.loadModels(false)).rejects.toBe(worldError);
  });
});
