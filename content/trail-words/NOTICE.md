# Trail Words data notices

`src/games/trail-words/words.txt` is built by `npm run words:build` from these sources.

## SCOWL (the English Speller Database)

Copyright 2000-2026 by Kevin Atkinson. https://wordlist.aspell.net

Permission to use, copy, modify, distribute, and sell any part of the English Speller Database (ESDB, previously known as SCOWLv2), or word lists created from it, is hereby granted without fee, provided that the above copyright notice appears in all copies and that both the above copyright notice and this notice appear in supporting documentation. Kevin Atkinson makes no representations about the suitability of this database for any purpose. It is provided "as is" without express or implied warranty.

ESDB is derived from many sources, most of which are in the Public Domain. Data from the Corpus of Contemporary American English (COCA) was also used.

The notice is also kept at the top of `words.txt`, so it travels with every copy of the word list.

## ENABLE

Public domain. Only words that also appear in ENABLE are kept. This leaves out abbreviations such as "acct" and "dept".

## List of Dirty, Naughty, Obscene, and Otherwise Bad Words

https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Its single words are removed from the word list, together with simple inflections and the additions in `src/games/trail-words/filter.ts`.

## Not covered by a machine check

The filter cannot prove that no objectionable word remains. The first months of letter sets were read by hand. If you spot a word that should not be accepted, add it to `EXTRA_BLOCKED` in `filter.ts` and run `npm run words:build` and `npm run words:verify`.
