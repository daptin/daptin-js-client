import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface LiveConnectOptions {
  token?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (message: LiveMessage) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  timeoutMs?: number;
}

export interface LiveMessage {
  type?: string;
  id?: string;
  method?: string;
  ok?: boolean;
  error?: string;
  data?: any;
  topic?: string;
  event?: string;
  source?: string;
  [key: string]: any;
}

export interface LiveRequestOptions {
  timeoutMs?: number;
}

export class LiveConnection {
  socket: WebSocket;
  private openPromise: Promise<void>;
  private pending: {[id: string]: {resolve: (message: LiveMessage) => void; reject: (message: LiveMessage | Error) => void; timer: any}} = {};
  private defaultTimeoutMs: number;

  constructor(socket: WebSocket, options: LiveConnectOptions = {}) {
    this.socket = socket;
    this.defaultTimeoutMs = options.timeoutMs || 5000;

    this.openPromise = new Promise((resolve, reject) => {
      const previousOpen = socket.onopen;
      const previousError = socket.onerror;
      socket.onopen = (event) => {
        if (previousOpen) {
          previousOpen.call(socket, event);
        }
        if (options.onOpen) {
          options.onOpen(event);
        }
        resolve();
      };
      socket.onerror = (event) => {
        if (previousError) {
          previousError.call(socket, event);
        }
        if (options.onError) {
          options.onError(event);
        }
        reject(new Error("Failed to connect to /live"));
      };
    });

    socket.onmessage = (event) => {
      const message = this.parseMessage(event.data);
      if (options.onMessage) {
        options.onMessage(message);
      }
      if (message && message.type === "response" && message.id && this.pending[message.id]) {
        const pending = this.pending[message.id];
        clearTimeout(pending.timer);
        delete this.pending[message.id];
        if (message.ok === false) {
          pending.reject(message);
        } else {
          pending.resolve(message);
        }
      }
    };

    socket.onclose = (event) => {
      if (options.onClose) {
        options.onClose(event);
      }
      this.rejectPending(new Error("Connection to /live closed"));
    };
  }

  request(method: string, attributes: {[key: string]: any}, options: LiveRequestOptions = {}): Promise<LiveMessage> {
    const id = this.nextId();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const socket = this.socket;

    return this.openPromise.then(() => {
      return new Promise<LiveMessage>((resolve, reject) => {
        const timer = setTimeout(() => {
          delete this.pending[id];
          reject(new Error("Timed out waiting for /live response"));
        }, timeoutMs);
        this.pending[id] = {resolve, reject, timer};
        socket.send(JSON.stringify({
          id: id,
          method: method,
          attributes: attributes
        }));
      });
    });
  }

  send(method: string, attributes: {[key: string]: any}): Promise<LiveMessage> {
    const id = this.nextId();
    const message = {
      id: id,
      method: method,
      attributes: attributes
    };

    return this.openPromise.then(() => {
      this.socket.send(JSON.stringify(message));
      return {
        type: "request",
        id: id,
        method: method,
        data: attributes
      };
    });
  }

  createTopic(name: string): Promise<LiveMessage> {
    return this.request("create-topicName", {name: name});
  }

  destroyTopic(name: string): Promise<LiveMessage> {
    return this.request("destroy-topicName", {name: name});
  }

  subscribe(topicName: string, filters?: {[key: string]: any}): Promise<LiveMessage> {
    const attributes: {[key: string]: any} = {topicName: topicName};
    if (filters) {
      attributes.filters = filters;
    }
    return this.request("subscribe", attributes);
  }

  unsubscribe(topicName: string): Promise<LiveMessage> {
    return this.request("unsubscribe", {topicName: topicName});
  }

  publish(topicName: string, message: {[key: string]: any}): Promise<LiveMessage> {
    return this.send("new-message", {
      topicName: topicName,
      message: message
    });
  }

  getTopicPermission(topicName: string): Promise<LiveMessage> {
    return this.request("get-topic-permission", {topicName: topicName});
  }

  setTopicPermission(topicName: string, permission: number): Promise<LiveMessage> {
    return this.request("set-topic-permission", {
      topicName: topicName,
      permission: permission
    });
  }

  close() {
    this.socket.close();
  }

  private parseMessage(data: any): LiveMessage {
    let message: LiveMessage;
    if (typeof data === "string") {
      message = JSON.parse(data);
    } else {
      message = data;
    }
    if (message && typeof message.data === "string") {
      message.data = this.parseDataPayload(message.data);
    }
    return message;
  }

  private parseDataPayload(data: string): any {
    if (!data) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (_) {
    }
    try {
      const decoded = this.decodeBase64(data);
      return JSON.parse(decoded);
    } catch (_) {
      return data;
    }
  }

  private decodeBase64(data: string): string {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(data, "base64").toString("utf8");
    }
    return atob(data);
  }

  private rejectPending(error: Error) {
    Object.keys(this.pending).forEach((id) => {
      const pending = this.pending[id];
      clearTimeout(pending.timer);
      pending.reject(error);
      delete this.pending[id];
    });
  }

  private nextId() {
    return "live-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }
}

export class LiveManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;
  private connection?: LiveConnection;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
  }

  connect(options: LiveConnectOptions = {}): LiveConnection {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket is not available in this environment");
    }
    const socket = new WebSocket(this.url(options.token));
    this.connection = new LiveConnection(socket, options);
    return this.connection;
  }

  url(token?: string): string {
    const endpoint = this.appConfig.getEndpoint().replace(/\/$/, "");
    const base = endpoint.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const authToken = token || this.tokenGetter.getToken();
    const query = authToken ? "?token=" + encodeURIComponent(authToken) : "";
    return base + "/live" + query;
  }

  createTopic(name: string): Promise<LiveMessage> {
    return this.activeConnection().createTopic(name);
  }

  destroyTopic(name: string): Promise<LiveMessage> {
    return this.activeConnection().destroyTopic(name);
  }

  subscribe(topicName: string, filters?: {[key: string]: any}): Promise<LiveMessage> {
    return this.activeConnection().subscribe(topicName, filters);
  }

  unsubscribe(topicName: string): Promise<LiveMessage> {
    return this.activeConnection().unsubscribe(topicName);
  }

  publish(topicName: string, message: {[key: string]: any}): Promise<LiveMessage> {
    return this.activeConnection().publish(topicName, message);
  }

  getTopicPermission(topicName: string): Promise<LiveMessage> {
    return this.activeConnection().getTopicPermission(topicName);
  }

  setTopicPermission(topicName: string, permission: number): Promise<LiveMessage> {
    return this.activeConnection().setTopicPermission(topicName, permission);
  }

  close() {
    if (this.connection) {
      this.connection.close();
      this.connection = undefined;
    }
  }

  private activeConnection(): LiveConnection {
    if (!this.connection) {
      throw new Error("LiveManager is not connected");
    }
    return this.connection;
  }
}

export default LiveManager;
