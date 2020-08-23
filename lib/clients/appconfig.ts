import {InMemoryLocalStorage, LocalStorage} from "./interface";

export interface BrowserLocation {
  host: string;
  apiRoot: string;
}

export class AppConfig {

  endpoint: string;
  localStorage: LocalStorage;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.localStorage = new InMemoryLocalStorage();
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}

export default AppConfig