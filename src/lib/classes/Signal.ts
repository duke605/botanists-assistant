export default class Signal {
  private _promise: Promise<void>;
  private res: () => void = () => {};
  private rej: () => void = () => {};

  constructor() {
    this._promise = new Promise((res, rej) => {
      this.res = res;
      this.rej = rej;
    });
  }

  get promise() {
    return this._promise;
  }

  resolve = () => {
    this.res();
  }

  reject = () => {
    this.rej();
  }
}