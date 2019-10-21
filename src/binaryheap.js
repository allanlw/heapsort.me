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
  constructor(cmpFunction){
    this.content = [];
    this.cmpFunction = cmpFunction;
  }

  get size() {
    return this.content.length;
  }

  async push(element) {
    // Add the new element to the end of the array.
    this.content.push(element);
    // Allow it to bubble up.
    return this.bubbleUp(this.content.length - 1);
  }

  async pop() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.content.length > 0) {
      this.content[0] = end;
      await this.sinkDown(0);
    }
    return result;
  }

  async bubbleUp(n) {
    // Fetch the element that has to be moved.
    var element = this.content[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      var parentN = Math.floor((n + 1) / 2) - 1,
        parent = this.content[parentN];
      // If the parent has a lesser score, things are in order and we
      // are done.
      if (await this.cmpFunction(element, parent) > 0)
        break;

      // Otherwise, swap the parent with the current element and
      // continue.
      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }
  }

  async sinkDown(n) {
    // Look up the target element and its score.
    var length = this.content.length,
      element = this.content[n];

    while(true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) * 2, child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        // If the child is better than the element, we need to swap
        if (await this.cmpFunction(child1, element) < 0)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        // if the NEW element is in position child2n is better than what's in position
        // n, we need to swap
        if (await this.cmpFunction(swap == null ? element : child1, child2) > 0)
          swap = child2N;
      }

      // No need to swap further, we are done.
      if (swap == null) break;

      // Otherwise, swap and continue.
      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }

  static async sortTopN(input, cmpFunc, progress, n) {
    let heap = new BinaryHeap(cmpFunc);
    let res = [];

    for (let i = 0; i < input.length; i++) {
      progress("push", res.length, input.length, heap.size);
      await heap.push(input[i]);
    }

    while(res.length < n && heap.size > 0) {
      progress("pop", res.length, input.length, heap.size);
      res.push(await heap.pop());
    }

    return res;
  }
}
