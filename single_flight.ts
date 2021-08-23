type Resolver<T = any> = (value: T) => void;
type Rejecter<T = any> = (reason: T) => void;
type Call = {
  firstCall: boolean;
  resolvers: Resolver[];
  rejecters: Rejecter[];
  forgotten: boolean;
};

export type KeyType = string | symbol;
export type Func<T = any> = () => T;

export class SingleFlight {
  private waitCalls = new Map<KeyType, Call>();

  public async Do<T>(key: KeyType, func: Func): Promise<T> {
    return await (new Promise<T>(
      (resolve, reject) => {
        // TODO: lock
        const wc = this.getWaitCall(key);
        if (wc.forgotten) {
          this.waitCalls.delete(key);
          // TODO: unlock
          reject(`The key(= ${key.toString()}) is already removed`);
          return;
        }

        const isFirst = wc.firstCall;
        wc.firstCall = false;
        wc.resolvers.push(resolve);
        wc.rejecters.push(reject);
        this.waitCalls.set(key, wc);
        // TODO: unlock

        if (isFirst) {
          Promise.resolve()
            .then(() => func())
            .then((res) => {
              // TODO: lock
              getWaitCall(key).resolvers.forEach((resolve) => resolve(res));
              // TODO: unlock
            })
            .catch((err) => {
              // TODO: lock
              getWaitCall(key).rejecters.forEach((reject) => reject(res));
              // TODO: unlock
            });
        };
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
