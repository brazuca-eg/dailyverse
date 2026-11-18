import { describe, expect, it } from "vitest";
import {
  WIN_SHARE,
  buildPuzzleId,
  calculateScore,
  countPeeksLeft,
  createInitialState,
  finishPreview,
  findTripOnDay,
  isPlanComplete,
  isStateForRound,
  placeTrip,
  rateShare,
  readPlanShare,
  removeTrip,
  spendPeek,
  startPreview,
  submitPlan,
  type WeatherState,
} from "./game";
import { analysePuzzle } from "./solver";
import { mediumRound } from "./fixtures";
import { UNPLACED } from "./types";

const { puzzle } = mediumRound;
const puzzleId = buildPuzzleId(mediumRound);
const { bestPlan } = analysePuzzle(puzzle);

function planning(): WeatherState {
  return finishPreview(startPreview(createInitialState(puzzleId, puzzle)));
}

function planned(plan: number[]): WeatherState {
  return { ...planning(), plan };
}

function findWorstPlan(): number[] {
  const days = puzzle.weather.map((_, day) => day);
  const options = days.flatMap((first) =>
    days.flatMap((second) =>
      days.map((third) => [first, second, third]).filter((plan) => new Set(plan).size === 3),
    ),
  );
  return options.reduce((worst, plan) =>
    readPlanShare(plan, puzzle) < readPlanShare(worst, puzzle) ? plan : worst,
  );
}

describe("createInitialState", () => {
  it("starts at the intro with nothing planned and no peeks used", () => {
    const state = createInitialState(puzzleId, puzzle);
    expect(state).toEqual({
      puzzleId,
      phase: "intro",
      plan: [UNPLACED, UNPLACED, UNPLACED],
      peeksUsed: 0,
      status: "playing",
    });
  });

  it("names the puzzle by tier and number", () => {
    expect(puzzleId).toBe(`medium:${mediumRound.poolIndex}`);
  });
});

describe("phases", () => {
  it("move from the intro to the preview to planning, in order", () => {
    const intro = createInitialState(puzzleId, puzzle);
    const preview = startPreview(intro);
    expect(preview.phase).toBe("memorise");
    expect(finishPreview(preview).phase).toBe("plan");
  });

  it("do not skip ahead or go back", () => {
    const intro = createInitialState(puzzleId, puzzle);
    expect(finishPreview(intro)).toBe(intro);
    const plan = planning();
    expect(startPreview(plan)).toBe(plan);
    expect(finishPreview(plan)).toBe(plan);
  });
});

describe("placeTrip and removeTrip", () => {
  it("plan a trip on a day", () => {
    expect(placeTrip(planning(), 1, 4).plan).toEqual([UNPLACED, 4, UNPLACED]);
  });

  it("move a trip that was planned elsewhere", () => {
    const moved = placeTrip(placeTrip(planning(), 1, 4), 1, 2);
    expect(moved.plan).toEqual([UNPLACED, 2, UNPLACED]);
  });

  it("send the trip that held the day back to unplanned", () => {
    const taken = placeTrip(placeTrip(planning(), 0, 3), 2, 3);
    expect(taken.plan).toEqual([UNPLACED, UNPLACED, 3]);
  });

  it("take a trip off the plan", () => {
    const removed = removeTrip(placeTrip(planning(), 0, 3), 0);
    expect(removed.plan).toEqual([UNPLACED, UNPLACED, UNPLACED]);
  });

  it("do nothing outside the planning phase", () => {
    const intro = createInitialState(puzzleId, puzzle);
    expect(placeTrip(intro, 0, 1)).toBe(intro);
    expect(removeTrip(intro, 0)).toBe(intro);
    const done = submitPlan(planned(bestPlan), puzzle);
    expect(placeTrip(done, 0, 1)).toBe(done);
    expect(removeTrip(done, 0)).toBe(done);
  });
});

describe("findTripOnDay and isPlanComplete", () => {
  it("find the trip planned on a day, or none", () => {
    const state = planned([5, UNPLACED, 2]);
    expect(findTripOnDay(state, 5)).toBe(0);
    expect(findTripOnDay(state, 2)).toBe(2);
    expect(findTripOnDay(state, 0)).toBe(-1);
    expect(findTripOnDay(state, UNPLACED)).toBe(1);
  });

  it("are complete only when every trip has a day", () => {
    expect(isPlanComplete(planned([0, 1, UNPLACED]))).toBe(false);
    expect(isPlanComplete(planned([0, 1, 2]))).toBe(true);
  });
});

describe("spendPeek and countPeeksLeft", () => {
  it("use up peeks one at a time while planning", () => {
    const once = spendPeek(planning(), 2);
    expect(once.peeksUsed).toBe(1);
    expect(countPeeksLeft(once, 2)).toBe(1);
    expect(spendPeek(once, 2).peeksUsed).toBe(2);
  });

  it("refuse a peek when none are left", () => {
    const empty = spendPeek(planning(), 1);
    expect(spendPeek(empty, 1)).toBe(empty);
    expect(countPeeksLeft(empty, 1)).toBe(0);
  });

  it("never report fewer than none left", () => {
    expect(countPeeksLeft({ ...planning(), peeksUsed: 5 }, 2)).toBe(0);
  });

  it("refuse a peek outside the planning phase", () => {
    const intro = createInitialState(puzzleId, puzzle);
    expect(spendPeek(intro, 2)).toBe(intro);
  });
});

describe("rateShare", () => {
  it("gives stars at the share steps", () => {
    expect(rateShare(1)).toBe(5);
    expect(rateShare(0.9)).toBe(4);
    expect(rateShare(0.75)).toBe(3);
    expect(rateShare(WIN_SHARE)).toBe(2);
  });

  it("stays at the lower star until the step is reached", () => {
    expect(rateShare(0.99)).toBe(4);
    expect(rateShare(0.89)).toBe(3);
    expect(rateShare(0.74)).toBe(2);
    expect(rateShare(0.54)).toBe(1);
    expect(rateShare(0)).toBe(1);
  });
});

describe("submitPlan", () => {
  it("is refused until every trip is planned", () => {
    const incomplete = planned([0, 1, UNPLACED]);
    expect(submitPlan(incomplete, puzzle)).toBe(incomplete);
  });

  it("is refused outside the planning phase", () => {
    const intro = createInitialState(puzzleId, puzzle);
    expect(submitPlan(intro, puzzle)).toBe(intro);
  });

  it("wins with the best plan", () => {
    const done = submitPlan(planned(bestPlan), puzzle);
    expect(done.phase).toBe("done");
    expect(done.status).toBe("won");
  });

  it("loses with a plan below the win share", () => {
    const worst = findWorstPlan();
    expect(readPlanShare(worst, puzzle)).toBeLessThan(WIN_SHARE);
    expect(submitPlan(planned(worst), puzzle).status).toBe("lost");
  });
});

describe("calculateScore", () => {
  it("gives five stars for the best plan without peeks", () => {
    expect(calculateScore(submitPlan(planned(bestPlan), puzzle), puzzle)).toBe(5);
  });

  it("takes a star off for each peek, but never below one for a win", () => {
    const done = submitPlan(planned(bestPlan), puzzle);
    expect(calculateScore({ ...done, peeksUsed: 1 }, puzzle)).toBe(4);
    expect(calculateScore({ ...done, peeksUsed: 2 }, puzzle)).toBe(3);
    expect(calculateScore({ ...done, peeksUsed: 9 }, puzzle)).toBe(1);
  });

  it("gives nothing for a loss or a game still going", () => {
    expect(calculateScore(submitPlan(planned(findWorstPlan()), puzzle), puzzle)).toBe(0);
    expect(calculateScore(planned(bestPlan), puzzle)).toBe(0);
  });
});

describe("isStateForRound", () => {
  const fresh = createInitialState(puzzleId, puzzle);
  const done = submitPlan(planned(bestPlan), puzzle);

  it("accepts every state the game can reach", () => {
    [fresh, startPreview(fresh), planning(), planned([1, UNPLACED, 4]), done].forEach((state) => {
      expect(isStateForRound(state, mediumRound)).toBe(true);
    });
    expect(isStateForRound(submitPlan(planned(findWorstPlan()), puzzle), mediumRound)).toBe(true);
  });

  it("rejects a state of another puzzle", () => {
    expect(isStateForRound({ ...fresh, puzzleId: "hard:1" }, mediumRound)).toBe(false);
  });

  it("rejects a plan of the wrong length, a day that does not exist or a shared day", () => {
    expect(isStateForRound({ ...planning(), plan: [UNPLACED, UNPLACED] }, mediumRound)).toBe(false);
    expect(isStateForRound(planned([0, 1, 7]), mediumRound)).toBe(false);
    expect(isStateForRound(planned([0, 1, -2]), mediumRound)).toBe(false);
    expect(isStateForRound(planned([0, 1, 1.5]), mediumRound)).toBe(false);
    expect(isStateForRound(planned([2, 2, UNPLACED]), mediumRound)).toBe(false);
  });

  it("rejects more peeks than the tier allows", () => {
    expect(isStateForRound({ ...planning(), peeksUsed: 3 }, mediumRound)).toBe(false);
    expect(isStateForRound({ ...planning(), peeksUsed: 2 }, mediumRound)).toBe(true);
  });

  it("rejects a finished game that is not complete or has the wrong result", () => {
    expect(isStateForRound({ ...done, plan: [0, 1, UNPLACED] }, mediumRound)).toBe(false);
    expect(isStateForRound({ ...done, status: "lost" }, mediumRound)).toBe(false);
    const lost = submitPlan(planned(findWorstPlan()), puzzle);
    expect(isStateForRound({ ...lost, status: "won" }, mediumRound)).toBe(false);
  });

  it("rejects an unfinished game that already has a result", () => {
    expect(isStateForRound({ ...planning(), status: "won" }, mediumRound)).toBe(false);
  });

  it("rejects peeks or plans before planning has begun", () => {
    expect(isStateForRound({ ...fresh, peeksUsed: 1 }, mediumRound)).toBe(false);
    expect(isStateForRound({ ...fresh, plan: [0, UNPLACED, UNPLACED] }, mediumRound)).toBe(false);
    expect(isStateForRound({ ...startPreview(fresh), peeksUsed: 1 }, mediumRound)).toBe(false);
  });
});
