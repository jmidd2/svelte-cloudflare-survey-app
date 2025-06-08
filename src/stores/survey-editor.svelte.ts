// src/lib/components/survey-editor/survey-editor.svelte.ts
import { invalidate } from '$app/navigation';
import { generateFormFieldData } from '$lib/dnd';
import type {
  InsertFormField,
  SelectForm,
  SelectFormField,
} from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { getContext, setContext } from 'svelte';

export class SurveyEditor {
  // Reactive state
  survey = $state<SelectForm>();
  fields = $state<SelectFormField[]>([]);
  selectedIndex = $state(-1);
  isLoading = $state(false);

  // Derived state
  selectedField = $derived(
    this.selectedIndex >= 0 ? this.fields[this.selectedIndex] : null
  );

  constructor(survey: SelectForm, fields: SelectFormField[]) {
    this.survey = survey;
    this.fields = fields;
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

  removeField(index: number) {
    this.fields = this.fields.filter((_, i) => i !== index);

    // Adjust selection
    if (this.selectedIndex === index) {
      this.selectedIndex = -1;
    } else if (this.selectedIndex > index) {
      this.selectedIndex--;
    }
  }

  async saveReorder(newFields: SelectFormField[]) {
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
    }
  }

  // Server operations
  async saveField(fieldId: string, updates: Partial<SelectFormField>) {
    this.isLoading = true;

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
    } finally {
      this.isLoading = false;
    }
  }

  async deleteField(fieldId: string) {
    const index = this.fields.findIndex(f => f.id === fieldId);
    if (index < 0) return;

    // Optimistic update
    this.removeField(index);

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
    }
  }

  async addField(
    elementType: HtmlFormElements,
    closestEdgeOfTarget: Edge | null,
    indexOfTarget: number
  ) {
    if (!this.survey) return;

    this.isLoading = true;

    const fieldData = generateFormFieldData(elementType);

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
    } finally {
      this.isLoading = false;
    }
  }

  async reorderFieldsOnServer(orderedFields: SelectFormField[]) {}
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
