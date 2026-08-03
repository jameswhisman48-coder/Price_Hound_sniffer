// Curated starter item list for the Kroger price crawl — ~10 common groceries.
//
// `match` keywords are a lenient preference for picking the right product out of
// the API results (e.g. "milk" + "gallon" beats a random milk SKU), not a hard
// filter: if nothing matches, the best-ranked priced result is still cached, so
// the crawl degrades gracefully instead of failing.
export type KrogerItem = {
  itemKey: string;
  label: string;
  searchTerm: string;
  /** Lower-cased substrings that, if found in a description, boost its rank. */
  match: string[];
};

export const KROGER_ITEMS: KrogerItem[] = [
  {
    itemKey: "milk_gallon",
    label: "Milk (gallon)",
    searchTerm: "milk gallon",
    match: ["milk", "gallon"],
  },
  {
    itemKey: "eggs_dozen",
    label: "Eggs (dozen)",
    searchTerm: "large eggs",
    match: ["eggs"],
  },
  {
    itemKey: "white_bread",
    label: "White bread",
    searchTerm: "white bread",
    match: ["bread"],
  },
  {
    itemKey: "butter",
    label: "Butter",
    searchTerm: "butter",
    match: ["butter"],
  },
  {
    itemKey: "chicken_breast",
    label: "Chicken breast",
    searchTerm: "boneless skinless chicken breast",
    match: ["chicken", "breast"],
  },
  {
    itemKey: "bananas",
    label: "Bananas",
    searchTerm: "bananas",
    match: ["banana"],
  },
  {
    itemKey: "apples",
    label: "Apples",
    searchTerm: "apples",
    match: ["apple"],
  },
  {
    itemKey: "cereal",
    label: "Cereal",
    searchTerm: "cereal",
    match: ["cereal"],
  },
  {
    itemKey: "coffee",
    label: "Coffee",
    searchTerm: "ground coffee",
    match: ["coffee"],
  },
  {
    itemKey: "cheddar_cheese",
    label: "Cheddar cheese",
    searchTerm: "cheddar cheese",
    match: ["cheddar"],
  },
];
