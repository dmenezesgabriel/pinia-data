const resolves: Record<number, any> = {};
const rejects: Record<number, any> = {};
let globalMsgId = 0;
// Activate calculation in the worker, returning a promise
function sendMsg(payload: string, worker: Worker) {
  const msgId = globalMsgId++;
  const msg = {
    id: msgId,
    payload,
  };
  return new Promise(function (resolve, reject) {
    // save callbacks for later
    resolves[msgId] = resolve;
    rejects[msgId] = reject;
    worker.postMessage(msg);
  });
}
// Handle incoming calculation result
function handleMsg(event: MessageEvent) {
  const { id, err, payload } = event.data;
  if (payload) {
    const resolve = resolves[id];
    if (resolve) {
      resolve(payload);
    }
  } else {
    // error condition
    const reject = rejects[id];
    if (reject) {
      if (err) {
        reject(err);
      } else {
        reject(`No payload for action ${id}`);
      }
    }
  }

  // purge used callbacks
  delete resolves[id];
  delete rejects[id];
}

interface IWrapper {
  worker: Worker;
}
// Wrapper class
class Wrapper implements IWrapper {
  worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = handleMsg;
  }

  sendMsg(str: string) {
    return sendMsg(str, this.worker);
  }
}
export default Wrapper;
