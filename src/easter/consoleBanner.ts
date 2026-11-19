let printed = false;

const ASCII_MARK = [
  '       _               _           _            ',
  '  _ __ | |__   ___ _ __| |___    __| | _____   __',
  ' | \'_ \\| \'_ \\ / _ \\ \'__| / __|  / _` |/ _ \\ \\ / /',
  ' | |_) | | | |  __/ |  | \\__ \\ | (_| |  __/\\ V / ',
  ' | .__/|_| |_|\\___|_|  |_|___/  \\__,_|\\___| \\_/  ',
  ' |_|                                             '
].join('\n');

export function printConsoleBanner(): void {
  if (printed || typeof window === 'undefined' || typeof console === 'undefined') {
    return;
  }
  printed = true;

  console.log(
    `%c${ASCII_MARK}`,
    'color: #dff55c; background: #141513; padding: 10px 14px; border-radius: 10px; font-family: monospace; line-height: 1.25;'
  );
  console.log(
    '%cpherls.dev %cestá contratando? digite /vaga no chat ou confira /llms.txt e /cv.json.',
    'font-weight: 700; color: #141513; background: #e7f25a; padding: 2px 6px; border-radius: 4px;',
    'color: #686c64; padding-left: 4px;'
  );
}
