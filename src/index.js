import "./style.scss";

import BinaryHeap from "./binaryheap.js";
import m from "mithril";

const ImgItem = {
  slug: "img",
  description: "Image URLs",
  view: function(vnode) {
    return <img src={vnode.attrs.item} id={vnode.attrs.id}/>;
  },
};
const IframeItem = {
  slug: "iframe",
  description: "Web pages",
  view: function(vnode) {
    return <iframe src={vnode.attrs.item} id={vnode.attrs.id}/>;
  },
};
const TextItem = {
  slug: "text",
  description: "Plain Text",
  view: function(vnode) {
    return <span id={vnode.attrs.id}>{vnode.attrs.item}</span>;
  },
};

const App = {
  promiseAccept: null,
  itemTypes: [
    ImgItem,
    IframeItem,
    TextItem,
  ],
  oninit: function(vnode) {
    this.mode = "start";
    this.itemType = null;
    this.comparison = null;
  },
  submitForm: function(e) {
    this.mode = "sort";
    const text = document.getElementById("entry").value;
    const typeSlug = document.querySelector("input[name=\"item_type\"]:checked").value;
    this.itemType = this.itemTypes.filter(x => x.slug === typeSlug)[0];
    m.redraw.sync(); // force creation of the frames
    this.sort(text).then(result => {
      this.result = result;
      this.mode = "done";
    });
  },
  view: function(vnode) {
    switch (this.mode) {
    case "start":
      return <form id="start">
        <label for="entry">Enter URLs separated by newlines:</label>
        <textarea id="entry"/>
        {this.itemTypes.map((x,i) => {
          return <>
            <label for="item_type_{x.slug}">{x.description}</label>
            <input type="radio" name="item_type" value={x.slug} checked={i===0}/>
          </>;
        })}
        <input type="button" value="Start" onclick={this.submitForm.bind(this)}/>
      </form>;
    case "sort":
      if (this.comparison === null) return null;
      return <>
        <span id="info">{JSON.stringify(this)}</span>
        <div id="container">
          {m(this.itemType, {item: this.comparison[0], id:"a"})}
          {m(this.itemType, {item: this.comparison[1], id:"b"})}
        </div>
      </>;
    case "done":
      return <pre>{this.result.join("\n")}</pre>;
    }
  },
  progress: function(mode, done, total, heapSize) {
    this.sortMode = mode;
    this.done = done;
    this.total = total;
    this.heapSize = heapSize;
  },
  cmp: function(a, b) {
    this.comparison = [a,b];
    m.redraw();
    return new Promise(function(accept) {
      App.promiseAccept = accept;
    });
  },
  sort: function(text) {
    const items = text.split("\n").filter(function(x) { return x.length > 0; });
    return BinaryHeap.sortTopN(items, this.cmp.bind(this), this.progress.bind(this), items.length);
  },
  keypress: function(e) {
    if (App.promiseAccept === null) return;
    if (e.key === "a") {
      App.promiseAccept(-1);
    } else if (e.key === "f") {
      App.promiseAccept(1);
    }
    m.redraw();
  },
};

m.mount(document.body, App);

document.addEventListener("keypress", App.keypress);
