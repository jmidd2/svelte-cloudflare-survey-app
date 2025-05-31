import { formElements } from '$lib/index';
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, 'children'>
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

export function genSlug({ label, id }: SelectFormField): string {
  return `${label.toLowerCase().replaceAll(' ', '-')}-${id}`;
}

export function isHtmlFormField(
  fieldType: unknown
): fieldType is HtmlFormElements {
  return formElements.includes(<HtmlFormElements>fieldType);
}

export function isFormFieldData(data: unknown): data is SelectFormField {
  return (
    !!(data as SelectFormField).createdAt &&
    !!(data as SelectFormField).updatedAt &&
    !!(data as SelectFormField).id &&
    !!(data as SelectFormField).formId &&
    !!(data as SelectFormField).type &&
    !!(data as SelectFormField).label &&
    (data as SelectFormField).required !== undefined &&
    !!(data as SelectFormField).orderIndex
  );
}

export function isSelectFormField(field: unknown): field is SelectFormField {
  return (
    (field as SelectFormField).formId !== undefined &&
    (field as SelectFormField).id !== undefined &&
    (field as SelectFormField).type !== undefined &&
    isHtmlFormField((field as SelectFormField).type) &&
    (field as SelectFormField).label !== undefined &&
    (field as SelectFormField).required !== undefined &&
    (field as SelectFormField).placeholder !== undefined &&
    (field as SelectFormField).orderIndex !== undefined &&
    ((((field as SelectFormField).type === 'select' ||
      (field as SelectFormField).type === 'radio' ||
      (field as SelectFormField).type === 'checkbox') &&
      Array.isArray((field as SelectFormField).options)) ||
      (field as SelectFormField).options === null)
  );
}
