import { Configuration } from './config';
import { Session } from './session';
import { HttpClient } from './http_client';
import { safeSerialize } from './utils';

export default class Worker {
  private config: Configuration;
  private queue: any[] = [];
  private lock: boolean = false;
  private stopFlag: boolean = false;
  private thread: NodeJS.Timeout | null = null;
  private session: Session | null = null;
  private jwt: string | null = null;

  constructor(config: Configuration) {
    this.config = config;
  }

  public addEvent(event: any): void {
    this.lock = true;
    this.queue.push(event);
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flushQueue();
    }
    this.lock = false;
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    this.lock = true;
    const events = this.queue;
    this.queue = [];

    const payload = {
      session_id: this.session?.sessionId,
      events,
    };

    const serializedPayload = safeSerialize(payload);
    await HttpClient.post(`${this.config.endpoint}/v2/create_events`, serializedPayload, this.jwt);
    this.lock = false;
  }

  public async reauthorizeJwt(session: Session): Promise<boolean> {
    this.session = session;
    this.lock = true;

    const payload = { session_id: session.sessionId };
    const serializedPayload = JSON.stringify(payload);
    const res = await HttpClient.post(`${this.config.endpoint}/v2/reauthorize_jwt`, serializedPayload, this.config.apiKey);

    if (res.status !== 200) {
      return false;
    }

    this.jwt = res.data.jwt ?? null;
    this.lock = false;
    return this.jwt !== null;
  }

  public async startSession(session: Session): Promise<boolean> {
    this.session = session;
    this.lock = true;

    const payload = { session: session };
    const serializedPayload = JSON.stringify(payload);
    const res = await HttpClient.post(`${this.config.endpoint}/v2/create_session`, serializedPayload, this.config.apiKey, this.config.parentKey);

    if (res.status !== 200) {
      return false;
    }

    this.jwt = res.data.jwt ?? null;
    this.lock = false;
    return this.jwt !== null;
  }

  public async endSession(session: Session): Promise<string> {
    this.stopFlag = true;
    if (this.thread) clearTimeout(this.thread);
    this.flushQueue();
    this.session = null;

    this.lock = true;
    const payload = { session };
    const res = await HttpClient.post(`${this.config.endpoint}/v2/update_session`, JSON.stringify(payload), this.jwt);
    this.lock = false;

    return res.data.token_cost ?? 'unknown';
  }

  public async updateSession(session: Session): Promise<void> {
    this.lock = true;
    const payload = { session };
    await HttpClient.post(`${this.config.endpoint}/v2/update_session`, JSON.stringify(payload), this.jwt);
    this.lock = false;
  }

  public async createAgent(agentId: string, name: string): Promise<void> {
    const payload = {
      id: agentId,
      name,
      session_id: this.session?.sessionId,
    };

    const serializedPayload = safeSerialize(payload);
    await HttpClient.post(`${this.config.endpoint}/v2/create_agent`, serializedPayload, this.jwt);
  }

  public run(): void {
    this.thread = setInterval(() => {
      if (this.stopFlag) clearInterval(this.thread!);
      if (this.queue.length > 0) this.flushQueue();
    }, this.config.maxWaitTime);
  }
}
