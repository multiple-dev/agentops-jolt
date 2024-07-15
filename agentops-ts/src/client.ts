import { Configuration } from './config';
import { Event, ErrorEvent } from './event';
import { Session } from './session';
import { Worker } from './worker';
import { getISOTime, checkCallStackForAgentId } from './utils';

export class Client {
  private static instance: Client;
  private session: Session | null = null;
  private worker: Worker | null = null;
  private tags: string[] | null = null;
  private tagsForFutureSession: string[] | null = null;
  private config: Configuration;

  private constructor(config: Configuration) {
    this.config = config;
    this.handleUncleanExits();
  }

  public static getInstance(config: Configuration): Client {
    if (!Client.instance) {
      Client.instance = new Client(config);
    }
    return Client.instance;
  }

  public async startSession(tags?: string[]): Promise<string | undefined> {
    if (this.session) {
      console.warn('Cannot start session - session already started');
      return;
    }

    this.session = new Session(tags || this.tagsForFutureSession);
    this.worker = new Worker(this.config);

    const startSessionResult = await this.worker.startSession(this.session);

    if (!startSessionResult) {
      this.session = null;
      console.warn('Cannot start session - server rejected session');
      return;
    }

    console.info(`Session Replay: https://app.agentops.ai/drilldown?session_id=${this.session.sessionId}`);

    return this.session.sessionId;
  }

  public async endSession(endState: string, endStateReason?: string, video?: string): Promise<number> {
    if (!this.session || this.session.hasEnded) {
      console.warn('Cannot end session - no current session');
      return 0;
    }

    this.session.endSession(endState, endStateReason);
    this.session.video = video;

    const tokenCost = await this.worker?.endSession(this.session) || 0;

    console.info(`This run's cost $${tokenCost.toFixed(6)}`);
    console.info(`Session Replay: https://app.agentops.ai/drilldown?session_id=${this.session.sessionId}`);

    this.session = null;
    this.worker = null;

    return tokenCost;
  }

  public async record(event: Event | ErrorEvent): Promise<void> {
    if (!this.session || this.session.hasEnded || !this.worker) {
      console.warn('Cannot record event - no current session');
      return;
    }

    if (event instanceof Event) {
      if (!event.endTimestamp || event.initTimestamp === event.endTimestamp) {
        event.endTimestamp = getISOTime();
      }
    } else if (event instanceof ErrorEvent) {
      if (event.triggerEvent) {
        if (!event.triggerEvent.endTimestamp || event.triggerEvent.initTimestamp === event.triggerEvent.endTimestamp) {
          event.triggerEvent.endTimestamp = getISOTime();
        }
        event.triggerEventId = event.triggerEvent.id;
        event.triggerEventType = event.triggerEvent.eventType;
        await this.worker.addEvent(event.triggerEvent);
        event.triggerEvent = undefined;
      }
    }

    await this.worker.addEvent(event);
  }

  public addTags(tags: string[]): void {
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
      if (typeof tags === 'string') {
        tags = [tags];
      } else {
        console.warn('Invalid tags format. Tags must be an array of strings or a single string.');
        return;
      }
    }

    if (this.session) {
      this.session.tags = [...(this.session.tags || []), ...tags];
      this.worker?.updateSession(this.session);
    } else {
      this.tagsForFutureSession = [...(this.tagsForFutureSession || []), ...tags];
    }
  }

  public setTags(tags: string[]): void {
    this.tagsForFutureSession = tags;

    if (this.session) {
      this.session.tags = tags;
      this.worker?.updateSession(this.session);
    }
  }

  public async createAgent(name: string, agentId?: string): Promise<string | undefined> {
    if (!agentId) {
      agentId = crypto.randomUUID();
    }
    return await this.worker?.createAgent(agentId, name);
  }

  private handleUncleanExits(): void {
    const cleanup = async (endState: string = 'Fail', endStateReason?: string) => {
      if (this.session) {
        await this.endSession(endState, endStateReason);
      }
    };

    const signalHandler = (signal: string) => {
      console.info(`${signal} detected. Ending session...`);
      void cleanup('Fail', `Signal ${signal} detected`);
      process.exit(0);
    };

    const handleException = async (err: Error) => {
      console.error(err);
      await cleanup('Fail', `Uncaught exception: ${err.message}`);
      process.exit(1);
    };

    process.on('SIGINT', () => signalHandler('SIGINT'));
    process.on('SIGTERM', () => signalHandler('SIGTERM'));
    process.on('uncaughtException', handleException);
    process.on('unhandledRejection', handleException);
  }

  private async recordEvent(func: Function, eventName: string, ...args: any[]): Promise<any> {
    const initTime = getISOTime();
    const funcArgs = args[0] || {};

    const event = new Event({
      eventType: 'action',
      params: funcArgs,
      initTimestamp: initTime,
      agentId: checkCallStackForAgentId(),
      actionType: eventName,
    });

    try {
      const returns = await func(...args);

      event.returns = returns;
      event.endTimestamp = getISOTime();
      await this.record(event);

      return returns;
    } catch (err) {
      await this.record(new ErrorEvent({
        triggerEvent: event,
        errorType: err.name,
        details: err.message,
      }));
      throw err;
    }
  }

  public async recordFunction(func: Function, eventName: string): Promise<Function> {
    return async (...args: any[]) => {
      return await this.recordEvent(func, eventName, ...args);
    };
  }

  get currentSessionId(): string | undefined {
    return this.session?.sessionId;
  }

  get apiKey(): string | undefined {
    return this.config.apiKey;
  }

  public setParentKey(parentKey: string): void {
    if (this.worker) {
      this.worker.config.parentKey = parentKey;
    }
  }

  get parentKey(): string | undefined {
    return this.config.parentKey;
  }
}
