// Notes on sorting algorith choice.
// We _really_ care about the number of comparisons because of the human factor,
// so the worst-case complexity can't be more than n log n.
// We also can't parallelize, so this is not an issue.
// It's also better if the comparissons can be disparate. repeatedly comparing against
// the same image isn't great for the human (e.g. pivots and merges can be bad!)
// obviously some of this can't be avoided though.
// for all these reasons, we use heapsort.

// this implementation is a modified version of the one at:
// http://eloquentjavascript.net/1st_edition/appendix2.html
// This code is CC-BY Marijn Haverbeke
// the use of a score function has been replaced with an async compare function

// cmpFunction is an async function that takes three args
//  a, b elements from the input list
// to compare. Returns -1 if a is a<b, and 1 if a>b, (or theoretically 0 if
// they're equal)
export default class BinaryHeap {
  constructor(cmpFunction) {
    this.heap = [];
    this.cmpFunction = cmpFunction;
    this.trueItems = {};
    this.uniqid = 0;
    this.memos = {};
  }

  get size() {
    return this.heap.length;
  }

  async cmp(a, b) {
    const k1 = `${a}|${b}`;
    const k2 = `${b}|${a}`;
    if (Object.prototype.hasOwnProperty.call(this.memos, k1)) {
      return this.memos[k1];
    }

    const res = await this.cmpFunction(this.trueItems[a], this.trueItems[b]);

    this.memos[k1] = res;
    this.memos[k2] = res * -1;

    return res;
  }

  async push(element) {
    const id = `i${ this.uniqid++}`;
    this.trueItems[id] = element;

    // Add the new element to the end of the array.
    this.heap.push(id);

    // Allow it to bubble up.
    return this.bubbleUp(this.heap.length - 1);
  }

  async pop() {
    // Store the first element so we can return it later.
    const resultId = this.heap[0];

    // Get the element at the end of the array.
    const end = this.heap.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.heap.length > 0) {
      this.heap[0] = end;
      await this.sinkDown(0);
    }

    const result = this.trueItems[resultId];
    delete this.trueItems.resultId;

    return result;
  }

  async bubbleUp(n) {
    // Fetch the element that has to be moved.
    const element = this.heap[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.heap[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
      if (await this.cmp(element, parent) > 0) {
        break;
      }

      // Otherwise, swap the parent with the current element and
      // continue.
      this.heap[parentN] = element;
      this.heap[n] = parent;
      n = parentN;
    }
  }

  async sinkDown(n) {
    // Look up the target element and its score.
    const length = this.heap.length;
    const element = this.heap[n];

    while (true) {
      // Compute the indices of the child elements.
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      let swap = null;
      let swapItem = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        const child1 = this.heap[child1N];
        // If the child is better than the element, we need to swap
        if (await this.cmp(child1, element) < 0) {
          swap = child1N;
          swapItem = child1;
        }
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        const child2 = this.heap[child2N];
        // if the NEW element is in position child2n is better than what's in position
        // n, we need to swap
        if (await this.cmp((swap === null) ? element : swapItem, child2) > 0) {
          swap = child2N;
          swapItem = child2;
        }
      }

      // No need to swap further, we are done.
      if (swap === null) break;

      // Otherwise, swap and continue.
      this.heap[n] = swapItem;
      this.heap[swap] = element;
      n = swap;
    }
  }

  static async sortTopN(input, cmpFunc, progress, n) {
    const heap = new BinaryHeap(cmpFunc);
    const res = [];

    for (let i = 0; i < input.length; i++) {
      if (progress !== null) {
        progress("push", i, input.length, heap.size);
      }
      await heap.push(input[i]);
    }

    while (res.length < n && heap.size > 0) {
      if (progress !== null) {
        progress("pop", res.length, n, heap.size);
      }
      res.push(await heap.pop());
    }

    return res;
  }
}
