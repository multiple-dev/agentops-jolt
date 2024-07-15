export class Configuration {
  private _apiKey: string;
  private _parentKey?: string;
  private _endpoint: string;
  private _maxWaitTime: number;
  private _maxQueueSize: number;

  constructor(options: {
    apiKey: string;
    parentKey?: string;
    endpoint?: string;
    maxWaitTime?: number;
    maxQueueSize?: number;
  }) {
    if (!options.apiKey) {
      throw new ConfigurationError('No API key provided - no data will be recorded.');
    }

    this._apiKey = options.apiKey;
    this._parentKey = options.parentKey;
    this._endpoint = options.endpoint || 'https://api.agentops.ai';
    this._maxWaitTime = options.maxWaitTime || 5000;
    this._maxQueueSize = options.maxQueueSize || 100;
  }

  get apiKey(): string {
    return this._apiKey;
  }

  get parentKey(): string | undefined {
    return this._parentKey;
  }

  get endpoint(): string {
    return this._endpoint;
  }

  get maxWaitTime(): number {
    return this._maxWaitTime;
  }

  get maxQueueSize(): number {
    return this._maxQueueSize;
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
