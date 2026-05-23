import {LiveManager} from "../lib/clients/livemanager";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  sent: string[] = [];
  onopen?: (event: Event) => void;
  onmessage?: (event: MessageEvent) => void;
  onerror?: (event: Event) => void;
  onclose?: (event: CloseEvent) => void;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(message: string) {
    this.sent.push(message);
  }

  close() {
  }

  open() {
    if (this.onopen) {
      this.onopen({} as Event);
    }
  }

  receive(message: any) {
    if (this.onmessage) {
      this.onmessage({data: JSON.stringify(message)} as MessageEvent);
    }
  }
}

describe("LiveManager", () => {
  const appConfig = {getEndpoint: () => "https://example.com"};
  const tokenGetter = {getToken: jest.fn(() => "token value")};
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    (global as any).WebSocket = FakeWebSocket;
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  test("builds tokenized /live websocket URLs", () => {
    const liveManager = new LiveManager(appConfig as any, tokenGetter);

    expect(liveManager.url()).toBe("wss://example.com/live?token=token%20value");
  });

  test("sends Daptin websocket method requests and resolves raw responses", async () => {
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const responsePromise = connection.createTopic("sdk-topic");
    await Promise.resolve();
    const sent = JSON.parse(socket.sent[0]);
    expect(sent.method).toBe("create-topicName");
    expect(sent.attributes).toEqual({name: "sdk-topic"});
    expect(sent.id).toBeTruthy();

    socket.receive({
      type: "response",
      id: sent.id,
      method: "create-topicName",
      ok: true,
      data: Buffer.from(JSON.stringify({topicName: "sdk-topic", created: true})).toString("base64")
    });

    await expect(responsePromise).resolves.toEqual({
      type: "response",
      id: sent.id,
      method: "create-topicName",
      ok: true,
      data: {topicName: "sdk-topic", created: true}
    });
  });

  test("delegates manager topic methods to active connection and preserves error responses", async () => {
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    liveManager.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const responsePromise = liveManager.subscribe("missing-topic");
    await Promise.resolve();
    const sent = JSON.parse(socket.sent[0]);

    socket.receive({
      type: "response",
      id: sent.id,
      method: "subscribe",
      ok: false,
      error: "topic not found: missing-topic"
    });

    await expect(responsePromise).rejects.toEqual({
      type: "response",
      id: sent.id,
      method: "subscribe",
      ok: false,
      error: "topic not found: missing-topic"
    });
  });

  test("publish sends new-message without waiting for a success response", async () => {
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const sentMessage = await connection.publish("sdk-topic", {text: "hello"});
    const sent = JSON.parse(socket.sent[0]);

    expect(sent.method).toBe("new-message");
    expect(sent.attributes).toEqual({
      topicName: "sdk-topic",
      message: {text: "hello"}
    });
    expect(sentMessage).toEqual({
      type: "request",
      id: sent.id,
      method: "new-message",
      data: {
        topicName: "sdk-topic",
        message: {text: "hello"}
      }
    });
  });
});
