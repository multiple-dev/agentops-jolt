export enum EventType {
  LLM = 'llms',
  ACTION = 'actions',
  API = 'apis',
  TOOL = 'tools',
  ERROR = 'errors'
}

export enum EndState {
  SUCCESS = 'Success',
  FAIL = 'Fail',
  INDETERMINATE = 'Indeterminate'
}

// Export the enums as a namespace for backwards compatibility
export namespace Enums {
  export import EventType = EventType;
  export import EndState = EndState;
}
