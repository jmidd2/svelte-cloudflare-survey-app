import type { HtmlFormElements } from '$lib/types';
export const formElements: HtmlFormElements[] = [
  'text',
  'checkbox',
  'date',
  'email',
  'number',
  'radio',
  'range',
  'tel',
  'textarea',
  'select',
] as const;

export const formElementTags: Record<HtmlFormElements, string> = {
  checkbox: 'Checkbox',
  date: 'Date',
  email: 'Email',
  number: 'Number',
  radio: 'Radio',
  range: 'Range',
  tel: 'Telephone',
  text: 'Textbox',
  textarea: 'Textarea',
  select: 'Select',
  'yes-no': 'Yes/No',
} as const;
