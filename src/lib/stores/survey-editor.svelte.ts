// src/lib/components/survey-editor/survey-editor.svelte.ts
import { invalidate } from '$app/navigation';
import { generatePreviewFieldData } from '$lib/dnd';
import type { SelectForm, SelectFormField } from '$lib/server/db/schema';
import type { FormFieldType } from '$lib/types';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { getContext, setContext } from 'svelte';

export class SurveyEditor {
  // Reactive state
  survey = $state<SelectForm>();
  fields = $state<SelectFormField[]>([]);
  selectedIndex = $state(-1);
  private performingAsyncAction = $state<boolean | null>(null);
  isSaved = $state(false);
  error = $state<string | null>(null);

  // Derived state
  selectedField = $derived(
    this.selectedIndex >= 0 ? this.fields[this.selectedIndex] : null
  );

  constructor(survey: SelectForm, fields: SelectFormField[]) {
    this.survey = survey;
    this.fields = fields;

    $effect(() => {
      if (this.performingAsyncAction === null) return;
      const clearIsSaved = () => {
        this.isSaved = false;
      };
      let timeout: NodeJS.Timeout;
      if (!this.error && this.isSaved && !this.performingAsyncAction) {
        timeout = setTimeout(clearIsSaved, 1000);
      }

      return () => {
        if (timeout) clearTimeout(timeout);
      };
    });

    $effect(() => {
      if (this.performingAsyncAction !== null) {
        if (!(this.error || this.performingAsyncAction)) {
          this.isSaved = true;
        }
      }
    });
  }

  private async withLoading<T>(
    operation: () => Promise<T>,
    delay = 1000
  ): Promise<T> {
    console.log('performing async action');
    this.performingAsyncAction = true;
    try {
      return await operation();
    } finally {
      setTimeout(() => {
        this.performingAsyncAction = false;
      }, delay);
    }
  }

  set loading(isLoading: boolean) {
    if (isLoading) {
      this.performingAsyncAction = isLoading;
    } else {
      setTimeout(() => {
        this.performingAsyncAction = isLoading;
      }, 1000);
    }
  }

  get isLoading() {
    return this.performingAsyncAction;
  }

  // Selection methods
  selectField(index: number) {
    if (this.selectedIndex === index) {
      this.selectedIndex = -1;
    } else {
      this.selectedIndex = index;
    }
  }

  selectFieldById(fieldId: string) {
    const index = this.fields.findIndex(f => f.id === fieldId);
    if (index >= 0) {
      this.selectField(index);
    }
  }

  // Field management
  updateField(updates: Partial<SelectFormField>) {
    if (this.fields[this.selectedIndex]) {
      this.fields[this.selectedIndex] = {
        ...this.fields[this.selectedIndex],
        ...updates,
      };
    }
  }

  removeField(fieldId: string) {
    this.fields = this.fields.filter(({ id }) => id !== fieldId);

    this.selectedIndex = -1;
  }

  async saveReorder(newFields: SelectFormField[]) {
    return this.withLoading(async () => {
      if (!this.survey) return;
      const selectedId = this.selectedField?.id;
      this.fields = newFields;

      // Maintain selection after reorder
      if (selectedId) {
        this.selectedIndex = newFields.findIndex(f => f.id === selectedId);
      }

      const formData = new FormData();
      formData.append('formId', this.survey.id);
      formData.append('sortedData', JSON.stringify(this.fields));

      try {
        await fetch('?/reorder', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to reorder fields:', error);
        this.error = String(error);
      }
    });
  }

  // Server operations
  async saveField(fieldId: string, updates: Partial<SelectFormField>) {
    return this.withLoading(async () => {
      const formData = new FormData();
      formData.append('fieldId', fieldId);
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }

      try {
        const response = await fetch('?/saveField', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidate('survey-fields:latest');
          return { success: true };
        }

        return { success: false, error: 'Failed to save field' };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
  }

  async deleteField(fieldId: string) {
    return this.withLoading(async () => {
      const index = this.fields.findIndex(f => f.id === fieldId);
      if (index < 0) return;

      // Optimistic update
      this.removeField(fieldId);

      const formData = new FormData();
      formData.append('fieldId', fieldId);

      try {
        await fetch('?/deleteFormField', {
          method: 'POST',
          body: formData,
        });
        await invalidate('survey-fields:latest');
      } catch (error) {
        // Revert on error - would need to store previous state
        console.error('Failed to delete field:', error);
        this.error = String(error);
      }
    });
  }

  async addFirstField(elementType: FormFieldType) {
    return this.withLoading(async () => {
      if (!this.survey) return;

      const fieldData = generatePreviewFieldData(elementType, this.survey.id);

      const formData = new FormData();
      formData.append('formId', this.survey.id);
      formData.set('orderIndex', String(1));

      for (const [key, value] of Object.entries(fieldData)) {
        if (value !== undefined && value !== null) {
          if (key === 'options' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      }

      try {
        const response = await fetch('?/addFormField', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidate('survey-fields:latest');
          // return { success: true };
        }

        // return { success: false, error: 'Failed to add field' };
      } catch (e) {
        console.error('Failed to add field:', e);
        this.error = String(e);
      }
    });
  }

  async addField(
    elementType: FormFieldType,
    closestEdgeOfTarget: Edge | null,
    indexOfTarget: number
  ) {
    return this.withLoading(async () => {
      if (!this.survey) return;

      const fieldData = generatePreviewFieldData(elementType, this.survey.id);

      const formData = new FormData();
      formData.append('formId', this.survey.id);

      this.fields = reorderWithEdge({
        closestEdgeOfTarget,
        axis: 'vertical',
        list: [...this.fields, fieldData],
        startIndex: this.fields.length,
        indexOfTarget,
      }).map((f, i) => {
        if (f.id === fieldData.id) {
          this.selectedIndex = i;
          formData.set('orderIndex', String(i + 1));
        }
        return { ...f, orderIndex: i + 1 };
      });

      for (const [key, value] of Object.entries(fieldData)) {
        if (value !== undefined && value !== null) {
          if (key === 'options' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      }

      // const addedFieldIndex = this.fields.findIndex(f => f.id === fieldData.id);
      // if (addedFieldIndex < 0) throw new Error('added field not found');
      //
      // this.selectedIndex = addedFieldIndex;
      // formData.set('orderIndex', String(this.fields[addedFieldIndex].orderIndex));

      try {
        const response = await fetch('?/addFormField', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidate('survey-fields:latest');
          // return { success: true };
        }

        // return { success: false, error: 'Failed to add field' };
      } catch (e) {
        console.error('Failed to add field:', e);
        this.error = String(e);
      }
    });
  }

  async reorderFieldsOnServer(orderedFields: SelectFormField[]) {
    throw new Error(
      `reorderFieldsOnServer not implemented, args: ${orderedFields}`
    );
  }
}

const SURVEY_EDITOR_KEY = Symbol('survey-editor');

export function setSurveyEditor(editor: SurveyEditor) {
  return setContext(SURVEY_EDITOR_KEY, editor);
}

export function getSurveyEditor(): SurveyEditor {
  const editor = getContext<SurveyEditor>(SURVEY_EDITOR_KEY);
  if (!editor) {
    throw new Error(
      'SurveyEditor not found in context. Make sure to call setSurveyEditor in a parent component.'
    );
  }
  return editor;
}
