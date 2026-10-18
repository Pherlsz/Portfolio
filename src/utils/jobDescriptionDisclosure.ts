export type JobDescriptionEditorAction =
  | { type: 'clear' }
  | { type: 'job_submitted' }
  | { type: 'expand' }
  | { type: 'collapse' };

export type JobDescriptionEditorState = {
  expanded: boolean;
};

export const initialJobDescriptionEditorState: JobDescriptionEditorState = {
  expanded: false
};

export function jobDescriptionEditorReducer(
  state: JobDescriptionEditorState,
  action: JobDescriptionEditorAction
): JobDescriptionEditorState {
  switch (action.type) {
    case 'clear':
      return initialJobDescriptionEditorState;
    case 'job_submitted':
      return { expanded: false };
    case 'expand':
      return { expanded: true };
    case 'collapse':
      return { expanded: false };
    default:
      return state;
  }
}

/** After the first successful job submit, show the compact disclosure until expanded. */
export function showCollapsedJobDescription(
  activeJob: string | null,
  editor: JobDescriptionEditorState
): boolean {
  return Boolean(activeJob) && !editor.expanded;
}

export function truncateJobDescriptionPreview(text: string, maxLength = 72): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;
  return `${flat.slice(0, maxLength - 1)}…`;
}
