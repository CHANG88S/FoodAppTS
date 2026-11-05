// Profanity and explicit-content filter for user-generated content.
//
// Applied at creation time on all public write paths (tweets, comments,
// review notes, DMs) to keep the app's age rating at 13+ and satisfy
// Guideline 1.2's content-filtering requirement.
//
// Matching is intentionally conservative to avoid false positives on a
// food app: unambiguous stems are matched as substrings anywhere, while
// terms that appear inside innocent words ("grape", "class", "Essex",
// "shiitake") are only matched on word boundaries. Text is normalized
// first (lowercased, common leetspeak substitutions resolved) and each
// letter in a term is matched 1+ times, so "fuuuck" and "b00bs" are caught.

// Terms safe to match as substrings anywhere in the text.
const SUBSTRING_TERMS = [
  // Strong profanity
  "fuck", "motherfucker", "asshole", "bullshit", "cocksucker",
  "dickhead", "wanker", "dumbass", "jackass",
  // Sexual / explicit
  "porn", "dildo", "hentai", "blowjob", "handjob", "cumshot", "bukkake",
  "gangbang", "orgasm", "masturbation", "erection", "bestiality",
  // Slurs and hate speech
  "nigger", "nigga", "faggot", "kike", "tranny", "wetback", "pedophile",
];

// Terms only matched on word boundaries - each of these appears inside
// innocent words or place names and would cause false positives as a
// substring ("shiitake" contains s-h-i-t, "grape" contains "rape",
// "Essex" contains "sex", "thorny" contains "horny", "assess" contains
// "ass", "Scunthorpe" contains "cunt").
const BOUNDARY_TERMS = [
  "shit", "shitty", "shithead", "shits",
  "bitch", "bitches", "bitchy",
  "ass", "bastard", "bastards",
  "dick", "dicks", "pussy", "tits", "boobs",
  "anal", "rape", "raped", "horny", "nude", "nudes", "sex",
  "twat", "prick", "douchebag", "retard", "retarded", "spic", "coon",
  "chink", "cunt", "cunts",
];

export const PROFANITY_ERROR_MESSAGE =
  "This contains language that isn't allowed on BuhEats. Please revise it.";

// Lowercase and resolve common leetspeak substitutions. Non-letter
// characters become spaces so "a$s" normalizes cleanly. "@" and "0" are
// ambiguous ("f@ck"/"f0ck" mean "fuck", "@ss"/"b00bs" need a/o), so each
// text is checked under two substitution passes.
function normalize(text: string, atSub: string, zeroSub: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, zeroSub)
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, atSub)
    .replace(/\$/g, "s")
    .replace(/[^a-z\s]/g, " ");
}

// Escape each term for regex and allow 1+ of every letter so repeated
// characters ("fuuuck") still match.
function termToPattern(term: string): string {
  return term
    .split("")
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "+")
    .join("");
}

const SUBSTRING_PATTERN = new RegExp(
  SUBSTRING_TERMS.map(termToPattern).join("|"),
  "i"
);

const BOUNDARY_PATTERN = new RegExp(
  `\\b(?:${BOUNDARY_TERMS.map(termToPattern).join("|")})\\b`,
  "i"
);

// True if the text contains profanity or explicit content. Used on every
// user-generated content write path; throws via PROFANITY_ERROR_MESSAGE.
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  // "@" and "0" substitute for different vowels in different evasions
  const passes: [string, string][] = [
    ["a", "o"], // "@ss" -> ass, "b00bs" -> boobs
    ["u", "u"], // "f@ck"/"f0ck" -> fuck, "b0llshit" -> bullshit
  ];
  for (const [atSub, zeroSub] of passes) {
    const normalized = normalize(text, atSub, zeroSub);
    if (SUBSTRING_PATTERN.test(normalized) || BOUNDARY_PATTERN.test(normalized)) {
      return true;
    }
  }
  return false;
}
