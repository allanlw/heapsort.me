import m from "mithril";

const cat = "Category:Pictures_of_the_Year_(first_place)";
const base = "https://commons.wikimedia.org/w/api.php?origin=*&format=json&";
const limit = 20;
const exampleUri = `${base}action=query&list=categorymembers&cmtitle=${cat}&cmlimit=${limit}&cmtype=file`;
const infoUri = `${base}action=query&prop=imageinfo|info&inprop=url&iiprop=url|extmetadata|canonicaltitle&iiurlwidth=1024&iiurlheight=1024&titles=`;

// Attribution based on https://commons.wikimedia.org/wiki/Commons:Credit_line
// some licenses REQUIRE extra text
function licenseExtra(x) {
  if (x.startsWith("CC")) {
    const parts = x.split(" ");
    return <a href={`https://creativecommons.org/licenses/${parts[1].toLowerCase()}/${parts[2]}/`}>{x}</a>;
  }

  switch (x) {
  case "FAL":
    return <>Copyleft: This is a free work, you can copy, distribute, and modify it under the terms of the <a href="http://artlibre.org/licence/lal/en/">Free Art License</a></>;
  case "Public domain":
    return null;
  default:
    console.log(`Unknown license: ${x}`);
    return null;
  }
}

export default function fetchExamples() {
  return fetch(exampleUri)
    .then((r) => r.json())
    .then((r) => r.query.categorymembers.map((x) => x.title))
    .then((titles) => fetch(infoUri + titles.map(encodeURIComponent).join("|")))
    .then((r) => r.json())
    .then((r) => {
      const urls = [];
      const pages = r.query.pages;
      const attribution = [];
      for (const k of Object.keys(pages)) {
        const page = pages[k];
        const ii = page.imageinfo[0];
        urls.push(ii.thumburl);
        attribution.push(<div>
          <strong><a href={page.canonicalurl}>{page.title}</a>:</strong><br/>
          Author: {m.trust(ii.extmetadata.Artist.value)}<br/>
          Usage Terms: {ii.extmetadata.UsageTerms.value} {licenseExtra(ii.extmetadata.LicenseShortName.value)}<br/><br/>
        </div>);
      }
      return {urls: urls, attribution: attribution};
    });
}
