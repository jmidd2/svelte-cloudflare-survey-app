import { getContext, setContext } from 'svelte';

const BREADCRUMB_CONTEXT_KEY = Symbol('breadcrumb-status');

export type BreadcrumbStatus = {
  isLoading: boolean;
  isSaved: boolean;
};

export function setBreadcrumbContext(status: BreadcrumbStatus) {
  return setContext(BREADCRUMB_CONTEXT_KEY, status);
}

export function getBreadcrumbContext(): BreadcrumbStatus {
  const status = getContext<BreadcrumbStatus>(BREADCRUMB_CONTEXT_KEY);
  if (!status) {
    throw new Error(
      'Breadcrumb status not found in context. Make sure to call setBreadcrumbContext in a parent component.'
    );
  }
  return status;
}
