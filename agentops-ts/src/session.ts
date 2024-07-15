import { getISOTime } from './utils';

export class Session {
  sessionId: string;
  tags?: string[];
  initTimestamp: string;
  endTimestamp?: string;
  endState?: string;
  endStateReason?: string;
  video?: string;

  constructor(sessionId: string, tags?: string[]) {
    this.sessionId = sessionId;
    this.tags = tags;
    this.initTimestamp = getISOTime();
  }

  setSessionVideo(video: string): void {
    this.video = video;
  }

  endSession(endState: string, endStateReason?: string): void {
    this.endState = endState;
    this.endStateReason = endStateReason;
    this.endTimestamp = getISOTime();
  }

  get hasEnded(): boolean {
    return !!this.endState;
  }
}

export interface SessionData {
  sessionId: string;
  tags?: string[];
  initTimestamp: string;
  endTimestamp?: string;
  endState?: string;
  endStateReason?: string;
  video?: string;
}

export interface CreateSessionResponse {
  jwt: string;
}
