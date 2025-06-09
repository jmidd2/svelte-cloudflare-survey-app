import {
  FIELD_FEATURES,
  FORM_FIELD_TYPES,
  type FormFieldType,
} from '$lib/types.d';
import {
  Calendar,
  Check,
  ChevronsLeftRightEllipsis,
  Hash,
  type Icon as IconType,
  List,
  ListTodo,
  Mail,
  Phone,
  Text,
  TextCursorInput,
} from '@lucide/svelte';

// Helper function to get all field types as array
export function getAllFieldTypes(): readonly FormFieldType[] {
  return Object.values(FORM_FIELD_TYPES);
}

// Helper function to check if a value is a valid field type
export function isValidFieldType(value: unknown): value is FormFieldType {
  return (
    typeof value === 'string' &&
    Object.values(FORM_FIELD_TYPES).includes(value as FormFieldType)
  );
}

// Field configuration with metadata
export const FIELD_DATA: Record<
  FormFieldType,
  {
    label: string;
    icon: typeof IconType;
    type: HTMLInputElement['type'] | 'textarea' | 'select';
  }
> = {
  [FORM_FIELD_TYPES.CHECKBOX]: {
    label: 'Checkbox',
    icon: ListTodo,
    type: 'checkbox',
  },
  [FORM_FIELD_TYPES.DATE]: {
    label: 'Date',
    icon: Calendar,
    type: 'date',
  },
  [FORM_FIELD_TYPES.EMAIL]: {
    label: 'Email',
    icon: Mail,
    type: 'email',
  },
  [FORM_FIELD_TYPES.NUMBER]: {
    label: 'Number',
    icon: Hash,
    type: 'number',
  },
  [FORM_FIELD_TYPES.RADIO]: {
    label: 'Radio',
    icon: List,
    type: 'radio',
  },
  [FORM_FIELD_TYPES.RANGE]: {
    label: 'Range',
    icon: ChevronsLeftRightEllipsis,
    type: 'range',
  },
  [FORM_FIELD_TYPES.TEL]: {
    label: 'Telephone',
    icon: Phone,
    type: 'tel',
  },
  [FORM_FIELD_TYPES.TEXT]: {
    label: 'Textbox',
    icon: TextCursorInput,
    type: 'text',
  },
  [FORM_FIELD_TYPES.TEXTAREA]: {
    label: 'Textarea',
    icon: Text,
    type: 'textarea',
  },
  [FORM_FIELD_TYPES.SELECT]: {
    label: 'Select',
    icon: List,
    type: 'select',
  },
  [FORM_FIELD_TYPES.YES_NO]: {
    label: 'Yes/No',
    icon: Check,
    type: 'toggle',
  },
} as const;

// Derived objects for easy access
export const FIELD_LABELS: Record<FormFieldType, string> = Object.fromEntries(
  Object.entries(FIELD_DATA).map(([key, value]) => [key, value.label])
) as Record<FormFieldType, string>;

export const FIELD_ICONS: Record<FormFieldType, typeof IconType> =
  Object.fromEntries(
    Object.entries(FIELD_DATA).map(([key, value]) => [key, value.icon])
  ) as Record<FormFieldType, typeof IconType>;

// Legacy exports for backward compatibility
export const FIELD_TYPES_WITH_OPTIONS = FIELD_FEATURES.SUPPORTS_OPTIONS;
export const FIELD_TYPES_WITH_PLACEHOLDER = FIELD_FEATURES.SUPPORTS_PLACEHOLDER;
export const ALL_FIELD_TYPES = getAllFieldTypes();
