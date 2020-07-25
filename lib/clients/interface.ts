export interface TokenGetter {
  getToken(): string
}

export interface AppConfigProvider {
  [propName: string]: any;
}

export interface LocalStorage {
  getItem(key): string

  setItem(key, value)
}

export class InMemoryLocalStorage {
  data: object;

  getItem(key) {
    return this.data[key]
  }

  setItem(key, value) {
    this.data[key] = value;
  }
}



