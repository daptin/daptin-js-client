import {ActionManager} from '../lib/clients/actionmanager';
import {StorageManager} from '../lib/clients/storagemanager';

describe('StorageManager action wrappers', () => {
  const appConfig = {endpoint: 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};

  test('delegates cloud store folder creation with a reference id', async () => {
    const axios = jest.fn().mockResolvedValue({data: [{ResponseType: 'client.notify'}]});
    const storageManager = new StorageManager(new ActionManager(appConfig, tokenGetter, axios as any));

    await storageManager.cloudStore.createFolder('store-ref', {
      path: '/assets',
      name: 'images'
    });

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/cloud_store/create_folder',
      data: {
        attributes: {
          cloud_store_id: 'store-ref',
          path: '/assets',
          name: 'images'
        }
      }
    });
  });

  test('normalizes a single cloud store upload file into Daptin file array shape', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const storageManager = new StorageManager(new ActionManager(appConfig, tokenGetter, axios as any));

    await storageManager.cloudStore.uploadFile('store-ref', {
      path: '/',
      file: {
        name: 'file.txt',
        file: 'data:text/plain;base64,SGVsbG8=',
        type: 'text/plain'
      }
    });

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/cloud_store/upload_file',
      data: {
        attributes: {
          cloud_store_id: 'store-ref',
          path: '/',
          file: [{
            name: 'file.txt',
            file: 'data:text/plain;base64,SGVsbG8=',
            type: 'text/plain'
          }]
        }
      }
    });
  });

  test('maps cloud store createSite siteType to site_type', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const storageManager = new StorageManager(new ActionManager(appConfig, tokenGetter, axios as any));

    await storageManager.cloudStore.createSite('store-ref', {
      hostname: 'site.localhost',
      path: '/public',
      siteType: 'html'
    });

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/cloud_store/create_site',
      data: {
        attributes: {
          cloud_store_id: 'store-ref',
          hostname: 'site.localhost',
          path: '/public',
          site_type: 'html'
        }
      }
    });
  });

  test('delegates site file actions with site reference id', async () => {
    const axios = jest.fn().mockResolvedValue({data: []});
    const storageManager = new StorageManager(new ActionManager(appConfig, tokenGetter, axios as any));

    await storageManager.site.listFiles('site-ref', {path: '/'});
    await storageManager.site.getFile('site-ref', {path: '/index.html'});
    await storageManager.site.deleteFile('site-ref', {path: '/old.html'});
    await storageManager.site.syncStorage('site-ref');

    expect(axios.mock.calls[0][0]).toMatchObject({
      url: 'http://localhost:6336/action/site/list_files',
      data: {attributes: {site_id: 'site-ref', path: '/'}}
    });
    expect(axios.mock.calls[1][0]).toMatchObject({
      url: 'http://localhost:6336/action/site/get_file',
      data: {attributes: {site_id: 'site-ref', path: '/index.html'}}
    });
    expect(axios.mock.calls[2][0]).toMatchObject({
      url: 'http://localhost:6336/action/site/delete_file',
      data: {attributes: {site_id: 'site-ref', path: '/old.html'}}
    });
    expect(axios.mock.calls[3][0]).toMatchObject({
      url: 'http://localhost:6336/action/site/sync_site_storage',
      data: {attributes: {site_id: 'site-ref', path: ''}}
    });
  });
});
