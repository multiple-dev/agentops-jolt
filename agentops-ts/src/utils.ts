export function getISOTime(): string {
  return new Date().toISOString();
}

export function isJsonable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}

export function filterUnjsonable(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(filterUnjsonable);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (key !== 'self' && value !== undefined && value !== null) {
        acc[key] = filterUnjsonable(value);
      }
      return acc;
    }, {} as Record<string, any>);
  } else if (isJsonable(obj)) {
    return obj;
  } else {
    return '';
  }
}

export function safeSerialize(obj: any): string {
  const cleaned = filterUnjsonable(obj);
  return JSON.stringify(cleaned, (key, value) => {
    if (value instanceof Error) {
      return `[${value.constructor.name}: ${value.message}]`;
    }
    return value;
  });
}

export function checkCallStackForAgentId(): string | undefined {
  const stack = new Error().stack;
  if (!stack) {
    return undefined;
  }

  const frames = stack.split('\n').slice(1);
  for (const frame of frames) {
    const match = frame.match(/at (?:new )?([\w$]+)/);
    if (match) {
      const funcName = match[1];
      if (funcName === 'Object' || funcName === 'Function') {
        continue;
      }
      const func = global[funcName];
      if (typeof func === 'function' && func.agent_ops_agent_id) {
        return func.agent_ops_agent_id;
      }
    }
  }

  return undefined;
}

export type Jsonable = string | number | boolean | null | Jsonable[] | { [key: string]: Jsonable };

export type SerializationOptions = Partial<{
  unsafe: boolean;
  maxDepth: number;
  maxStringLength: number;
  maxArrayLength: number;
  maxObjectKeys: number;
}>;
