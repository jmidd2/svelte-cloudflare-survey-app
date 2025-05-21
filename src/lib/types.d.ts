export type HtmlFormElements =
  | 'checkbox'
  | 'date'
  | 'email'
  | 'number'
  | 'radio'
  | 'range'
  | 'tel'
  | 'text'
  | 'textarea'
  | 'select'
  | 'yes-no';

declare function saveSorted(args: SaveSortedFnArgs): Promise<void>;

export type SaveSortedFnArgs = {
  sortedList: { orderIndex: number; id: string }[];
  removedId?: string;
  surveyId: string;
};
