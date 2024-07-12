export enum EventType {
  LLM = 'llms',
  ACTION = 'actions',
  API = 'apis',
  TOOL = 'tools',
  ERROR = 'errors',
}

export enum EndState {
  SUCCESS = 'Success',
  FAIL = 'Fail',
  INDETERMINATE = 'Indeterminate',
}

export interface Event {
  eventType: EventType;
  params?: Record<string, any>;
  returns?: string | string[];
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
}

export interface ActionEvent extends Event {
  eventType: EventType.ACTION;
  actionType?: string;
  logs?: string | any[];
  screenshot?: string;
}

export interface LLMEvent extends Event {
  eventType: EventType.LLM;
  threadId?: string;
  prompt?: string | any[];
  promptTokens?: number;
  completion?: string | object;
  completionTokens?: number;
  model?: string;
}

export interface ToolEvent extends Event {
  eventType: EventType.TOOL;
  name?: string;
  logs?: string | Record<string, any>;
}

export interface ErrorEvent {
  triggerEvent?: Event;
  exception?: Error;
  errorType?: string;
  code?: string;
  details?: string | Record<string, string>;
  logs?: string;
  timestamp: string;
}
