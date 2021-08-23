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
