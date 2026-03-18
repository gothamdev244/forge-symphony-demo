import { executeRunCommand } from '../run.js';
import * as runModule from '../run.js';

describe('run command', () => {
  test('--dry-run prints message and exits', async () => {
    // Capture console output
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg?: any) => logs.push(String(msg));

    // Spy on process.exit
    const origExit = process.exit;
    let exitCode: number | undefined;
    // @ts-ignore
    process.exit = (code?: number) => { exitCode = code ?? 0; throw new Error('process.exit'); };

    try {
      await executeRunCommand(['--dry-run']);
    } catch (e) {
      // expected
    } finally {
      console.log = origLog;
      process.exit = origExit;
    }

    expect(logs.some(l => l.includes('DRY RUN: would execute tasks'))).toBe(true);
    expect(exitCode).toBe(0);
  });
});
