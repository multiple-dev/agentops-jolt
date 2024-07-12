export default class Configuration {
  private _apiKey: string;
  private _parentKey: string | undefined;
  private _endpoint: string;
  private _maxWaitTime: number;
  private _maxQueueSize: number;
  private _skipAutoEndSession: boolean;

  constructor(
    apiKey?: string,
    parentKey?: string,
    endpoint?: string,
    maxWaitTime?: number,
    maxQueueSize?: number,
    skipAutoEndSession?: boolean
  ) {
    this._apiKey = apiKey || '';
    this._parentKey = parentKey;
    this._endpoint = endpoint || 'https://api.agentops.ai';
    this._maxWaitTime = maxWaitTime || 5000;
    this._maxQueueSize = maxQueueSize || 100;
    this._skipAutoEndSession = skipAutoEndSession || false;
  }

  get apiKey(): string {
    return this._apiKey;
  }

  set apiKey(value: string) {
    if (!value) {
      throw new Error('API key cannot be empty');
    }
    this._apiKey = value;
  }

  get parentKey(): string | undefined {
    return this._parentKey;
  }

  set parentKey(value: string | undefined) {
    this._parentKey = value;
  }

  get endpoint(): string {
    return this._endpoint;
  }

  set endpoint(value: string) {
    if (!value) {
      throw new Error('Endpoint cannot be empty');
    }
    this._endpoint = value;
  }

  get maxWaitTime(): number {
    return this._maxWaitTime;
  }

  set maxWaitTime(value: number) {
    if (value <= 0) {
      throw new Error('Max wait time must be greater than 0');
    }
    this._maxWaitTime = value;
  }

  get maxQueueSize(): number {
    return this._maxQueueSize;
  }

  set maxQueueSize(value: number) {
    if (value <= 0) {
      throw new Error('Max queue size must be greater than 0');
    }
    this._maxQueueSize = value;
  }

  get skipAutoEndSession(): boolean {
    return this._skipAutoEndSession;
  }
}
