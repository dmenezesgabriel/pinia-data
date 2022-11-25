export default interface IFilterParameters {
  [index: string]: string | Array<string> | undefined;
  fieldName: string; // expected filed from database to be filtered
  title: string; // Filter title, or alias
  crossStores?: Array<string>;
}
