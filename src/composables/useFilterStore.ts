import type { IOption } from "../interfaces/IFilter";
import type IFilter from "../interfaces/IFilter";
import { ref, computed } from "vue";

type genericFunction = (paramA: string, paramB: string) => any;

export const useFilterStore = () => {
  const filters = ref<IFilter[]>([]);
  const lastEdited = ref<IFilter | null>(null);

  // Getters
  const getFilters = computed(() => filters.value);
  const getLastEdited = computed(() => lastEdited.value);

  const getFilter = computed((): genericFunction => {
    return (filterId: string, storeId: string) => {
      const index = filters.value.findIndex(
        (f) => f.id === filterId && f.store === storeId
      );
      return filters.value[index];
    };
  });
  // Actions

  function addFilters(newFilters: IFilter[]): void {
    filters.value = newFilters;
  }

  function addFilter(filter: IFilter) {
    const index = filters.value.findIndex(
      (f) => f.id === filter.id && f.store === filter.store
    );
    if (index === -1) {
      filters.value.push(filter);
    }
  }

  function editFilter(filter: IFilter) {
    const index = filters.value.findIndex(
      (f) => f.id === filter.id && f.store === filter.store
    );
    const storedFilter = filters.value[index];
    Object.keys(storedFilter).forEach((key) => {
      if (key in filter) {
        storedFilter[key] = filter[key];
      }
    });
    lastEdited.value = filter;
  }

  function updateFilterOptions(
    filterId: string,
    storeId: string,
    options: IOption[]
  ): void {
    const index = filters.value.findIndex(
      (f) => f.id === filterId && f.store === storeId
    );
    filters.value[index].options = options;
  }

  function revertFilters() {
    filters.value.map((filter) => {
      filter.options.map((option) => {
        option.available = !option.exclude;
        option.visible = true;
      });
    });
  }

  return {
    filters,
    lastEdited,
    addFilter,
    addFilters,
    editFilter,
    updateFilterOptions,
    revertFilters,
    getFilters,
    getFilter,
    getLastEdited,
  };
}
