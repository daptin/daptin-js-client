import {AssetManager} from '../lib/clients/assetmanager';

describe('AssetManager URL helpers', () => {
  const appConfig = {getEndpoint: () => 'http://localhost:6336'};
  const tokenGetter = {getToken: jest.fn(() => 'test-token')};
  const axios = jest.fn();

  test('keeps positional getAssetUrl output compatible', () => {
    const assetManager = new AssetManager(appConfig, tokenGetter, axios as any);

    expect(assetManager.getAssetUrl('gallery_image', 'row-ref', 'file', 'cat.png'))
      .toBe('http://localhost:6336/asset/gallery_image/row-ref/file?filename=cat.png');
  });

  test('builds server-backed asset URL from typed options', () => {
    const assetManager = new AssetManager(appConfig, tokenGetter, axios as any);

    expect(assetManager.getAssetUrl({
      entity: 'gallery image',
      referenceId: 'row/ref',
      columnName: 'photo file',
      file: 'cat photo.png'
    })).toBe('http://localhost:6336/asset/gallery%20image/row%2Fref/photo%20file?file=cat+photo.png');
  });

  test('supports index and image processing query parameters', () => {
    const assetManager = new AssetManager(appConfig, tokenGetter, axios as any);

    expect(assetManager.getAssetDisplayUrl({
      entity: 'gallery_image',
      referenceId: 'row-ref',
      columnName: 'photo',
      index: 1,
      processImage: true,
      imageOptions: {
        resize: '200x200',
        grayscale: true
      },
      query: {
        ignored: undefined,
        empty: null,
        cache: false
      }
    })).toBe('http://localhost:6336/asset/gallery_image/row-ref/photo?index=1&processImage=true&resize=200x200&grayscale=true&cache=false');
  });

  test('accepts filename as an options-object alias for file', () => {
    const assetManager = new AssetManager(appConfig, tokenGetter, axios as any);

    expect(assetManager.getAssetDownloadUrl({
      entity: 'gallery_image',
      referenceId: 'row-ref',
      columnName: 'photo',
      filename: 'hero.jpg'
    })).toBe('http://localhost:6336/asset/gallery_image/row-ref/photo?file=hero.jpg');
  });
});
