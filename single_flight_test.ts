import { SingleFlight } from "./mod.ts";
import { assert, assertEquals } from "./test.deps.ts";

const heavyFunc = (x: number, y: number): string => {
  // heavy calculation
  return `${x} + ${y} = ${x + y}`;
};

Deno.test(".Do", async () => {
  const SG = new SingleFlight();
  await SG
    .Do("foo", () => heavyFunc(1, 2))
    .then((ret) => assertEquals(ret, "1 + 2 = 3"))
    .catch(() => assert(false, "An error occurred"));
});

Deno.test(".Do with async", async () => {
  const SG = new SingleFlight();
  await SG
    .Do("foo", async () => {
      await setTimeout(() => null, 0);
      return null;
    })
    .then((ret) => assertEquals(ret, null))
    .catch(() => assert(false, "An error occurred"));
});

Deno.test(".Do suppresses duplications", async () => {
  const SG = new SingleFlight();
  const n = 1000;
  const key = "foo";

  const success = SG.Do(key, () => "success");
  const promises = [success];
  for (let i = 1; i < n; i++) {
    promises.push(SG.Do(key, () => assert(false, "do not call this")));
  }

  await Promise.all(promises).then((ret) => {
    ret.forEach((x) => assertEquals(x, "success"))
  });
});

Deno.test(".Do with Error", async () => {
  const SG = new SingleFlight();
  await SG
    .Do("foo", () => {
      throw Error("some error");
    })
    .then(() => assert(false, "do not call this"))
    .catch((err) => assertEquals((err as Error).message, "some error"));
});
