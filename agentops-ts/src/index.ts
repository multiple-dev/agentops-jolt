import { Client } from './client';
import { Configuration } from './config';
import { Event, ActionEvent, LLMEvent, ToolEvent, ErrorEvent } from './event';
import { Session } from './session';
import { EventType, EndState } from './enums';
import { getISOTime, filterUnjsonable, safeSerialize } from './utils';

// Export main Client class
export { Client };

// Export Configuration
export { Configuration };

// Export Event classes
export { Event, ActionEvent, LLMEvent, ToolEvent, ErrorEvent };

// Export Session class
export { Session };

// Export enums
export { EventType, EndState };

// Export utility functions
export { getISOTime, filterUnjsonable, safeSerialize };

// Export convenience functions
export const init = (config: Configuration) => new Client(config);
export const startSession = (client: Client, tags?: string[]) => client.startSession(tags);
export const endSession = (client: Client, endState: EndState, endStateReason?: string) => client.endSession(endState, endStateReason);
export const record = (client: Client, event: Event) => client.record(event);
export const addTags = (client: Client, tags: string[]) => client.addTags(tags);
export const setTags = (client: Client, tags: string[]) => client.setTags(tags);
export const createAgent = (client: Client, name: string, agentId?: string) => client.createAgent(name, agentId);
