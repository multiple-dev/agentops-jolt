import { EventType } from './types';
import { v4 as uuidv4 } from 'uuid';

class Event {
  eventType: EventType;
  params?: Record<string, any>;
  returns?: string | string[];
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;

  constructor(eventType: EventType, params?: Record<string, any>, returns?: string | string[], initTimestamp?: string, endTimestamp?: string, agentId?: string) {
    this.eventType = eventType;
    this.params = params;
    this.returns = returns;
    this.initTimestamp = initTimestamp || new Date().toISOString();
    this.endTimestamp = endTimestamp;
    this.agentId = agentId;
    this.id = uuidv4();
  }
}

class ActionEvent extends Event {
  actionType?: string;
  logs?: string | any[];
  screenshot?: string;

  constructor(params?: Record<string, any>, returns?: string | string[], initTimestamp?: string, endTimestamp?: string, agentId?: string, actionType?: string, logs?: string | any[], screenshot?: string) {
    super(EventType.ACTION, params, returns, initTimestamp, endTimestamp, agentId);
    this.actionType = actionType;
    this.logs = logs;
    this.screenshot = screenshot;
  }
}

class LLMEvent extends Event {
  threadId?: string;
  prompt?: string | string[];
  promptTokens?: number;
  completion?: string | Record<string, any>;
  completionTokens?: number;
  model?: string;

  constructor(params?: Record<string, any>, returns?: string | string[], initTimestamp?: string, endTimestamp?: string, agentId?: string, threadId?: string, prompt?: string | string[], promptTokens?: number, completion?: string | Record<string, any>, completionTokens?: number, model?: string) {
    super(EventType.LLM, params, returns, initTimestamp, endTimestamp, agentId);
    this.threadId = threadId;
    this.prompt = prompt;
    this.promptTokens = promptTokens;
    this.completion = completion;
    this.completionTokens = completionTokens;
    this.model = model;
  }
}

class ToolEvent extends Event {
  name?: string;
  logs?: string | Record<string, any>;

  constructor(params?: Record<string, any>, returns?: string | string[], initTimestamp?: string, endTimestamp?: string, agentId?: string, name?: string, logs?: string | Record<string, any>) {
    super(EventType.TOOL, params, returns, initTimestamp, endTimestamp, agentId);
    this.name = name;
    this.logs = logs;
  }
}

class ErrorEvent {
  eventType: EventType.ERROR = EventType.ERROR;
  triggerEvent?: Event;
  errorType?: string;
  code?: string;
  details?: string | Record<string, string>;
  logs?: string;
  timestamp: string;

  constructor(triggerEvent?: Event, error?: Error, code?: string, details?: string | Record<string, string>, logs?: string) {
    this.triggerEvent = triggerEvent;
    this.errorType = error?.name;
    this.code = code;
    this.details = error?.message || details;
    this.logs = logs || error?.stack;
    this.timestamp = new Date().toISOString();
  }
}

export { Event, ActionEvent, LLMEvent, ToolEvent, ErrorEvent };
