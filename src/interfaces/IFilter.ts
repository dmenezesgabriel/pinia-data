export default interface IFilter {
  [index: string]: string | IOption[] | string[] | undefined;
  id: string; // Represents the data key(field) to be filtered, must be unique
  title: string; // Filter title, or alias
  options: IOption[]; // Filter options
  store: string; //store Id
  crossStores?: string[]; // Store Ids
  exclude?: string[];
}

export interface IOption {
  [index: string]: string | boolean;
  name: string;
  available: boolean;
  visible: boolean;
  exclude: boolean;
}
