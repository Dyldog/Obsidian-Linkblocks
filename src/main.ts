import { Plugin } from "obsidian";
import moment from "moment";

// Taken from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandomiser(seed) {
  // Create cyrb128 state:
  const seed = cyrb128(seed);
  // Four 32-bit component hashes provide the seed for sfc32.
  let rand = sfc32(seed[0], seed[1], seed[2], seed[3]);
  // Only one 32-bit component hash is needed for mulberry32.
  let rand = mulberry32(seed[0]);

  return rand;
}

const colors = [
  "navy",
  "blue",
  "aqua",
  "teal",
  "olive",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "fuchsia",
  "purple",
  "maroon",
  "white",
  "silver",
  "gray",
  "black",
];
function randomColor(randomiser) {
  console.log(randomiser());
  return colors[Math.round(randomiser() * colors.length)];
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function makeDate(string) {
  console.log("String:" + string);
  console.log("Date: " + moment().format(string));
  return moment().format(string);
}

function getPart(parts, index) {
  const part = parts[index];

  const match = [...part.matchAll(/\$DATE\(([A-Za-z-]+)/g)];
  console.log(match);

  if (match.length == 0) {
    console.log("Returning part");
    return part;
  } else {
    console.log("Returning date");
    return makeDate(match[0][1]);
  }
}

export default class LinkBlocksPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("lblock", (source, el, ctx) => {
      const randomiser = getRandomiser(ctx.sourcePath);
      console.log(ctx);
      const rows = source.split("\n");

      if (rows.length > 0) {
        const box = el.createEl("div", { cls: "linkbox" });

        rows.map((row) => {
          // el.createEl("p", text:  row});

          if (row.trim().length == 0) {
            box.createEl("div", { cls: "break" });
          } else {
            const parts = row.split("|");

            if (parts.length == 1) {
              box.createEl("a", {
                text: getPart(parts, 0),
                cls: "internal-link block link " + randomColor(randomiser),
              });
            } else if (isValidHttpUrl(parts[1])) {
              box.createEl("a", {
                text: getPart(parts, 0),
                href: getPart(parts, 1),
                cls: "block link " + randomColor(randomiser),
              });
            } else if (parts.length == 2) {
              box.createEl("a", {
                text: getPart(parts, 0),
                href: getPart(parts, 1),
                cls: "internal-link block link " + randomColor(randomiser),
              });
            }
          }
        });
      }
    });
  }
}
