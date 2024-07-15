import { v4 as uuidv4 } from 'uuid';
import { EndState } from './enums';
import { getISOTime } from './utils';

interface SessionOptions {
  sessionId?: string;
  tags?: string[];
  hostEnv?: Record<string, any>;
}

export class Session {
  public readonly sessionId: string;
  public tags: string[] | null;
  public readonly initTimestamp: string;
  public endTimestamp: string | null;
  public endState: EndState | null;
  public endStateReason: string | null;
  public video: string | null;
  private hostEnv: Record<string, any> | null;

  constructor(options: SessionOptions = {}) {
    this.sessionId = options.sessionId || uuidv4();
    this.tags = options.tags || null;
    this.initTimestamp = getISOTime();
    this.endTimestamp = null;
    this.endState = null;
    this.endStateReason = null;
    this.video = null;
    this.hostEnv = options.hostEnv || null;
  }

  public setSessionVideo(video: string): void {
    this.video = video;
  }

  public endSession(endState: EndState, endStateReason?: string): void {
    this.endState = endState;
    this.endStateReason = endStateReason || null;
    this.endTimestamp = getISOTime();
  }

  public get hasEnded(): boolean {
    return this.endState !== null;
  }

  public toJSON(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      tags: this.tags,
      initTimestamp: this.initTimestamp,
      ...this.hasEnded ? { endTimestamp: this.endTimestamp, endState: this.endState, endStateReason: this.endStateReason } : {},
      ...(this.video ? { video: this.video } : {}),
      ...(this.hostEnv ? { hostEnv: this.hostEnv } : {}),
    };
  }
}
