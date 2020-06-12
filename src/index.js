import "./style.scss";

import BinaryHeap from "./binaryheap.js";
import fetchExamples from "./example.js";
import m from "mithril";

const ImgItem = {
  slug: "img",
  description: "Image URLs",
  onupdate: function() { },
  view: function(vnode) {
    return <img src={vnode.attrs.item}/>;
  },
  preload: function(items) {
    return Promise.all(items.map((u) => new Promise((a, e) => {
      const img = new Image();
      img.onload = a;
      img.onerror = e;
      img.src = u;
    })));
  },
};
const IframeItem = {
  slug: "iframe",
  description: "Web page URLs",
  view: function(vnode) {
    return <iframe scrolling="no" sandbox src={vnode.attrs.item}/>;
  },
  preload: function(items) {
    return Promise.resolve([]);
  },
};
const TextItem = {
  slug: "text",
  description: "Plain text",
  view: function(vnode) {
    return <p class="plain-text">{vnode.attrs.item}</p>;
  },
  preload: function(items) {
    return Promise.resolve([]);
  },
};

const App = {
  cmpPromiseAccept: null,
  itemTypes: [
    ImgItem,
    IframeItem,
    TextItem,
  ],
  oninit: function(vnode) {
    this.mode = "start";
    this.itemType = null;
    this.comparison = null;
    this.error = null;
    this.showingExplanation = false;
    this.exAttribution = null;
  },
  submitForm: function(e) {
    const text = document.getElementById("entry").value;
    const typeSlug = document.querySelector("input[name=\"item_type\"]:checked").value;
    const numOutputs = document.getElementById("num-outputs").value | 0;
    this.itemType = this.itemTypes.filter((x) => x.slug === typeSlug)[0];

    const promise = this.sort(text, numOutputs);
    if (promise !== null) {
      promise.then((result) => {
        this.result = result;
        this.mode = "done";
      });
    }
  },
  showExplanation: function() {
    this.showingExplanation = !this.showingExplanation;
  },
  viewInner: function() {
    switch (this.mode) {
    case "start":
      return <form class="start">
        <h1>Interactive Heapsort <a class="wtf" href="#" onclick={this.showExplanation.bind(this)}>(WTF?)</a></h1>
        {(!this.showingExplanation)?null:<div class="explanation">
          <p>You paste in some links and they get <a href="https://en.wikipedia.org/wiki/Heapsort">Heapsorted</a>,
          but for every comparison you choose 'left' or right'. Choose whichever one is more&hellip;
          whatever the fuck you're trying to sort for.</p>

          <p>inb4 "what if it's not a total ordering". It like, doesn't matter mate.</p>
        </div>}
        <span class="input-instruction">I want to sort:</span>
        <div class="select-groups">
          {this.itemTypes.map((x, i) => {
            return <div class="select-group">
              <input type="radio" name="item_type" id={`item_type_${x.slug}`} value={x.slug} checked={i===0}/>
              <label for={`item_type_${x.slug}`}>{x.description}</label>
            </div>;
          })}
        </div>
        <label for="entry" class="input-instruction">Entries separated by newlines:</label>
        <div class="entry-container">
          <textarea id="entry"/>
          <button id="help-example" onclick={this.getExamples.bind(this)}>Populate with example images from Wikimedia Commons</button>
        </div>
        <label for="num-outputs" class="input-instruction">Number of "best" outputs:</label>
        <div>
          <input type="number" id="num-outputs" min="0" placeholder="blank/0 to sort all"/>
        </div>
        <input type="button" value="Start" onclick={this.submitForm.bind(this)}/>
        {this.error?<div class="error">{this.error}</div>:null}
        {this.exAttribution?<div class="attribution"><h2>Example Image Attribution:</h2>{this.exAttribution}</div>:null}
      </form>;
    case "sort":
      if (this.comparison === null) return null;
      // Note: mithril key property here prevents re-using item between draws, to avoid stale images, etc, while loading new ones
      return <>
        <span id="info">
          <span class="label">Sorting step: </span>
          <span class="data">{this.sortMode === "push" ? "building heap" : "extracting best"}</span>
          <span class="label">Step progress: </span>
          <span class="data">{this.sortStepDone} of {this.sortStepTotal}</span>
          <span class="label">Heap size: </span>
          <span class="data">{this.heapSize}</span>
        </span>
        <div class="comparison">
          <div class="comparison-left-outer">
            <div class="comparison-left">
              {m(this.itemType, {item: this.comparison[0], key: this.comparison[0]})}
            </div>
          </div>
          <div class="comparison-left-overlay" onmousedown={this.mousedown(-1)}/>
          <div class="comparison-right-outer">
            <div class="comparison-right">
              {m(this.itemType, {item: this.comparison[1], key: this.comparison[1]})}
            </div>
          </div>
          <div class="comparison-right-overlay" onmousedown={this.mousedown(1)}/>
        </div>
        <div id="help">Choose the 'better' option. <span class="only-widescreen">Click/tap it, or use{" "}
          <kbd>A</kbd> / <kbd>D</kbd>,{" "}
          <kbd>H</kbd> / <kbd>L</kbd>,{" "}
          <kbd>&#x2190;</kbd> / <kbd>&#x2192;</kbd> keys.</span>
        </div>
      </>;
    case "done":
      return <>
        <h2>Results ("best" first):</h2>
        <pre>{this.result.map((u) => [u.startsWith("http") ? <a href={u}>{u}</a> : u, "\n"])}</pre>
        <button onclick={() => this.mode = "start"}>Reset</button>
      </>;
    }
  },
  view: function(vnode) {
    return <>
      <div class={`container mode-${this.mode}`}>{this.viewInner()}</div>
      <div id="about">
        &copy; 2019 <a href="https://twitter.com/allan_wirth">Allan Wirth</a>.&nbsp;
        <a href="https://github.com/allanlw/heapsort.me">Github</a>
      </div>
    </>;
  },
  progress: function(mode, done, total, heapSize) {
    this.sortMode = mode;
    this.sortStepDone = done;
    this.sortStepTotal = total;
    this.heapSize = heapSize;
  },
  cmp: function(a, b) {
    this.comparison = [a, b];
    m.redraw();

    return new Promise(function(accept) {
      App.cmpPromiseAccept = accept;
    });
  },
  sort: function(text, numOutputs) {
    const items = text.split("\n").filter(function(x) {
      return x.length > 0;
    });
    if (items.length === 0) {
      this.error = "you gotta give me something to sort";
      return null;
    }
    if (numOutputs === 0) {
      numOutputs = items.length;
    }
    numOutputs = Math.min(items.length, Math.max(1, numOutputs));
    this.mode = "sort";
    this.itemType.preload(items).then(() => console.log("done preloading"));

    return BinaryHeap.sortTopN(items, this.cmp.bind(this), this.progress.bind(this), numOutputs);
  },
  getExamples: function() {
    document.getElementById("entry").value = "Loading...";
    fetchExamples().then((ex) => {
      document.getElementById("entry").value = ex.urls.join("\n");
      this.exAttribution = ex.attribution;
      m.redraw();
    });
    return false;
  },
  downkeys: {},
  keyup: function(e) {
    delete App.downkeys[e.code];
  },
  keydown: function(e) {
    if (App.cmpPromiseAccept === null) return;
    // prevent key repeat
    if (Object.prototype.hasOwnProperty.call(App, e.code)) return;
    switch (e.code) {
    case "KeyA":
    case "KeyH":
    case "ArrowLeft":
    case "KeyW":
    case "KeyJ":
    case "ArrowUp":
      App.cmpPromiseAccept(-1);
      break;
    case "KeyD":
    case "KeyL":
    case "ArrowRight":
    case "KeyS":
    case "KeyK":
    case "ArrowDown":
      App.cmpPromiseAccept(1);
      break;
    default:
      return;
    }
    App.downkeys[e.code] = true;
    m.redraw.sync();
  },
  mousedown: function(x) {
    return function(e) {
      if (App.cmpPromiseAccept === null) return;
      App.cmpPromiseAccept(x);
      e.preventDefault();
    };
  },
};

m.mount(document.body, App);

document.addEventListener("keyup", App.keyup);
document.addEventListener("keydown", App.keydown);
