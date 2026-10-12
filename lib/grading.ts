export type Difficulty = "EASY" | "MEDIUM" | "HARD";

// Credits per difficulty, used like course-credits in a GPA system
export const CREDITS: Record<Difficulty, number> = {
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
};

// Duration (minutes) rules
export const QUIZ_DURATION_MIN: Record<Difficulty, number> = {
  EASY: 20,
  MEDIUM: 30,
  HARD: 40,
};

export const PAPER_DURATION_MIN: Record<Difficulty, number> = {
  EASY: 30,
  MEDIUM: 45,
  HARD: 60,
};

export const QUESTIONS_PER_QUIZ = 10;

/**
 * GPA-style weighted average across all of a student's quiz attempts.
 * average = sum(percentage_i * credit_i) / sum(credit_i)
 * percentage is 0-100, result is 0-100 (can be displayed as /100 or scaled to a 4.0 scale if desired)
 */
export function computeGpaAverage(
  attempts: { percentage: number; credits: number }[]
): number {
  if (attempts.length === 0) return 0;
  const totalWeighted = attempts.reduce((sum, a) => sum + a.percentage * a.credits, 0);
  const totalCredits = attempts.reduce((sum, a) => sum + a.credits, 0);
  return totalCredits === 0 ? 0 : Math.round((totalWeighted / totalCredits) * 100) / 100;
}

// Optional: convert 0-100 average into a 4.0-style GPA scale, if you want a literal "GPA" number
export function toFourPointScale(percentage: number): number {
  return Math.round((percentage / 100) * 4 * 100) / 100;
}
