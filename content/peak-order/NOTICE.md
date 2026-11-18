# Peak Order data notice

The names and measurements in `src/games/peak-order/puzzles.json` come from Wikidata (https://www.wikidata.org), which publishes its data under the CC0 1.0 public domain dedication. No attribution is required, but this note records where the data comes from.

Rebuild with `npm run peak:build`. It downloads six small queries per category into `.cache/peak-order/` (delete that folder to refresh), then writes the puzzles. Run `npm run peak:verify` after every build.

How items are chosen:

- A value is used only when every value Wikidata holds for the item agrees within 1%. The middle value is rounded and stored.
- Fame is the number of Wikipedia editions of the item, not counting the Cebuano, Swedish and Waray editions, which are mostly written by bots.
- Medium days use the 100 best-known items of a category, hard days the best-known 250.
- Items located off Earth are removed, and an object that is both a mountain and a volcano is kept as a volcano only.
