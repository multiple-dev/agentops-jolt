import { v4 as uuidv4 } from 'uuid';
import { EventType, EndState } from './enums';

// Utility function to get ISO timestamp
export const getISOTime = (): string => new Date().toISOString();

// Placeholder function for checking call stack for agent ID
// In a real implementation, this would need to be adapted for Node.js
export const checkCallStackForAgentId = (): string | undefined => undefined;

// Base Event interface
export interface Event {
  eventType: EventType;
  params?: Record<string, any>;
  returns?: any;
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
}

// ActionEvent interface
export interface ActionEvent extends Event {
  actionType?: string;
  logs?: string | any[];
  screenshot?: string;
}

// LLMEvent interface
export interface LLMEvent extends Event {
  threadId?: string;
  prompt?: string | string[];
  promptTokens?: number;
  completion: string | object;
  completionTokens?: number;
  model?: string;
}

// ToolEvent interface
export interface ToolEvent extends Event {
  name?: string;
  logs?: string | Record<string, any>;
}

// ErrorEvent interface (not extending Event)
export interface ErrorEvent {
  triggerEvent?: Event;
  triggerEventId?: string;
  triggerEventType?: EventType;
  errorType?: string;
  code?: string;
  details?: string | Record<string, string>;
  logs?: string;
  timestamp: string;
}

// ActionEvent class
export class ActionEventClass implements ActionEvent {
  eventType: EventType = EventType.ACTION;
  params?: Record<string, any>;
  returns?: any;
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
  actionType?: string;
  logs?: string | any[];
  screenshot?: string;

  constructor(data: Partial<ActionEvent>) {
    this.params = data.params;
    this.returns = data.returns;
    this.initTimestamp = data.initTimestamp || getISOTime();
    this.endTimestamp = data.endTimestamp;
    this.agentId = data.agentId || checkCallStackForAgentId();
    this.id = data.id || uuidv4();
    this.actionType = data.actionType;
    this.logs = data.logs;
    this.screenshot = data.screenshot;
  }
}

// LLMEvent class
export class LLMEventClass implements LLMEvent {
  eventType: EventType = EventType.LLM;
  params?: Record<string, any>;
  returns?: any;
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
  threadId?: string;
  prompt?: string | string[];
  promptTokens?: number;
  completion: string | object;
  completionTokens?: number;
  model?: string;

  constructor(data: Partial<LLMEvent> & { completion: string | object }) {
    this.params = data.params;
    this.returns = data.returns;
    this.initTimestamp = data.initTimestamp || getISOTime();
    this.endTimestamp = data.endTimestamp;
    this.agentId = data.agentId || checkCallStackForAgentId();
    this.id = data.id || uuidv4();
    this.threadId = data.threadId;
    this.prompt = data.prompt;
    this.promptTokens = data.promptTokens;
    this.completion = data.completion;
    this.completionTokens = data.completionTokens;
    this.model = data.model;
  }
}

// ToolEvent class
export class ToolEventClass implements ToolEvent {
  eventType: EventType = EventType.TOOL;
  params?: Record<string, any>;
  returns?: any;
  initTimestamp: string;
  endTimestamp?: string;
  agentId?: string;
  id: string;
  name?: string;
  logs?: string | Record<string, any>;

  constructor(data: Partial<ToolEvent>) {
    this.params = data.params;
    this.returns = data.returns;
    this.initTimestamp = data.initTimestamp || getISOTime();
    this.endTimestamp = data.endTimestamp;
    this.agentId = data.agentId || checkCallStackForAgentId();
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.logs = data.logs;
  }
}

// ErrorEvent class
export class ErrorEventClass implements ErrorEvent {
  triggerEvent?: Event;
  triggerEventId?: string;
  triggerEventType?: EventType;
  errorType?: string;
  code?: string;
  details?: string | Record<string, string>;
  logs?: string;
  timestamp: string;

  constructor(data: Partial<ErrorEvent>) {
    this.triggerEvent = data.triggerEvent;
    this.triggerEventId = data.triggerEventId;
    this.triggerEventType = data.triggerEventType;
    this.errorType = data.errorType;
    this.code = data.code;
    this.details = data.details;
    this.logs = data.logs;
    this.timestamp = data.timestamp || getISOTime();
  }
}
