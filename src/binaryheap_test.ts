import BinaryHeap from "./binaryheap";
import { Permutation } from "js-combinatorics";

function cmp(i: number, j: number) {
  return Promise.resolve(i - j);
}

void (async function () {
  for (let i = 1; i < 9; i++) {
    console.log(`Testing arrays of length ${i}`);
    const a = [...Array(i).keys()];
    const t = JSON.stringify(a);
    for (const o of new Permutation(a).toArray()) {
      const output = await BinaryHeap.sortTopN(o, cmp, o.length);
      if (JSON.stringify(output) !== t) {
        console.log(`Problemo! ${o.toString()} -> ${output.toString()}`);
      }
    }
  }
})();
