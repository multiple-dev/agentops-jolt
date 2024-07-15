import { Configuration } from './config';
import { Session, SessionData, CreateSessionResponse } from './session';
import { HttpClient } from './httpClient';

interface Event {
  [key: string]: any;
}

export class Worker {
  private config: Configuration;
  private queue: Event[] = [];
  private session: Session | null = null;
  private jwt: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Configuration) {
    this.config = config;
  }

  public addEvent(event: Event): void {
    this.queue.push(event);
    if (this.queue.length >= this.config.maxQueueSize) {
      void this.flushQueue();
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const events = this.queue;
    this.queue = [];

    const payload = {
      session_id: this.session?.sessionId,
      events,
    };

    await HttpClient.post(`${this.config.endpoint}/v2/create_events`, payload, this.jwt);
  }

  public async reauthorizeJWT(session: Session): Promise<boolean> {
    this.session = session;

    const payload = { session_id: session.sessionId };
    const response = await HttpClient.post(
      `${this.config.endpoint}/v2/reauthorize_jwt`,
      payload,
      this.config.apiKey,
    );

    if (!response.ok) {
      return false;
    }

    this.jwt = response.data.jwt;
    return this.jwt !== null;
  }

  public async startSession(session: Session): Promise<boolean> {
    this.session = session;

    const payload = { session: session as SessionData };
    const response = await HttpClient.post<CreateSessionResponse>(
      `${this.config.endpoint}/v2/create_session`,
      payload,
      this.config.apiKey,
      this.config.parentKey,
    );

    if (!response.ok) {
      return false;
    }

    this.jwt = response.data.jwt;
    this.startRunLoop();
    return this.jwt !== null;
  }

  public async endSession(session: Session): Promise<number> {
    this.stopRunLoop();
    await this.flushQueue();
    this.session = null;

    const payload = { session: session as SessionData };
    const response = await HttpClient.post(
      `${this.config.endpoint}/v2/update_session`,
      payload,
      this.jwt,
    );

    return response.data.token_cost || 0;
  }

  public async updateSession(session: Session): Promise<void> {
    const payload = { session: session as SessionData };
    await HttpClient.post(`${this.config.endpoint}/v2/update_session`, payload, this.jwt);
  }

  public async createAgent(agentId: string, name: string): Promise<string | undefined> {
    const payload = {
      id: agentId,
      name,
      session_id: this.session?.sessionId,
    };

    await HttpClient.post(`${this.config.endpoint}/v2/create_agent`, payload, this.jwt);
    return agentId;
  }

  private startRunLoop(): void {
    this.intervalId = setInterval(() => {
      void this.flushQueue();
    }, this.config.maxWaitTime);
  }

  private stopRunLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
