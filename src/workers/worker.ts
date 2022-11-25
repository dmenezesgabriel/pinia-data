import { filterData } from "../utils/data";

self.onmessage = (event: MessageEvent) => {
  const { id, payload } = event.data;
  //Do something
  const jsonPayload = JSON.parse(payload);
  if (jsonPayload.name === "filterData") {
    //  Post result
    const message = {
      id,
      payload: JSON.stringify({
        name: "filterDataResult",
        result: filterData(jsonPayload.params.data, jsonPayload.params.filters),
        storeId: jsonPayload.params.storeId,
      }),
    };

    self.postMessage(message);
  }
};
