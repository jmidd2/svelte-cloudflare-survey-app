export type PageState = { state: 'idle' | 'loading' };
export const pageState: PageState = $state({ state: 'idle' });
