# deno-singleflight
[![Deno](https://github.com/NotFounds/deno-singleflight/actions/workflows/deno.yml/badge.svg?branch=main)](https://github.com/NotFounds/deno-singleflight/actions/workflows/deno.yml)
provides a duplicate function call suppression

## Usage
```ts
import { SingleFlight } from "...";

const SG = new SingleFlight();
await SG
  .Do("foo", () => {
    const ret = heavy(); // heavy request/function
    return ret;
  })
  .then((res) => res);
```


### Example for de-dup
```ts
import { SingleFlight } from "./mod.ts";

const SG = new SingleFlight();
const n = 5;

const promises: Promise<any>[] = [];
for (let i = 0; i < n; i++) {
  promises.push(SG.Do("bar", () => `${i}`));
}

Promise.all(promises).then((ret) => {
  ret.forEach((x) => console.log(x))
});
```

Running this returns the following result.
```sh
$ cat example.ts
import { SingleFlight } from "./mod.ts";

const SG = new SingleFlight();
const n = 5;

const promises: Promise<any>[] = [];
for (let i = 0; i < n; i++) {
  promises.push(SG.Do("bar", () => `${i}`));
}

Promise.all(promises).then((ret) => {
  ret.forEach((x) => console.log(x))
});

$ deno run example.ts
0
0
0
0
0
```
Only the first function call is evaluated.

## References
- [singleflight.go | sync/singleflight](https://github.com/golang/sync/blob/master/singleflight/singleflight.go)

## License
Copyright © 2021 NotFounds.  

This library is released under the MIT License.  

---

This library is developed based on [zcong1993/singleflight](https://github.com/zcong1993/singleflight). 
[LICENSE](https://github.com/zcong1993/singleflight/blob/master/LICENSE)
