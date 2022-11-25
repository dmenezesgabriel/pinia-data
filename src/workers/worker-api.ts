// Load Web Workers
import type IFilter from "../interfaces/IFilter";
import Worker from "./worker.js?worker";
import Wrapper from "./workerWrapper";

export const worker = new Worker();
export const workerWrapper = new Wrapper(worker);

export function requestFilter(storeId: string, data: any, filters: IFilter[]) {
  const payload = JSON.stringify({
    name: "filterData",
    params: { data: data, filters: filters, storeId: storeId },
  });
  return workerWrapper.sendMsg(payload);
}
