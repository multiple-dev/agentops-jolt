import axios from 'axios';
import { Configuration } from './config';
import { Session } from './session';
import { getISOTime, safeSerialize } from './utils';

interface QueuedEvent {
  [key: string]: any;
}

export class Worker {
  private config: Configuration;
  private queue: QueuedEvent[] = [];
  private session: Session | null = null;
  private jwt: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Configuration) {
    this.config = config;
    this.startWorker();
  }

  private startWorker(): void {
    this.intervalId = setInterval(() => {
      if (this.queue.length > 0) {
        this.flushQueue();
      }
    }, this.config.maxWaitTime);
  }

  public addEvent(event: QueuedEvent): void {
    this.queue.push(event);
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const payload = {
      session_id: this.session?.sessionId,
      events: events,
    };

    try {
      await axios.post(
        `${this.config.endpoint}/v2/create_events`,
        safeSerialize(payload),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );
    } catch (error) {
      console.warn('Failed to flush events queue:', error);
      // Add events back to the queue
      this.queue = [...events, ...this.queue];
    }
  }

  public async reauthorizeJwt(session: Session): Promise<boolean> {
    this.session = session;
    try {
      const response = await axios.post(
        `${this.config.endpoint}/v2/reauthorize_jwt`,
        { session_id: session.sessionId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Agentops-Api-Key': this.config.apiKey,
          },
        }
      );

      if (response.status === 200 && response.data.jwt) {
        this.jwt = response.data.jwt;
        return true;
      }
    } catch (error) {
      console.warn('Failed to reauthorize JWT:', error);
    }
    return false;
  }

  public async startSession(session: Session): Promise<boolean> {
    this.session = session;
    try {
      const response = await axios.post(
        `${this.config.endpoint}/v2/create_session`,
        safeSerialize({ session: session.toJSON() }),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Agentops-Api-Key': this.config.apiKey,
            ...(this.config.parentKey && { 'X-Agentops-Parent-Key': this.config.parentKey }),
          },
        }
      );

      if (response.status === 200 && response.data.jwt) {
        this.jwt = response.data.jwt;
        return true;
      }
    } catch (error) {
      console.warn('Failed to start session:', error);
    }
    return false;
  }

  public async endSession(session: Session): Promise<number> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.flushQueue();

    try {
      const response = await axios.post(
        `${this.config.endpoint}/v2/update_session`,
        safeSerialize({ session: session.toJSON() }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );
      return response.data.token_cost || 0;
    } catch (error) {
      console.warn('Failed to end session:', error);
      return 0;
    }
  }
}
