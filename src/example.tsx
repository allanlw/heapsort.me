import m from "mithril";

const cat = "Category:Pictures_of_the_Year_(first_place)";
const base = "https://commons.wikimedia.org/w/api.php?origin=*&format=json&";
const limit = 20;
const exampleUri = `${base}action=query&list=categorymembers&cmtitle=${cat}&cmlimit=${limit}&cmtype=file`;
const infoUri = `${base}action=query&prop=imageinfo|info&inprop=url&iiprop=url|extmetadata|canonicaltitle&iiurlwidth=1024&iiurlheight=1024&titles=`;

// Attribution based on https://commons.wikimedia.org/wiki/Commons:Credit_line
// some licenses REQUIRE extra text
function licenseExtra(x: string) {
  if (x.startsWith("CC")) {
    const parts = x.split(" ");
    return (
      <a
        href={`https://creativecommons.org/licenses/${parts[1].toLowerCase()}/${
          parts[2]
        }/`}
      >
        {x}
      </a>
    );
  }

  switch (x) {
    case "FAL":
      return (
        <span>
          Copyleft: This is a free work, you can copy, distribute, and modify it
          under the terms of the{" "}
          <a href="http://artlibre.org/licence/lal/en/">Free Art License</a>
        </span>
      );
    case "Public domain":
      return null;
    default:
      console.log(`Unknown license: ${x}`);
      return null;
  }
}

interface Examples {
  urls: string[];
  attribution: m.Vnode[];
}

interface CategoryMembersResponse {
  query: {
    categorymembers: { title: string }[];
  };
}

interface ImageInfoResponse {
  query: {
    pages: {
      [pageName: string]: {
        imageinfo: {
          thumburl: string;
          extmetadata: {
            [prop: string]: { value: string };
          };
        }[];
        canonicalurl: string;
        title: string;
      };
    };
  };
}

export default async function fetchExamples(): Promise<Examples> {
  const resp1 = await fetch(exampleUri);
  const j1 = (await resp1.json()) as CategoryMembersResponse;
  const titles: string[] = j1.query.categorymembers.map((x) => x.title);

  const resp2 = await fetch(infoUri + titles.map(encodeURIComponent).join("|"));
  const j2 = (await resp2.json()) as ImageInfoResponse;

  const urls = [];
  const pages = j2.query.pages;
  const attribution = [];
  for (const k of Object.keys(pages)) {
    const page = pages[k];
    const ii = page.imageinfo[0];
    urls.push(ii.thumburl);
    attribution.push(
      <div>
        <strong>
          <a href={page.canonicalurl}>{page.title}</a>:
        </strong>
        <br />
        Author: {m.trust(ii.extmetadata.Artist.value)}
        <br />
        Usage Terms: {ii.extmetadata.UsageTerms.value}{" "}
        {licenseExtra(ii.extmetadata.LicenseShortName.value)}
        <br />
        <br />
      </div>
    );
  }
  return { urls, attribution };
}
