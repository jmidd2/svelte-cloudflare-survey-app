export type PageState = {
  state: 'idle' | 'loading';
  isLoading: boolean;
  isSaved: boolean;
};
export const pageState: PageState = $state({
  state: 'idle',
  isLoading: false,
  isSaved: false,
});
