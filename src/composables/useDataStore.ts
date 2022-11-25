import { storeToRefs } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getUniqueAttributeValues,
  groupBySumData,
  groupByPercentOfTotalData,
  groupByDoDataVariance,
  sumData,
  groupBySumDataByEpoch,
  groupByDoDataVarianceByEpoch,
  varianceData,
} from "../utils/data";
import { requestFilter } from "../workers/worker-api";
import { msToTime } from "../utils/time";
import type IFilterParameters from "../interfaces/IFilterParameters";

// TODO fix this typescript BUG
type sumValues = (key: string) => any;
type varianceValues = (aValueKey: string, bValueKey: string) => any;

export const useDataStore = (storeId: string, filterStore: any) => {
  const { getLastEdited } = storeToRefs(filterStore);

  const getLastEditedTrigger = computed(() =>
    JSON.stringify(getLastEdited.value)
  );

  const data = ref<any>([]);
  const filteredData = ref<any>([]);
  const isFilterOriginalState = ref<boolean>(true);

  // Getters
  const getData = computed(() => data.value);

  // TODO new filtered data function accepting selected filter names as params
  const getFilteredData = computed(() => {
    // TODO
    // Put property in each filter to select only related to the store
    if (filteredData.value.length > 0) {
      return filteredData.value;
    } else {
      // If no filter has been applied, return it all data
      return data.value;
    }
  });

  const getIsFilterOriginalState = computed(() => isFilterOriginalState.value);

  const sumValues = computed((): sumValues => {
    return (key: string) => {
      /**
       * @param {String} key
       * @returns {number}
       */
      const _data = [...getFilteredData.value];
      return sumData(_data, key);
    };
  });

  const varianceValues = computed((): varianceValues => {
    return (aValueKey: string, bValueKey: string) => {
      /**
       * @param {String} aValueKey
       * @param {String} bValueKey
       * @returns {number}
       */
      const _data = [...getFilteredData.value];
      return varianceData(_data, aValueKey, bValueKey);
    };
  });

  const groupBySum = computed(() => {
    return (groupKey: string, sumKey: string) => {
      /**
       * @param {String} groupBy
       * @param {String} sumKey
       */
      const _data = [...getFilteredData.value];
      return groupBySumData(_data, groupKey, sumKey);
    };
  });

  const groupBySumByEpoch = computed(() => {
    return (groupKey: string, sumKey: string) => {
      /**
       * @param {String} groupBy
       * @param {String} sumKey
       */
      const _data = [...getFilteredData.value];
      return groupBySumDataByEpoch(_data, groupKey, sumKey);
    };
  });

  const groupByPercentOfTotal = computed(() => {
    return (groupKey: string, sumKey: string) => {
      /**
       * @param {String} groupBy
       * @param {String} sumKey
       */
      const _data = [...getFilteredData.value];
      return groupByPercentOfTotalData(_data, groupKey, sumKey);
    };
  });

  const groupByDoVariance = computed(() => {
    return (groupKey: string, xValueKey: string, yValueKey: string) => {
      /**
       * @param {String} groupBy
       * @param {String} xValueKey
       * @param {String} yValueKey
       *
       */
      const _data = [...getFilteredData.value];
      return groupByDoDataVariance(_data, groupKey, xValueKey, yValueKey);
    };
  });

  const groupByDoVarianceByEpoch = computed(() => {
    return (groupKey: string, xValueKey: string, yValueKey: string): any => {
      /**
       * @param {String} groupBy
       * @param {String} xValueKey
       * @param {String} yValueKey
       *
       */
      const _data = [...getFilteredData.value];
      return groupByDoDataVarianceByEpoch(
        _data,
        groupKey,
        xValueKey,
        yValueKey
      );
    };
  });

  // Actions
  function addData(newData: any[]): void {
    /**
     * Add a list of data to store
     * @param projects
     * @returns {void}
     */
    data.value = newData;
  }

  function setIsFilterOriginalState(value: boolean): void {
    /**
     * Filter original state setter
     * This function will revert filters at multiselect checkbox filter
     * component if set to true.
     * @param {boolean} value
     */
    isFilterOriginalState.value = value;
  }

  function applyFilters(filters: IFilterParameters[]): void {
    /**
     * Create filters for dataset(s) and save on filter store.
     * @param filters
     */
    for (const filter of filters) {
      const optionsNames = getUniqueAttributeValues(
        data.value,
        filter.fieldName
      );

      // Options
      // If options should be unchecked by default, but yet visible
      const shouldExcludeOption = (optionName: string) => {
        let exclude = false;
        if (filter.exclude && filter.exclude?.length > 0) {
          exclude = filter.exclude.includes(optionName);
        }
        return exclude;
      };

      // Map options properties
      const options = optionsNames.map((optionName) => ({
        name: optionName,
        available: !shouldExcludeOption(optionName),
        visible: true,
        exclude: shouldExcludeOption(optionName),
      }));

      // Create filters
      filterStore.addFilter({
        id: filter.fieldName,
        title: filter.title,
        options: options,
        store: storeId,
        crossStores: filter.crossStores ? filter.crossStores : [],
      });
    }
  }

  const cascadingFilter = async () => {
    /**
     * Cascading filter logic.
     */
    if (getLastEdited?.value?.store === storeId) {
      const filtersToUpdate = filterStore.getFilters.filter(
        (filter) => filter.id != getLastEdited.value?.id
      );
      const availableOptions = getLastEdited.value?.options
        .filter((option) => option.available == true)
        .map((option) => option.name);
      // available data
      const availableData = filteredData.value.filter((d: any) =>
        availableOptions?.includes(d[String(getLastEdited.value?.id)])
      );
      //
      for (const filter of filtersToUpdate) {
        //
        const availableOptionsNames = getUniqueAttributeValues(
          availableData,
          filter.id
        );
        // Generate new options values
        const updatedOptions = filter.options.map((option) => {
          const isVisible =
            availableOptionsNames.includes(option.name) ||
            (isFilterOriginalState.value && option.exclude === true);

          return {
            name: option.name,
            available: option.available,
            visible: isVisible,
            exclude: option.exclude,
          };
        });
        // Update filter options
        filterStore.updateFilterOptions(
          filter.id,
          filter.store,
          updatedOptions
        );
      }
    }
  };

  const filterData = async () => {
    // Select filters which should be applied
    const filtersToApply = filterStore.getFilters.filter((f) => {
      let shouldReturn = false;
      if (f.crossStores && f.crossStores.length > 0) {
        shouldReturn = f.store === storeId || f.crossStores.includes(storeId);
      } else {
        shouldReturn = f.store === storeId;
      }
      return shouldReturn;
    });
    if (filtersToApply.length > 0) {
      // Send filter request to web worker so it can be processed in background
      // not freezing the app
      const payload: any = await requestFilter(
        storeId,
        data.value,
        filtersToApply
      );
      // requestFilter Success

      //---------------------------- Time ------------------------------ //
      const start = new Date().getTime();
      //---------------------------- Time ------------------------------ //
      const payloadData = JSON.parse(payload);
      if (
        payloadData.name === "filterDataResult" &&
        payloadData.storeId === storeId
      ) {
        filteredData.value = payloadData.result;
        await cascadingFilter();
        const duration = new Date().getTime() - start;
        console.log("Cascading Filter" + " " + msToTime(duration));
        //------------------------- Took ------------------------------- //
      }
    }
  };

  const init = async () => {
    /**
     * Should be called at onBeforeMount hook
     * When store is part of a cross filter store
     */
    await filterData();
  };

  // When filter changes
  watch(getLastEditedTrigger, async () => {
    await filterData();
  });

  return {
    getData,
    getFilteredData,
    getIsFilterOriginalState,
    isFilterOriginalState,
    sumValues,
    varianceValues,
    groupBySum,
    groupBySumByEpoch,
    groupByPercentOfTotal,
    groupByDoVariance,
    groupByDoVarianceByEpoch,
    init,
    addData,
    applyFilters,
    setIsFilterOriginalState,
  };
};
