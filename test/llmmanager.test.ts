import {LlmManager} from '../lib/clients/llmmanager';

describe('LlmManager request shape', () => {
  const appConfig = {getEndpoint: () => 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  test('lists OpenAI-compatible models', async () => {
    const axios = jest.fn().mockResolvedValue({data: {object: 'list', data: []}});
    const llmManager = new LlmManager(appConfig as any, tokenGetter, axios as any);

    await llmManager.listModels();

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/v1/models',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token'
      },
      data: undefined
    });
  });

  test('creates chat completions through /v1/chat/completions', async () => {
    const axios = jest.fn().mockResolvedValue({data: {id: 'chatcmpl-test'}});
    const llmManager = new LlmManager(appConfig as any, tokenGetter, axios as any);
    const body = {model: 'test-model', messages: [{role: 'user', content: 'hello'}]};

    await llmManager.createChatCompletion(body);

    expect(axios).toHaveBeenCalledWith({
      url: 'http://localhost:6336/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token'
      },
      data: body
    });
  });
});
