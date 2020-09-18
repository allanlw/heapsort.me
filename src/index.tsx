import "./style.scss";

import BinaryHeap from "./binaryheap";
import fetchExamples from "./example";
import m from "mithril";

interface Item {
  slug: string;
  description: string;
  view: (vnode: m.Vnode<{ item: string }>) => m.Vnode;
  preload?: (items: string[]) => Promise<boolean>;
}

const ImgItem: Item = {
  slug: "img",
  description: "Image URLs",
  view: function (vnode) {
    return <img src={vnode.attrs.item} />;
  },
  preload: async function (items) {
    const preloadImage = (url: string) =>
      new Promise((a, e) => {
        const img = new Image();
        img.onload = a;
        img.onerror = e;
        img.src = url;
      });

    await Promise.all(items.map(preloadImage));

    return true;
  },
};
const IframeItem: Item = {
  slug: "iframe",
  description: "Web page URLs",
  view: function (vnode) {
    return <iframe scrolling="no" sandbox src={vnode.attrs.item} />;
  },
};
const TextItem: Item = {
  slug: "text",
  description: "Plain text",
  view: function (vnode) {
    return <p class="plain-text">{vnode.attrs.item}</p>;
  },
};

class App implements m.Component {
  itemTypes = [ImgItem, IframeItem, TextItem];
  mode = "start";
  itemType: Item | null = null;
  comparison: [string, string] | null = null;
  error: string | null = null;
  showingExplanation = false;
  exAttribution: m.Vnode[] | null = null;

  cmpPromiseAccept: ((value: number) => void) | null = null;
  downkeys: {
    [keyCode: string]: boolean;
  } = {};
  result: string[] | undefined;
  sortMode: string | undefined;
  sortStepDone: number | undefined;
  sortStepTotal: number | undefined;
  heapSize: number | undefined;

  oncreate() {
    document.addEventListener("keyup", (e) => this.keyup(e));
    document.addEventListener("keydown", (e) => this.keydown(e));
  }

  submitForm() {
    const getValue = (el: HTMLInputElement | null) => {
      const v = el?.value;
      if (typeof v === "undefined") {
        throw new Error("DOM state Error");
      }
      return v;
    };

    const text = getValue(document.querySelector("textarea#entry"));
    const typeSlug = getValue(
      document.querySelector('input[name="item_type"]:checked')
    );
    const numOutputs = +getValue(document.querySelector("input#num-outputs"));

    this.itemType = this.itemTypes.filter((x) => x.slug === typeSlug)[0];

    this.sort(text, numOutputs)
      .then((result: string[]) => {
        this.result = result;
        this.mode = "done";
      })
      .catch((reason) => console.log("Sorting failed", reason));

    return false;
  }
  showExplanation() {
    this.showingExplanation = !this.showingExplanation;
  }
  viewStart() {
    return (
      <form class="start">
        <h1>
          Interactive Heapsort{" "}
          <a class="wtf" href="#" onclick={() => this.showExplanation()}>
            (WTF?)
          </a>
        </h1>
        {!this.showingExplanation ? null : (
          <div class="explanation">
            <p>
              You paste in some links and they get{" "}
              <a href="https://en.wikipedia.org/wiki/Heapsort">Heapsorted</a>,
              but for every comparison you choose 'left' or right'. Choose
              whichever one is more&hellip; whatever the fuck you're trying to
              sort for.
            </p>

            <p>
              inb4 "what if it's not a total ordering". It like, doesn't matter
              mate.
            </p>
          </div>
        )}
        <span class="input-instruction">I want to sort:</span>
        <div class="select-groups">
          {this.itemTypes.map((x, i) => {
            return (
              <div class="select-group">
                <input
                  type="radio"
                  name="item_type"
                  id={`item_type_${x.slug}`}
                  value={x.slug}
                  checked={i === 0}
                />
                <label for={`item_type_${x.slug}`}>{x.description}</label>
              </div>
            );
          })}
        </div>
        <label for="entry" class="input-instruction">
          Entries separated by newlines:
        </label>
        <div class="entry-container">
          <textarea id="entry" />
          <button id="help-example" onclick={() => this.getExamples()}>
            Populate with example images from Wikimedia Commons
          </button>
        </div>
        <label for="num-outputs" class="input-instruction">
          Number of "best" outputs:
        </label>
        <div>
          <input
            type="number"
            id="num-outputs"
            min="0"
            placeholder="blank/0 to sort all"
          />
        </div>
        <input type="button" value="Start" onclick={() => this.submitForm()} />
        {this.error ? <div class="error">{this.error}</div> : null}
        {this.exAttribution ? (
          <div class="attribution">
            <h2>Example Image Attribution:</h2>
            {this.exAttribution}
          </div>
        ) : null}
      </form>
    );
  }
  viewSort() {
    if (this.comparison === null || this.itemType == null) return null;
    // Note: mithril key property here prevents re-using item between draws, to avoid stale images, etc, while loading new ones
    return [
      <span id="info">
        <span class="label">Sorting step: </span>
        <span class="data">
          {this.sortMode === "push" ? "building heap" : "extracting best"}
        </span>
        <span class="label">Step progress: </span>
        <span class="data">
          {this.sortStepDone} of {this.sortStepTotal}
        </span>
        <span class="label">Heap size: </span>
        <span class="data">{this.heapSize}</span>
      </span>,
      <div class="comparison">
        <div class="comparison-left-outer">
          <div class="comparison-left">
            {m(this.itemType, {
              item: this.comparison[0],
              key: this.comparison[0],
            })}
          </div>
        </div>
        <div class="comparison-left-overlay" onmousedown={this.mousedown(-1)} />
        <div class="comparison-right-outer">
          <div class="comparison-right">
            {m(this.itemType, {
              item: this.comparison[1],
              key: this.comparison[1],
            })}
          </div>
        </div>
        <div class="comparison-right-overlay" onmousedown={this.mousedown(1)} />
      </div>,
      <div id="help">
        Choose the 'better' option.{" "}
        <span class="only-widescreen">
          Click/tap it, or use <kbd>A</kbd> / <kbd>D</kbd>, <kbd>H</kbd> /{" "}
          <kbd>L</kbd>, <kbd>&#x2190;</kbd> / <kbd>&#x2192;</kbd> keys.
        </span>
      </div>,
    ];
  }
  viewDone() {
    return [
      <h2>Results ("best" first):</h2>,
      <pre>
        {this.result?.map((u: string) => [
          u.startsWith("http") ? <a href={u}>{u}</a> : u,
          "\n",
        ])}
      </pre>,
      <button onclick={() => (this.mode = "start")}>Reset</button>,
    ];
  }
  viewInner() {
    switch (this.mode) {
      case "start":
        return this.viewStart();
      case "sort":
        return this.viewSort();
      case "done":
        return this.viewDone();
      default:
        throw new Error("Unknown mode");
    }
  }
  view() {
    return [
      <div class={`container mode-${this.mode}`}>{this.viewInner()}</div>,
      <div id="about">
        &copy; 2019 <a href="https://twitter.com/allan_wirth">Allan Wirth</a>
        .&nbsp;
        <a href="https://github.com/allanlw/heapsort.me">Github</a>
      </div>,
    ];
  }
  progress(mode: string, done: number, total: number, heapSize: number) {
    this.sortMode = mode;
    this.sortStepDone = done;
    this.sortStepTotal = total;
    this.heapSize = heapSize;
  }
  cmp(a: string, b: string): Promise<number> {
    this.comparison = [a, b];
    m.redraw();

    return new Promise((accept) => {
      this.cmpPromiseAccept = accept;
    });
  }
  sort(text: string, numOutputs: number): Promise<string[]> {
    const items = text.split("\n").filter((x) => {
      return x.length > 0;
    });
    if (items.length === 0) {
      this.error = "you gotta give me something to sort";
      return Promise.resolve<string[]>([]);
    }
    if (numOutputs === 0) {
      numOutputs = items.length;
    }
    numOutputs = Math.min(items.length, Math.max(1, numOutputs));
    this.mode = "sort";
    this.exAttribution = null;

    const preloader = this.itemType?.preload;
    if (preloader) {
      preloader(items)
        .then(() => console.log("done preloading"))
        .catch((reason) => console.log("preloading failed", reason));
    }

    return BinaryHeap.sortTopN(
      items,
      this.cmp.bind(this),
      numOutputs,
      this.progress.bind(this)
    );
  }
  getExamples() {
    const entry = document.getElementById("entry") as HTMLInputElement;
    entry.value = "Loading...";

    fetchExamples()
      .then((ex) => {
        entry.value = ex.urls.join("\n");
        this.exAttribution = ex.attribution;
        m.redraw();
      })
      .catch((reason) => {
        console.log("Failed to fetch examples", reason);
      });

    return false;
  }
  keyup(e: KeyboardEvent) {
    delete this.downkeys[e.code];
  }
  keydown(e: KeyboardEvent) {
    if (this.cmpPromiseAccept === null) return;
    // prevent key repeat
    if (this.downkeys.hasOwnProperty(e.code)) return;
    switch (e.code) {
      case "KeyA":
      case "KeyH":
      case "ArrowLeft":
      case "KeyW":
      case "KeyJ":
      case "ArrowUp":
        this.cmpPromiseAccept(-1);
        break;
      case "KeyD":
      case "KeyL":
      case "ArrowRight":
      case "KeyS":
      case "KeyK":
      case "ArrowDown":
        this.cmpPromiseAccept(1);
        break;
      default:
        return;
    }
    this.downkeys[e.code] = true;
    m.redraw.sync();
  }
  mousedown(result: number) {
    return (e: MouseEvent) => {
      if (this.cmpPromiseAccept === null) return;
      this.cmpPromiseAccept(result);
      e.preventDefault();
    };
  }
}

m.mount(document.body, App);
