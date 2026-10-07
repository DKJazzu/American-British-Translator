const americanOnly = require("./american-only.js");
const americanToBritishSpelling = require("./american-to-british-spelling.js");
const americanToBritishTitles = require("./american-to-british-titles.js");
const britishOnly = require("./british-only.js");

const britishToAmericanSpelling = invertDict(americanToBritishSpelling);
const britishToAmericanTitles = invertDict(americanToBritishTitles);

// prioritize longer matches over partial matches
const US_SPELLING_KEYS = Object.keys(americanToBritishSpelling).sort(
  (a, b) => b.length - a.length,
);
const UK_SPELLING_KEYS = Object.keys(britishToAmericanSpelling).sort(
  (a, b) => b.length - a.length,
);
const US_ONLY_KEYS = Object.keys(americanOnly).sort(
  (a, b) => b.length - a.length,
);
const UK_ONLY_KEYS = Object.keys(britishOnly).sort(
  (a, b) => b.length - a.length,
);

class Translator {
  translate(text, locale) {
    if (!text) return { error: "No text to translate" };
    if (locale !== "american-to-british" && locale !== "british-to-american") {
      return { error: "Invalid value for locale field" };
    }

    const isAmToBr = locale === "american-to-british";
    let translation = text;

    const dict = isAmToBr ? americanOnly : britishOnly;
    const dictKeys = isAmToBr ? US_ONLY_KEYS : UK_ONLY_KEYS;

    const spelling = isAmToBr
      ? americanToBritishSpelling
      : britishToAmericanSpelling;
    const spellingKeys = isAmToBr ? US_SPELLING_KEYS : UK_SPELLING_KEYS;

    const titles = isAmToBr ? americanToBritishTitles : britishToAmericanTitles;

    for (let [key, val] of Object.entries(titles)) {
      let escapedKey = key.replace(".", "\\.");
      let trailingBoundary = key.endsWith(".") ? "" : "\\b";

      // prevent nested highlight markup when multiple translation rules overlap
      let regex = new RegExp(
        `(?<!<span[^>]*>)\\b${escapedKey}${trailingBoundary}(?![^<]*</span>)`,
        "gi",
      );

      translation = translation.replace(regex, () => {
        let replacement = val.charAt(0).toUpperCase() + val.slice(1);
        return `<span class="highlight">${replacement}</span>`;
      });
    }

    for (let key of spellingKeys) {
      let val = spelling[key];
      let regex = new RegExp(
        `(?<!<span[^>]*>)\\b${escapeRegex(key)}\\b(?![^<]*</span>)`,
        "gi",
      );
      translation = translation.replace(regex, (match) => {
        let replacement = capitalize(val, match);
        return `<span class="highlight">${replacement}</span>`;
      });
    }

    for (let key of dictKeys) {
      let val = dict[key];
      let regex = new RegExp(
        `(?<!<span[^>]*>)\\b${escapeRegex(key)}\\b(?![^<]*</span>)`,
        "gi",
      );
      translation = translation.replace(regex, (match) => {
        let replacement = capitalize(val, match);
        return `<span class="highlight">${replacement}</span>`;
      });
    }

    if (isAmToBr) {
      // apply locale-specific time formatting conventions during translation
      translation = translation.replace(
        /(?<!\d)(\d{1,2}):(\d{2})(?!\d)/g,
        `<span class="highlight">$1.$2</span>`,
      );
    } else {
      translation = translation.replace(
        /(?<!\d)(\d{1,2})\.(\d{2})(?!\d)/g,
        `<span class="highlight">$1:$2</span>`,
      );
    }

    if (translation === text) {
      return { text, translation: "Everything looks good to me!" };
    }
    return { text, translation };
  }
}

function invertDict(obj) {
  let inverted = {};
  for (let [key, val] of Object.entries(obj)) {
    inverted[val] = key;
  }
  return inverted;
}

function capitalize(word, original) {
  if (original[0] === original[0].toUpperCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = Translator;
