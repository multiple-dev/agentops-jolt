import { EndState } from './types';
import { getISOTime } from './utils';

class Session {
  endTimestamp: string | null;
  endState: EndState | null;
  sessionId: string;
  initTimestamp: string;
  tags: string[] | null;
  video: string | null;
  endStateReason: string | null;
  hostEnv: any | null;

  constructor(sessionId: string, tags: string[] | null = null, hostEnv: any | null = null) {
    this.endTimestamp = null;
    this.endState = null;
    this.sessionId = sessionId;
    this.initTimestamp = getISOTime();
    this.tags = tags;
    this.video = null;
    this.endStateReason = null;
    this.hostEnv = hostEnv;
  }

  setSessionVideo(video: string) {
    this.video = video;
  }

  endSession(endState: EndState, endStateReason: string | null = null) {
    this.endState = endState;
    this.endStateReason = endStateReason;
    this.endTimestamp = getISOTime();
  }

  get hasEnded(): boolean {
    return this.endState !== null;
  }
}

export default Session;
