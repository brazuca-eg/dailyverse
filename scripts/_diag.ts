import { buildDailyPuzzle } from "../src/games/spot-difference/daily";
import { verifyPuzzle } from "./spot-difference/verify";
const rows: string[] = [];
for (let day = 0; day < 1100; day++) {
  const p = buildDailyPuzzle(day);
  const issues = verifyPuzzle(p);
  if (issues.length) rows.push(`${day} ${p.original.theme}/${p.original.mood}/${p.tier}: ${issues.join("; ")}`);
}
console.log(rows.length, "bad days");
console.log(rows.slice(0, 40).join("\n"));
