import {FeedManager} from "../lib/clients/feedmanager";

describe("FeedManager", () => {
  const appConfig = {
    getEndpoint: jest.fn(() => "https://example.com")
  };
  const tokenGetter = {getToken: jest.fn(() => "test-token")};

  beforeEach(() => {
    tokenGetter.getToken.mockClear();
  });

  test("fetches RSS feed content", async () => {
    const axios = jest.fn().mockResolvedValue({
      headers: {"content-type": "application/xml"},
      data: "<rss></rss>"
    });
    const feedManager = new FeedManager(appConfig as any, tokenGetter, axios as any);

    await expect(feedManager.getRss("feed name")).resolves.toBe("<rss></rss>");
    expect(axios).toHaveBeenCalledWith({
      url: "https://example.com/feed/feed%20name.rss",
      method: "GET",
      headers: {Authorization: "Bearer test-token"}
    });
  });

  test("returns content type and body for previews", async () => {
    const axios = jest.fn().mockResolvedValue({
      headers: {"content-type": "application/json; charset=utf-8"},
      data: {items: []}
    });
    const feedManager = new FeedManager(appConfig as any, tokenGetter, axios as any);

    await expect(feedManager.preview("updates", "json")).resolves.toEqual({
      contentType: "application/json; charset=utf-8",
      body: {items: []}
    });
  });
});
