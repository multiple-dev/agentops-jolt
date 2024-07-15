import { ConfigurationError } from './errors';

interface ConfigurationOptions {
  apiKey?: string;
  parentKey?: string;
  endpoint?: string;
  maxWaitTime?: number;
  maxQueueSize?: number;
  skipAutoEndSession?: boolean;
}

export class Configuration {
  private _apiKey: string;
  private _parentKey: string | undefined;
  private _endpoint: string;
  private _maxWaitTime: number;
  private _maxQueueSize: number;
  private _skipAutoEndSession: boolean;

  constructor(options: ConfigurationOptions = {}) {
    this._apiKey = options.apiKey || process.env.AGENTOPS_API_KEY || '';
    if (!this._apiKey) {
      throw new ConfigurationError('No API key provided - no data will be recorded.');
    }

    this._parentKey = options.parentKey || process.env.AGENTOPS_PARENT_KEY;
    this._endpoint = options.endpoint || process.env.AGENTOPS_API_ENDPOINT || 'https://api.agentops.ai';
    this._maxWaitTime = options.maxWaitTime || 5000;
    this._maxQueueSize = options.maxQueueSize || 100;
    this._skipAutoEndSession = options.skipAutoEndSession || false;
  }

  get apiKey(): string {
    return this._apiKey;
  }

  set apiKey(value: string) {
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
    this._endpoint = value;
  }

  get maxWaitTime(): number {
    return this._maxWaitTime;
  }

  set maxWaitTime(value: number) {
    this._maxWaitTime = value;
  }

  get maxQueueSize(): number {
    return this._maxQueueSize;
  }

  set maxQueueSize(value: number) {
    this._maxQueueSize = value;
  }

  get skipAutoEndSession(): boolean {
    return this._skipAutoEndSession;
  }

  set skipAutoEndSession(value: boolean) {
    this._skipAutoEndSession = value;
  }
}

export { ConfigurationError };
