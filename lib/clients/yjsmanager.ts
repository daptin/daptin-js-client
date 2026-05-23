import AppConfig from "./appconfig";
import {TokenGetter} from "./interface";

export interface YjsConnectionOptions {
  token?: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export class YjsManager {
  appConfig: AppConfig;
  tokenGetter: TokenGetter;

  constructor(appConfig: AppConfig, tokenGetter: TokenGetter) {
    this.appConfig = appConfig;
    this.tokenGetter = tokenGetter;
  }

  url(documentName: string, token?: string): string {
    const endpoint = this.appConfig.getEndpoint().replace(/\/$/, "");
    const base = endpoint.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const authToken = token || this.tokenGetter.getToken();
    const query = authToken ? "?token=" + encodeURIComponent(authToken) : "";
    return base + "/yjs/" + encodeURIComponent(documentName) + query;
  }

  connect(documentName: string, options: YjsConnectionOptions = {}): WebSocket {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket is not available in this environment");
    }
    const socket = new WebSocket(this.url(documentName, options.token));
    if (options.onOpen) {
      socket.onopen = options.onOpen;
    }
    if (options.onMessage) {
      socket.onmessage = options.onMessage;
    }
    if (options.onError) {
      socket.onerror = options.onError;
    }
    if (options.onClose) {
      socket.onclose = options.onClose;
    }
    return socket;
  }
}

export default YjsManager;
