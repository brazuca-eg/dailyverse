# Adding Mystery Place puzzles

Puzzles live in `src/games/mystery-place/puzzles.json`. New ones start as drafts in `content/drafts/`, where every clue carries the sentence from a Wikipedia article that it is based on.

## Draft format

A draft file is a JSON array. See `content/drafts/portugal-sample.json`.

```json
{
  "country": "PT",
  "difficulty": "medium",
  "clues": [
    {
      "kind": "geography",
      "text": "This country is bordered by Spain to the north and east.",
      "evidence": { "page": "Portugal", "quote": "bordered by Spain to the north and east" }
    }
  ],
  "reveal": {
    "funFact": "...",
    "sourceUrl": "https://en.wikipedia.org/wiki/Portugal",
    "evidence": { "page": "Portugal", "quote": "..." }
  }
}
```

Each puzzle needs exactly five clues, from vague to specific. `page` is the Wikipedia article title, and `quote` is copied from that article.

## Commands

| Command                                                                                   | What it does                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run content:check -- <draft.json> [--review <out.md>]`                               | Fetches the cited articles and checks the draft. Exits with 1 on any error.                                                                                                       |
| `npm run content:merge -- <draft.json>`                                                   | Runs the same checks, then appends the puzzles to `puzzles.json` with the next ids.                                                                                               |
| `npm run content:runway [-- --min 14]`                                                    | Shows how many fresh days are left. Exits with 1 below the minimum.                                                                                                               |
| `npm run content:draft -- --out <draft.json> [--count 7] [--review <out.md>] [--dry-run]` | Plans a balanced batch, asks a model to draft each puzzle, and keeps only the drafts that pass the checks. `--dry-run` plans and builds the first prompt without calling a model. |
| `npm run content:models`                                                                  | Lists the model ids your provider offers.                                                                                                                                         |

Articles are cached in `.cache/wikipedia/` and fetched slowly, because Wikipedia rate limits clients.

## What the checks cover

- The country exists, has no published puzzle yet, and appears once in the batch.
- Exactly five clues, with valid kinds and a valid difficulty.
- No clue contains the country's name, an alias or a nationality word, such as "Italian".
- Every quote is at least 25 characters and appears in the cited article.
- Every number in a clue or fun fact also appears in its quote.
- The source link matches the cited article.

## What a human still has to check

The checks prove a quote exists, not that the clue reads it correctly, and not that the puzzle is fair or its difficulty label is right. Read each clue next to its quote in the review sheet.

## The weekly batch

`.github/workflows/weekly-puzzles.yml` runs every Monday at 06:00 UTC, and on demand from the Actions tab. It drafts a batch, checks it, adds it to `puzzles.json`, runs the tests and opens a pull request whose description is the review sheet. Merging the pull request publishes the puzzles. The last step fails the run when fewer than 14 fresh days remain, so GitHub emails you.

### One-time setup

1. Create an API key for a model provider. Google's Gemini API has a free tier. Create the key in Google AI Studio.
2. In the GitHub repository, open Settings, then Secrets and variables, then Actions:
   - Secret `LLM_API_KEY`: your key.
   - Variable `LLM_MODEL`: a model id. Run `LLM_API_KEY=... npm run content:models` to list the ids your key can use. A small, cheap "flash-lite" style model is enough.
   - Variable `LLM_BASE_URL`: optional. It defaults to Google's OpenAI-compatible Gemini endpoint.
3. Open Settings, then Actions, then General, and allow GitHub Actions to create pull requests.
4. The workflow only runs on schedule once it is on the default branch.

### Switching to a paid provider

Change the same three settings. The generator speaks the common OpenAI-style chat completions format, which Gemini, OpenAI, Groq, OpenRouter and many others offer. Anthropic's native API uses a different format, so it would need a small adapter, which is one function implementing `TextGenerator` in `scripts/content/llm.ts`.

### Things to know

- GitHub Models, which an earlier plan used, was retired on July 30, 2026.
- Google says free-tier content may be used to improve its products. The job only sends public Wikipedia text and our own prompts.
- Free tiers rate limit per project. The job pauses 7 seconds between requests, set `LLM_DELAY_MS` to change that. It stops after two API failures in a row.
- Pull requests opened with the default workflow token do not start other workflows. The job runs the tests itself before opening the pull request.
- Run `npm run content:draft -- --dry-run --out x.json` any time to see the planned batch and the first prompt without a key.
