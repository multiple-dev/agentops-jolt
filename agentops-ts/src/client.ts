import { Configuration } from './config';
import { Event, ErrorEvent } from './event';
import { Session } from './session';
import { Worker } from './worker';

export default class Client {
  private session: Session | null;
  private worker: Worker | null;
  private tags: string[] | null;
  private tagsForFutureSession: string[] | null;
  private config: Configuration | null;

  constructor(options?: {
    apiKey?: string;
    parentKey?: string;
    endpoint?: string;
    maxWaitTime?: number;
    maxQueueSize?: number;
    tags?: string[];
    skipAutoEndSession?: boolean;
  }) {
    this.session = null;
    this.worker = null;
    this.tags = options?.tags || null;
    this.tagsForFutureSession = null;
    this.config = null;

    try {
      this.config = new Configuration(options);
    } catch (error) {
      // Log configuration error
      return;
    }
  }

  public init() {
    // Initialize the AgentOps client with the provided configuration
    // TODO: Implement initialization logic
  }

  public record(event: Event | ErrorEvent) {
    if (!this.session || this.session.hasEnded || !this.worker) {
      // Log warning: Cannot record event - no current session
      return;
    }

    // TODO: Prepare the event object

    this.worker.addEvent(event);
  }

  public async startSession(
    tags?: string[],
    config?: Configuration,
    inheritedSessionId?: string
  ) {
    if (this.session) {
      // Log warning: Cannot start session - session already started
      return;
    }

    if (!config && !this.config) {
      // Log warning: Cannot start session - missing configuration
      return;
    }

    // TODO: Create a new Session object

    this.worker = new Worker(config || this.config!);

    const startSessionResult = await this.worker.startSession(this.session);

    if (!startSessionResult) {
      this.session = null;
      // Log warning: Cannot start session - server rejected session
      return;
    }

    // TODO: Log session replay URL
  }

  public async endSession(
    endState: string,
    endStateReason?: string,
    video?: string
  ) {
    if (!this.session || this.session.hasEnded) {
      // Log warning: Cannot end session - no current session
      return;
    }

    // TODO: Validate endState

    if (!this.worker || !this.worker.session) {
      // Log warning: Cannot end session - no current worker or session
      return;
    }

    // TODO: End the session and get the token cost

    this.session = null;
    this.worker = null;

    // TODO: Log session replay URL and token cost
  }

  // TODO: Implement addTags, setTags, and createAgent methods
}
