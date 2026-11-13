// Server-side limits on user-written input. Each cap sits well above the
// matching TextInput maxLength in the app, so nothing typed on a screen ever
// reaches it; it only stops direct calls that would bloat a document toward
// Convex's 1 MB limit.
export const MAX_POST_LENGTH = 2000; // tweets, review notes, DMs
export const MAX_COMMENT_LENGTH = 1000; // tweet and review comments
export const MAX_SHORT_TEXT_LENGTH = 500; // review order notes
export const MAX_REVIEW_CRITERIA = 50;

export function assertMaxLength(text: string | undefined, max: number, label: string) {
  if (text !== undefined && text.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
}

// The rate screen offers 0.5 to 5.0 in half-star steps.
export function assertRating(rating: number) {
  if (!(rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2))) {
    throw new Error("Rating must be between 0.5 and 5 in half-star steps.");
  }
}
