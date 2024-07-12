export function getISOTime(): string {
  return new Date().toISOString();
}

export function safeSerialize(obj: any): string {
  const seenObjects = new WeakMap();

  function replacer(key: string, value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (seenObjects.has(value)) {
        return `[Circular ~]`;
      }
      seenObjects.set(value, true);
    }

    if (value === undefined) {
      return '[undefined]';
    }

    if (typeof value === 'function') {
      return `[Function: ${value.name}]`;
    }

    return value;
  }

  return JSON.stringify(obj, replacer);
}

export function getAgentOpsVersion(): string {
  return '0.1.0'; // TODO: Get version from package.json
}
