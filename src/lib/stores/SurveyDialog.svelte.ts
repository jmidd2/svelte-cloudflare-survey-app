import { getContext, setContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export class DialogManager<T extends string> {
  activeDialog = $state<T | null>(null);
  private readonly dialogState: SvelteMap<T, boolean>;

  constructor(dialogs: readonly T[]) {
    this.dialogState = new SvelteMap();

    for (const dialog of dialogs) {
      this.dialogState.set(dialog, false);
    }
  }

  openDialog(dialog: T) {
    // Only allow opening a new dialog if no dialog is currently active
    if (!this.activeDialog) {
      // Close all dialogs first
      this.closeDialog();

      // Open the requested dialog
      this.dialogState.set(dialog, true);
      this.activeDialog = dialog;
    }
  }

  closeDialog() {
    // Close all dialogs
    for (const [dialog] of this.dialogState) {
      this.dialogState.set(dialog, false);
    }
    this.activeDialog = null;
  }

  isDialogOpen(dialog: T): boolean {
    return this.dialogState.get(dialog) ?? false;
  }

  getDialogState(dialog: T) {
    return this.dialogState.get(dialog) ?? false;
  }
}

const DIALOG_CONTEXT_KEY = Symbol('dialog-context');

export function setDialogContext<T extends string>(
  dialogManager: DialogManager<T>
) {
  setContext(DIALOG_CONTEXT_KEY, dialogManager);
}

export function getDialogContext<T extends string>(): DialogManager<T> {
  const context = getContext<DialogManager<T>>(DIALOG_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      'Dialog context not found. Make sure to call setDialogContext in a parent component.'
    );
  }
  return context;
}

// Type-specific implementation for your survey dialogs
type SurveyDialogType = 'edit' | 'settings' | 'share';
export type SurveyDialogManager = DialogManager<SurveyDialogType>;

export const surveyDialogManager = new DialogManager([
  'edit',
  'settings',
  'share',
] as const);
