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
  sortedData?: { orderIndex: number; id: string }[];
  removedId?: string;
};
