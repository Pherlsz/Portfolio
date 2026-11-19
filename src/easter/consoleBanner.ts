let printed = false;

export function printConsoleBanner(): void {
  if (printed || typeof window === 'undefined' || typeof console === 'undefined') {
    return;
  }
  printed = true;

  console.log(
    '%c pherls.dev %c Pedro Henrique Lopes · Software Engineer ',
    'font-family: ui-monospace, monospace; font-size: 13px; font-weight: 800; color: #141513; background: #e7f25a; padding: 4px 8px; border-radius: 6px 0 0 6px;',
    'font-family: ui-monospace, monospace; font-size: 12px; font-weight: 600; color: #f4f4f0; background: #141513; padding: 4px 10px; border-radius: 0 6px 6px 0;'
  );
  console.log(
    '%cComandos no chat:%c /vaga · /resumo · /contato · /v1\n%cEndpoints para IA:%c /llms.txt · /cv.md · /cv.json',
    'font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #a8aca3;',
    'font-family: ui-monospace, monospace; font-size: 11px; color: #dff55c;',
    'font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #a8aca3;',
    'font-family: ui-monospace, monospace; font-size: 11px; color: #dff55c;'
  );
}
