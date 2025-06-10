// Form field type definitions with metadata
export const FORM_FIELD_TYPES = {
  // Text input fields
  TEXT: 'text',
  EMAIL: 'email',
  TEL: 'tel',
  NUMBER: 'number',

  // Date/time fields
  DATE: 'date',
  RANGE: 'range',

  // Text area
  TEXTAREA: 'textarea',

  // Selection fields
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',

  // Special fields
  YES_NO: 'yes-no',
} as const;

// Create the union type from the constant values
export type FormFieldType =
  (typeof FORM_FIELD_TYPES)[keyof typeof FORM_FIELD_TYPES];

// Field categorization for better organization
export const FIELD_CATEGORIES = {
  INPUT_TYPES: [
    FORM_FIELD_TYPES.TEXT,
    FORM_FIELD_TYPES.EMAIL,
    FORM_FIELD_TYPES.TEL,
    FORM_FIELD_TYPES.NUMBER,
    FORM_FIELD_TYPES.DATE,
    FORM_FIELD_TYPES.RANGE,
  ] as const,

  SELECTION_TYPES: [
    FORM_FIELD_TYPES.SELECT,
    FORM_FIELD_TYPES.RADIO,
    FORM_FIELD_TYPES.CHECKBOX,
  ] as const,

  TEXT_AREAS: [FORM_FIELD_TYPES.TEXTAREA] as const,

  SPECIAL_TYPES: [FORM_FIELD_TYPES.YES_NO] as const,
} as const;

// Feature support mapping
export const FIELD_FEATURES = {
  SUPPORTS_PLACEHOLDER: [
    FORM_FIELD_TYPES.TEXT,
    FORM_FIELD_TYPES.EMAIL,
    FORM_FIELD_TYPES.TEL,
    FORM_FIELD_TYPES.NUMBER,
    FORM_FIELD_TYPES.TEXTAREA,
  ] as const,

  SUPPORTS_OPTIONS: [
    FORM_FIELD_TYPES.SELECT,
    FORM_FIELD_TYPES.RADIO,
    FORM_FIELD_TYPES.CHECKBOX,
  ] as const,

  SUPPORTS_VALUE: Object.values(FORM_FIELD_TYPES) as readonly FormFieldType[],
} as const;

// Legacy type exports for backward compatibility
export type SaveSortedFnArgs = {
  sortedList: { orderIndex: number; id: string }[];
  removedId?: string;
  surveyId: string;
};

declare function saveSorted(args: SaveSortedFnArgs): Promise<void>;

// Backward compatibility alias - can be removed later
/** @deprecated Use FormFieldType instead */
export type HtmlFormElements = FormFieldType;
