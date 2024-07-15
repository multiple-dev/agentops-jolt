import { v4 as uuidv4 } from 'uuid';
import { getISOTime, checkCallStackForAgentId } from './utils';
import { EventType } from './enums';

interface EventBase {
  eventType: EventType;
  params?: Record<string, any>;
  returns?: string | string[];
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
}

export class Event implements EventBase {
  eventType: EventType;
  params?: Record<string, any>;
  returns?: string | string[];
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
  actionType?: string;

  constructor(options: {
    eventType: EventType;
    params?: Record<string, any>;
    returns?: string | string[];
    initTimestamp?: string;
    endTimestamp?: string;
    agentId?: string;
    id?: string;
    actionType?: string;
  }) {
    this.eventType = options.eventType;
    this.params = options.params;
    this.returns = options.returns;
    this.initTimestamp = options.initTimestamp || getISOTime();
    this.endTimestamp = options.endTimestamp;
    this.agentId = options.agentId || checkCallStackForAgentId();
    this.id = options.id || uuidv4();
    this.actionType = options.actionType;
  }
}

export class ActionEvent extends Event {
  logs?: string | any[];
  screenshot?: string;

  constructor(options: {
    params?: Record<string, any>;
    returns?: string | string[];
    initTimestamp?: string;
    endTimestamp?: string;
    agentId?: string;
    id?: string;
    actionType?: string;
    logs?: string | any[];
    screenshot?: string;
  }) {
    super({ eventType: EventType.ACTION, ...options });
    this.logs = options.logs;
    this.screenshot = options.screenshot;
  }
}

export class LLMEvent extends Event {
  threadId?: string;
  prompt?: string | string[];
  promptTokens?: number;
  completion?: string | Record<string, any>;
  completionTokens?: number;
  model?: string;

  constructor(options: {
    params?: Record<string, any>;
    returns?: string | string[];
    initTimestamp?: string;
    endTimestamp?: string;
    agentId?: string;
    id?: string;
    threadId?: string;
    prompt?: string | string[];
    promptTokens?: number;
    completion?: string | Record<string, any>;
    completionTokens?: number;
    model?: string;
  }) {
    super({ eventType: EventType.LLM, ...options });
    this.threadId = options.threadId;
    this.prompt = options.prompt;
    this.promptTokens = options.promptTokens;
    this.completion = options.completion;
    this.completionTokens = options.completionTokens;
    this.model = options.model;
  }
}

export class ToolEvent extends Event {
  name?: string;
  logs?: string | Record<string, any>;

  constructor(options: {
    params?: Record<string, any>;
    returns?: string | string[];
    initTimestamp?: string;
    endTimestamp?: string;
    agentId?: string;
    id?: string;
    name?: string;
    logs?: string | Record<string, any>;
  }) {
    super({ eventType: EventType.TOOL, ...options });
    this.name = options.name;
    this.logs = options.logs;
  }
}

export class ErrorEvent {
  triggerEvent?: Event;
  triggerEventId?: string;
  triggerEventType?: EventType;
  errorType?: string;
  code?: string;
  details?: string | Record<string, string>;
  logs?: string;
  timestamp: string;

  constructor(options: {
    triggerEvent?: Event;
    errorType?: string;
    code?: string;
    details?: string | Record<string, string>;
    logs?: string;
    timestamp?: string;
  }) {
    this.triggerEvent = options.triggerEvent;
    this.triggerEventId = options.triggerEvent?.id;
    this.triggerEventType = options.triggerEvent?.eventType;
    this.errorType = options.errorType || options.triggerEvent?.constructor.name;
    this.code = options.code;
    this.details = options.details || options.triggerEvent?.toString();
    this.logs = options.logs || (options.triggerEvent as any)?.stack;
    this.timestamp = options.timestamp || getISOTime();
  }
}
