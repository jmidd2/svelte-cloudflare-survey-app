import { getContext, setContext } from 'svelte';

const DATA_STATUS_CONTEXT_KEY = Symbol('breadcrumb-status');

export type DataStatus = {
  isLoading: boolean;
  isSaved: boolean;
};

export function setDataStatusContext(status: DataStatus) {
  return setContext(DATA_STATUS_CONTEXT_KEY, status);
}

export function getDataStatusContext(): DataStatus {
  const status = getContext<DataStatus>(DATA_STATUS_CONTEXT_KEY);
  if (!status) {
    throw new Error(
      'Breadcrumb status not found in context. Make sure to call setBreadcrumbContext in a parent component.'
    );
  }
  return status;
}
