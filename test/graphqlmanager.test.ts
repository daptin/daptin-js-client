import {GraphqlManager} from '../lib/clients/graphqlmanager';

describe('GraphqlManager request shape', () => {
  const appConfig = {getEndpoint: () => 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  test('posts GraphQL and preserves response data including GraphQL errors', async () => {
    const graphqlResponse = {data: null, errors: [{message: 'field error'}]};
    const axios = jest.fn().mockResolvedValue({data: graphqlResponse});
    const graphqlManager = new GraphqlManager(appConfig as any, tokenGetter, axios as any);

    await expect(graphqlManager.execute('{ world { id } }')).resolves.toEqual(graphqlResponse);
    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token'
      },
      data: {
        query: '{ world { id } }',
        variables: undefined,
        operationName: undefined
      }
    });
  });
});
