// deno-lint-ignore no-explicit-any
type Resolver<T = any> = (value: T) => void;
// deno-lint-ignore no-explicit-any
type Rejecter<T = any> = (reason: T) => void;
type Call = {
  firstCall: boolean;
  resolvers: Resolver[];
  rejecters: Rejecter[];
  forgotten: boolean;
};

export type KeyType = string | symbol;
// deno-lint-ignore no-explicit-any
export type Func<T = any> = () => T;

export class SingleFlight {
  private waitCalls = new Map<KeyType, Call>();

  public async Do<T>(key: KeyType, func: Func): Promise<T> {
    return await (new Promise<T>(
      (resolve, reject) => {
        const wc = this.getWaitCall(key);
        if (wc.forgotten) {
          this.waitCalls.delete(key);
          reject(`The key(= ${key.toString()}) is already removed`);
          return;
        }

        const isFirst = wc.firstCall;
        wc.firstCall = false;
        wc.resolvers.push(resolve);
        wc.rejecters.push(reject);
        this.waitCalls.set(key, wc);

        if (isFirst) {
          Promise.resolve()
            .then(() => func())
            .then((res) => {
              this.getWaitCall(key).resolvers.forEach((resolve) => resolve(res));
            })
            .catch((err) => {
              this.getWaitCall(key).rejecters.forEach((reject) => reject(err));
            });
        }
      }
    ));
  }

  public Forget(key: KeyType) {
    // TODO: lock
    this.waitCalls.set(key, {
      firstCall: false,
      resolvers: [],
      rejecters: [],
      forgotten: true,
    });
    const ok = this.waitCalls.delete(key);
    if (!ok && this.waitCalls.has(key)) {
      throw Error(`Failed to remove key(= ${key.toString()})`);
    }
    // TODO: unlock
  }

  private getWaitCall(key: KeyType): Call {
    return this.waitCalls.get(key) || {
      firstCall: true,
      resolvers: [],
      rejecters: [],
      forgotten: false,
    };
  }
}
