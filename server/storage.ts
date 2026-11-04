import fs from 'fs';

/**
 * Thrown when a JSON store cannot be parsed. The corrupt file is renamed to
 * `<file>.corrupt-<timestamp>` (never overwritten) so the data stays recoverable.
 */
export class StorageCorruptError extends Error {
  constructor(public readonly file: string, public readonly quarantinedTo: string, cause: unknown) {
    super(`Storage file ${file} is corrupt; quarantined to ${quarantinedTo}: ${(cause as Error)?.message ?? cause}`);
    this.name = 'StorageCorruptError';
  }
}

export function readStorage(file: string): any[] {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('top-level value is not an array');
    return parsed;
  } catch (cause) {
    const quarantinedTo = `${file}.corrupt-${Date.now()}`;
    fs.renameSync(file, quarantinedTo);
    console.error(`[storage] ${file} corrupt; moved to ${quarantinedTo}`);
    throw new StorageCorruptError(file, quarantinedTo, cause);
  }
}

/** Write to a temp file then rename, so a crash mid-write cannot truncate the store. */
export function writeStorage(file: string, data: unknown[]): void {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
