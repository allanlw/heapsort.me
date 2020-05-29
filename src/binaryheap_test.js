import BinaryHeap from "./binaryheap.js";
import Combinatorics from "js-combinatorics";

async function cmp(i, j) {
  return i - j;
}

(async function() {
  for (let i = 1; i < 9; i++) {
    console.log(`Testing arrays of length ${i}`);
    const a = [...Array(i).keys()];
    const t = JSON.stringify(a);
    for (const o of Combinatorics.permutation(a).toArray()) {
      const output = await BinaryHeap.sortTopN(o, cmp, null, o.length);
      if (JSON.stringify(output) !== t) {
        console.log(`Problemo! ${o} -> ${output}`);
      }
    }
  }
})();
