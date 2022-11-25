/*
 * For easier comprehension, for a data array of objects as the following
 * [{key: value}, {key: value}] is assumed that every object {key: value} is
 * a row, every key is a column name and every value is the respective value
 * for that row and column.
 *
 * TODO
 * Remove repeated logic on calculation methods.
 */
import type { IDatum } from "../interfaces/IData";
import type { IOption } from "../interfaces/IFilter";
import type IFilter from "../interfaces/IFilter";
import { msToTime } from "../utils/time";

export const getAttributeValues = (data: any, columnName: string): any[] => {
  /**
   * Extract all objects atributes values from an object array
   * @param {} data
   * @param {string} columnName
   * @returns {Array<any>}
   */

  const result = new Array(data.length);
  for (let index = 0; index < data.length; index++) {
    result[index] = data[index][columnName];
  }
  return result;
};

export const getUniqueAttributeValues = (
  data: any,
  columnName: string
): any[] => {
  /**
   * Make options for multiselect dropdown from array of objects
   * @param {} data
   * @param {string} columnName
   * @returns {Set}
   */
  return [...new Set(getAttributeValues(data, columnName))];
};

export const rowMatchFilter = (row: any, filters: IFilter[]) => {
  /**
   * Check if row should be available according to current filters
   * @param {any} row
   * @param {IFilter[]} filters
   * @returns {boolean}
   */
  // BOTTLENECK FUNCTION
  const result = new Array(filters.length);
  for (let filtersIndex = 0; filtersIndex < filters.length; filtersIndex++) {
    const filter = filters[filtersIndex];
    if (filter.id in row) {
      // Check if the value tha is being filtered is present
      const propertyValueMatches = filter.options
        .filter((option: IOption) => option.available === true)
        .map((option: IOption) => option.name)
        .includes(row[filter.id]);
      result.push(propertyValueMatches);
    } else {
      // If the filter id does not correspond to any attribute name
      // (object atribute name), don't apply any filter, just return
      // the item
      result.push(true);
    }
  }
  return result.every((element) => element === true);
};

export const filterData = (data: any, filters: IFilter[]) => {
  //----------------------------- Time ------------------------------------- //
  const start = new Date().getTime();
  //----------------------------- Time ------------------------------------- //
  // BOTTLENECK FUNCTION
  const result = data.filter((item: IDatum) => {
    // A row should be returned only if all the values match with the
    // filter as the id has the same value of the column name
    const shouldReturnItem = rowMatchFilter(item, filters);
    if (shouldReturnItem) {
      // Return the row if it's column's values 're in the filter's
      // selection
      return item;
    } else {
      // If none of the values of the items's attributes is present in
      // filter's selection don't return the items
      return;
    }
  });

  //----------------------------- Took ------------------------------------- //
  const duration = new Date().getTime() - start;
  console.log("filterData" + " " + msToTime(duration));
  //----------------------------- Took ------------------------------------- //
  return result;
};

export const sumData = (data: any, key: string): number => {
  /**
   * Sum values for a given key in an array object
   * @param {any} data
   * @param {String} key
   * @returns {number}
   */

  let result = 0;
  for (let index = 0; index < data.length; index++) {
    result += data[index][key];
  }

  return result;
};

export const varianceData = (
  data: any,
  aValueKey: string,
  bValueKey: string
) => {
  /**
   * (a - b) / b
   * @param {any} data
   * @param {String} groupBy
   * @param {String} aValueKey
   * @param {String} bValueKey
   */

  const acc: any = {};
  acc[aValueKey] = 0;
  acc[bValueKey] = 0;
  for (const row of data) {
    acc[aValueKey] += row[aValueKey];
    acc[bValueKey] += row[bValueKey];
  }

  return (acc[aValueKey] - acc[bValueKey]) / acc[bValueKey];
};

export const groupBySumData = (data: any, groupKey: string, sumKey: string) => {
  /**
   * @param {any} data
   * @param {String} groupBy
   * @param {String} sumKey
   */

  const result: any = [];
  const acc: any = {};
  for (const row of data) {
    const objectGroup: string = row[groupKey];
    if (!(objectGroup in acc)) {
      const newObject: Record<string, string | number> = {};
      newObject[groupKey] = objectGroup;
      newObject[sumKey] = 0;
      acc[objectGroup] = newObject;
      result.push(newObject);
    }
    acc[objectGroup][sumKey] += row[sumKey];
  }

  return result;
};

export const groupBySumDataByEpoch = (
  data: any,
  groupKey: string,
  sumKey: string
) => {
  /**
   * @param {any} data
   * @param {String} groupBy
   * @param {String} sumKey
   */

  const result: any = [];
  const acc: any = {};
  for (const row of data) {
    // TODO
    // remove duplicated logic of groupBySumData
    const date = new Date(row[groupKey]);
    const objectGroup: string = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).toISOString();

    if (!(objectGroup in acc)) {
      const newObject: IDatum = {};
      newObject[groupKey] = objectGroup;
      newObject[sumKey] = 0;
      acc[objectGroup] = newObject;
      result.push(newObject);
    }
    acc[objectGroup][sumKey] += row[sumKey];
  }

  return result;
};

export const groupByPercentOfTotalData = (
  data: any,
  groupKey: string,
  sumKey: string
) => {
  /**
   * @param {any} data
   * @param {String} groupBy
   * @param {String} sumKey
   */

  const groupedData = groupBySumData(data, groupKey, sumKey);
  const totalSum = groupedData.reduce((acc: number, obj: any) => {
    return acc + obj[sumKey];
  }, 0);

  const result = groupedData.map((obj: any) => {
    obj[sumKey] = obj[sumKey] / totalSum;
    return obj;
  });

  return result;
};

export const groupByDoDataVariance = (
  data: any,
  groupKey: string,
  aValueKey: string,
  bValueKey: string
) => {
  /**
   * (a -b) / b
   * @param {any} data
   * @param {String} groupKey
   * @param {String} aValueKey
   * @param {String} bValueKey
   */

  const aggData: any = [];
  const acc: any = {};

  for (const row of data) {
    const objectGroup: string = row[groupKey].toString();
    if (!(objectGroup in acc)) {
      const newObject: IDatum = {};
      newObject[groupKey] = objectGroup;
      newObject[aValueKey] = 0;
      newObject[bValueKey] = 0;
      acc[objectGroup] = newObject;
      aggData.push(newObject);
    }
    acc[objectGroup][aValueKey] += row[aValueKey];
    acc[objectGroup][bValueKey] += row[bValueKey];
  }

  const result = aggData.map((obj: IDatum) => {
    obj["variance"] = (+obj[aValueKey] - +obj[bValueKey]) / +obj[bValueKey];
    return obj;
  });

  return result;
};

export const groupByDoDataVarianceByEpoch = (
  data: any,
  groupKey: string,
  aValueKey: string,
  bValueKey: string
) => {
  /**
   * (a -b) / b
   * @param {any} data
   * @param {String} groupKey
   * @param {String} aValueKey
   * @param {String} bValueKey
   */

  const aggData: any = [];
  const acc: any = {};

  for (const row of data) {
    // TODO
    // remove duplicated logic of groupByDoDataVariance
    const date = new Date(row[groupKey]);
    const objectGroup: string = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).toISOString();

    if (!(objectGroup in acc)) {
      const newObject: IDatum = {};
      newObject[groupKey] = objectGroup;
      newObject[aValueKey] = 0;
      newObject[bValueKey] = 0;
      acc[objectGroup] = newObject;
      aggData.push(newObject);
    }
    acc[objectGroup][aValueKey] += row[aValueKey];
    acc[objectGroup][bValueKey] += row[bValueKey];
  }

  const result = aggData.map((obj: IDatum) => {
    obj["variance"] = (+obj[aValueKey] - +obj[bValueKey]) / +obj[bValueKey];
    return obj;
  });

  return result;
};
