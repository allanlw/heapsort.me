import m from "mithril";

import "./style.scss";

import BinaryHeap from "./binaryheap.js";

var promiseAccept = null;

function sort(text, progress) {
  let items = text.split("\n").filter(function(x) { return x.length > 0; });
  return BinaryHeap.sortTopN(items, cmpFunc, progress, items.length);
}

var App = {
  oninit: function(vnode) {
    this.mode = "start";
  },
  view: function(vnode) {
    switch (this.mode) {
    case "start":
      return <>
        <label for="entry">Enter URLs separated by newlines:</label>
        <textarea id="entry"/>
        <input type="button" value="Start" onclick={e => {
          this.mode = "sort";
          let text = document.getElementById("entry").value;
          m.redraw.sync(); // force creation of the frames
          sort(text, App.progress.bind(this)).then(result => {
            this.result = result;
            this.mode = "done";
          });
        }}/>
      </>;
    case "sort":
      return <>
        <span id="info">{JSON.stringify(this)}</span>
        <div id="container">
          <iframe id="a"/>
          <iframe id="b"/>
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
  }
};

m.mount(document.body, App);

// Returns -1 if a is a better than b, else returns 1
function cmpFunc(a, b) {
  var x = document.getElementById("a");
  var y = document.getElementById("b");

  x.src = a;
  y.src = b;

  console.log("cmp2 " + a + " , "+ b);

  return new Promise(function(accept) {
    promiseAccept = accept;
  });
}

document.addEventListener("keypress", function(e) {
  if (promiseAccept == null) return;
  if (e.key == "a") {
    promiseAccept(-1);
  } else if (e.key == "f") {
    promiseAccept(1);
  }
  m.redraw();
});
