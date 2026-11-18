export interface OrderFeedback {
  correct: boolean[];
  isSolved: boolean;
}

export function checkOrder(order: readonly number[]): OrderFeedback {
  const correct = order.map((item, position) => item === position);
  return { correct, isSolved: correct.every(Boolean) };
}
