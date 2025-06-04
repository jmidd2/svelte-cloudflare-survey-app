import { applyAction, deserialize } from '$app/forms';
import { goto } from '$app/navigation';
import type {
  InsertFormField,
  SelectForm,
  SelectFormField,
} from '$lib/server/db/schema';
import type { SaveSortedFnArgs } from '$lib/types';
import { isSelectFormField } from '$lib/utils';
import type { ActionResult } from '@sveltejs/kit';

export class SurveyManager {
  #survey = $state();
  #fields = $state([]);

  constructor(survey: any, fields: any[]) {
    this.#survey = survey;
    this.#fields = fields;
  }

  get survey() {
    return this.#survey;
  }
  set survey(surveys) {
    // any reactive side-effects
    // like saving the new order
    this.#survey = surveys;
  }

  get fields() {
    return this.#fields;
  }

  set fields(fields) {
    this.#fields = fields;
  }
}

export function createSurveyManager() {
  let survey = $state<SelectForm>();
  let fields = $state<SelectFormField[]>([]);
  let selectedIndex = $state<number>(-1);
  let selectedField = $derived<SelectFormField | null>(
    selectedIndex > -1 ? fields[selectedIndex] : null
  );

  function removeField(index: number) {
    if (fields.length > 0) {
      fields.splice(index, 1);

      // saveSorted();
    }
  }

  async function addFormField(field: InsertFormField) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(field)) {
      if (typeof value === 'string' || typeof value === 'number') {
        formData.set(key, value.toString());
      } else if (value instanceof Date) {
        formData.set(key, value.getTime().toString());
      } else if (key === 'options') {
        formData.set(
          key,
          new Blob([JSON.stringify(field[key])], { type: 'application/json' })
        );
      }
    }

    const response = await fetch('?/addFormField', {
      method: 'POST',
      body: formData,
      headers: {
        'x-svelte-action': 'true',
      },
    });

    const result: ActionResult<{ data: SelectFormField }, { message: string }> =
      deserialize(await response.text());

    if (result.type === 'success' && isSelectFormField(result.data)) {
      return result.data;
    }

    throw new Error('a valid form field was not created');
  }

  async function saveSorted(): Promise<void> {
    if (!survey || fields.length === 0) return;

    // if (args?.removedId) {
    //     sortedData = fields
    //         .filter(e => e.id !== args.removedId)
    //         .map((val, index) => {
    //             return {
    //                 orderIndex: index + 1,
    //                 id: val.id,
    //             };
    //         });
    // }

    const formData = new FormData();

    formData.set('formId', survey.id);

    formData.set(
      'sortedData',
      new Blob(
        [
          JSON.stringify(
            fields.map(item => ({ orderIndex: item.orderIndex, id: item.id }))
          ),
        ],
        { type: 'application/json' }
      )
    );

    const response = await fetch('?/reorder', {
      method: 'POST',
      body: formData,
      headers: {
        'x-svelte-action': 'true',
      },
    });

    const result: ActionResult<{ lastUpdated: Date }, { message: string }> =
      deserialize(await response.text());

    if (result.type === 'redirect') {
      await goto(result.location);
    }

    if (result.type === 'success') {
      const data = result.data;
      console.log('response', data);
    }
    applyAction(result);
  }

  return {
    get selectedField() {
      return selectedField;
    },
    set selectedField(sf) {
      selectedField = sf;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    set selectedIndex(index) {
      selectedIndex = index;
    },
    get survey() {
      return survey;
    },
    set survey(s) {
      survey = s;
    },
    get fields() {
      return fields;
    },
    set fields(f) {
      fields = f;
    },
    removeField,
    addFormField,
  };
}

export const surveyManager = createSurveyManager();
