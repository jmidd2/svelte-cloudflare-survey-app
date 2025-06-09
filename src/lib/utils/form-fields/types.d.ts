import type { SelectFormField } from '$lib/server/db/schema';
import type { FIELD_FEATURES } from '$lib/types';

export type FieldWithOptions = SelectFormField & {
  type: (typeof FIELD_FEATURES.SUPPORTS_OPTIONS)[number];
  options: NonNullable<SelectFormField['options']>;
};
