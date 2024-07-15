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
