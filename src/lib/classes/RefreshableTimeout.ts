export default class RefreshableTimeout {
  private timeout: number;
  private reject: () => void = () => {};
  public promise: Promise<void>;

  constructor (private ms: number) {
    this.promise = new Promise((_, r) => this.reject = r);
    this.timeout = window.setTimeout(this.reject!, ms);
  }

  refresh = () => {
    window.clearTimeout(this.timeout);
    this.timeout = window.setTimeout(this.reject, this.ms);
  }

  cancel = () => {
    this.reject();
    window.clearTimeout(this.timeout);
  }
}