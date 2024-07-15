import { Configuration } from './config';
import { Session } from './session';
import { Worker } from './worker';
import { Event, ErrorEvent } from './event';
import { EndState } from './enums';
import { getISOTime } from './utils';
import { v4 as uuidv4 } from 'uuid';

interface ClientOptions {
  apiKey?: string;
  parentKey?: string;
  endpoint?: string;
  maxWaitTime?: number;
  maxQueueSize?: number;
  tags?: string[];
  instrumentLLMCalls?: boolean;
  autoStartSession?: boolean;
  inheritedSessionId?: string;
  skipAutoEndSession?: boolean;
}

interface SessionOptions {
  tags?: string[];
  config?: Configuration;
  inheritedSessionId?: string;
}

export class Client {
  private static instance: Client;
  private config: Configuration;
  private session: Session | null = null;
  private worker: Worker | null = null;
  private tags: string[] | null = null;
  private tagsForFutureSession: string[] | null = null;

  private constructor(options: ClientOptions) {
    this.config = new Configuration(options);
    this.handleUncleanExits();

    if (options.autoStartSession) {
      this.startSession({ tags: options.tags, inheritedSessionId: options.inheritedSessionId });
    } else {
      this.tagsForFutureSession = options.tags || null;
    }

    if (options.instrumentLLMCalls) {
      // TODO: Implement LLM instrumentation
    }
  }

  public static getInstance(options: ClientOptions): Client {
    if (!Client.instance) {
      Client.instance = new Client(options);
    }
    return Client.instance;
  }

  public startSession(options: SessionOptions = {}): string {
    if (this.session) {
      console.warn('Cannot start session - session already started');
      return this.session.sessionId;
    }

    const sessionId = options.inheritedSessionId || uuidv4();
    this.session = new Session(sessionId, options.tags || this.tagsForFutureSession);
    this.worker = new Worker(this.config);

    const startSessionResult = options.inheritedSessionId
      ? this.worker.reauthorizeJwt(this.session)
      : this.worker.startSession(this.session);

    if (!startSessionResult) {
      this.session = null;
      console.warn('Cannot start session - server rejected session');
      return '';
    }

    console.log(`Session Replay: https://app.agentops.ai/drilldown?session_id=${this.session.sessionId}`);
    return this.session.sessionId;
  }

  public endSession(endState: EndState, endStateReason?: string, video?: string): number {
    if (!this.session || this.session.hasEnded || !this.worker) {
      console.warn('Cannot end session - no current session');
      return 0;
    }

    this.session.video = video;
    this.session.endSession(endState, endStateReason);
    const tokenCost = this.worker.endSession(this.session);

    console.log(`Session Replay: https://app.agentops.ai/drilldown?session_id=${this.session.sessionId}`);

    this.session = null;
    this.worker = null;
    return tokenCost;
  }

  public record(event: Event | ErrorEvent): void {
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
        this.worker.addEvent(event.triggerEvent);
        event.triggerEvent = undefined;
      }
    }

    this.worker.addEvent(event);
  }

  public addTags(tags: string[]): void {
    if (this.session) {
      this.session.tags = [...(this.session.tags || []), ...tags];
      if (this.worker) {
        this.worker.updateSession(this.session);
      }
    } else {
      this.tagsForFutureSession = [...(this.tagsForFutureSession || []), ...tags];
    }
  }

  public setTags(tags: string[]): void {
    this.tagsForFutureSession = tags;
    if (this.session && this.worker) {
      this.session.tags = tags;
      this.worker.updateSession(this.session);
    }
  }

  public createAgent(name: string, agentId?: string): string {
    const id = agentId || uuidv4();
    if (this.worker) {
      this.worker.createAgent(name, id);
    }
    return id;
  }

  private handleUncleanExits(): void {
    const cleanup = (endState: EndState = EndState.FAIL, endStateReason?: string) => {
      if (this.session) {
        this.endSession(endState, endStateReason);
      }
    };

    const signalHandler = (signal: string) => {
      console.log(`${signal} detected. Ending session...`);
      cleanup(EndState.FAIL, `Signal ${signal} detected`);
      process.exit(0);
    };

    process.on('SIGINT', () => signalHandler('SIGINT'));
    process.on('SIGTERM', () => signalHandler('SIGTERM'));

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      cleanup(EndState.FAIL, `Uncaught Exception: ${error.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      cleanup(EndState.FAIL, `Unhandled Rejection: ${reason}`);
      process.exit(1);
    });

    process.on('exit', (code: number) => {
      if (this.session && !this.session.hasEnded) {
        cleanup(EndState.INDETERMINATE, `Process exited with code ${code}`);
      }
    });
  }
}
