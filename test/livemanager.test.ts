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
    if (this.onclose) {
      this.onclose({} as CloseEvent);
    }
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

  fail() {
    if (this.onerror) {
      this.onerror({} as Event);
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

  afterEach(() => {
    jest.useRealTimers();
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

  test("deadline-free requests remain pending until their response arrives", async () => {
    jest.useFakeTimers();
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect({timeoutMs: null});
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const responsePromise = connection.subscribe("slow-topic");
    await Promise.resolve();
    const sent = JSON.parse(socket.sent[0]);
    let settled = false;
    responsePromise.finally(() => { settled = true; });

    jest.advanceTimersByTime(60_000);
    await Promise.resolve();
    expect(settled).toBe(false);

    socket.receive({type: "response", id: sent.id, ok: true});
    await expect(responsePromise).resolves.toMatchObject({id: sent.id, ok: true});
  });

  test("all request-backed helpers inherit the connection deadline mode", async () => {
    jest.useFakeTimers();
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect({timeoutMs: null});
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const requests = [
      connection.createTopic("topic"),
      connection.destroyTopic("topic"),
      connection.subscribe("topic"),
      connection.unsubscribe("topic"),
      connection.getTopicPermission("topic"),
      connection.setTopicPermission("topic", 7)
    ];
    await Promise.resolve();

    expect(jest.getTimerCount()).toBe(0);
    socket.sent.forEach((raw) => {
      const sent = JSON.parse(raw);
      socket.receive({type: "response", id: sent.id, ok: true});
    });
    await expect(Promise.all(requests)).resolves.toHaveLength(6);
  });

  test.each(["close", "error"])("deadline-free requests reject and clean up on socket %s", async (event) => {
    jest.useFakeTimers();
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect({timeoutMs: null});
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const first = connection.createTopic("one");
    const second = connection.getTopicPermission("two");
    await Promise.resolve();
    if (event === "close") {
      socket.close();
    } else {
      socket.fail();
    }

    await expect(first).rejects.toThrow(/Connection to \/live/);
    await expect(second).rejects.toThrow(/Connection to \/live/);
    jest.advanceTimersByTime(60_000);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("supports explicit request deadlines and request-level overrides", async () => {
    jest.useFakeTimers();
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect({timeoutMs: null});
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const finiteRequest = connection.request("finite", {}, {timeoutMs: 25});
    await Promise.resolve();
    jest.advanceTimersByTime(25);
    await expect(finiteRequest).rejects.toThrow("Timed out waiting for /live response");

    const noDeadlineRequest = connection.request("unbounded", {}, {timeoutMs: null});
    await Promise.resolve();
    const sent = JSON.parse(socket.sent[1]);
    jest.advanceTimersByTime(60_000);
    socket.receive({type: "response", id: sent.id, ok: true});
    await expect(noDeadlineRequest).resolves.toMatchObject({id: sent.id});
  });

  test.each([0, -1, NaN, Infinity])("rejects invalid timeout value %s", (timeoutMs) => {
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    expect(() => liveManager.connect({timeoutMs})).toThrow(
      "timeoutMs must be a positive finite number or null"
    );
  });

  test("cleans up a request when socket.send throws", async () => {
    jest.useFakeTimers();
    const liveManager = new LiveManager(appConfig as any, tokenGetter);
    const connection = liveManager.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.send = () => { throw new Error("send failed"); };

    await expect(connection.createTopic("topic")).rejects.toThrow("send failed");
    expect(jest.getTimerCount()).toBe(0);
  });
});
