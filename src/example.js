const cat = "Category:Pictures_of_the_Year_(first_place)";
const base = "https://commons.wikimedia.org/w/api.php?origin=*&format=json&";
const limit = 20;
const exampleUri = `${base}action=query&list=categorymembers&cmtitle=${cat}&cmlimit=${limit}&cmtype=file`;
const infoUri = `${base}action=query&prop=imageinfo&iiprop=url&iiurlwidth=1024&iiurlheight=1024&titles=`;

export default function fetchExamples() {
  return fetch(exampleUri)
    .then((r) => r.json())
    .then((r) => r.query.categorymembers.map((x) => x.title))
    .then((titles) => fetch(infoUri + titles.map(encodeURIComponent).join("|")))
    .then((r) => r.json())
    .then((r) => {
      const urls = [];
      const pages = r.query.pages;
      for (const k of Object.keys(pages)) {
        urls.push(pages[k].imageinfo[0].thumburl);
      }
      return urls;
    });
}
