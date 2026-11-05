# BuhEats — App Store Connect Listing Draft

Fill-in reference for the ASC "App Information" and "Version Information" pages.
Character limits noted where they exist.

## Identity

| Field | Value |
|---|---|
| App Name | BuhEats |
| Bundle ID | com.chang88s.buheats |
| SKU | buheats-001 (any unique string) |
| Primary Language | English (U.S.) |
| Copyright / Owner | Simon Chang |

## Subtitle (≤30 chars)

```
Rate dishes, not just spots
```
(27 chars)

## Promotional Text (≤170 chars)

```
Boba sweetness. Late-night eats. Rate the actual dish, not the restaurant. Join the community that rates food the way it deserves — one item at a time.
```

## Description

```
BuhEats is the honest food rating app that rates individual dishes — not just restaurants.

That boba was 9/10 but would've been perfect with less ice? Say it. That burger spot is average overall but the fries are elite? Tell the world.

FEATURES
• Rate individual menu items with granular attributes — sweetness, ice level, and more
• Discover restaurants near you and browse what the community actually recommends
• Share quick takes on the social feed and follow your favorite food lovers
• Build a taste profile (milk base, favorite cuisines, dietary needs) for smarter picks
• Check in to spots you visit and build your food history
• Earn badges as you explore

WHAT MAKES IT DIFFERENT
Restaurant apps average everything into one score. BuhEats knows the drink is the reason you go back — so every item gets its own rating, reviews, and photos from real customers.

No ads. No tracking. Just food talk.

Download BuhEats and rate what actually matters.
```

## Keywords (≤100 chars, comma-separated, no spaces)

```
food,restaurants,reviews,ratings,boba,bubble tea,menu,eats,dining,drinks,dessert,snacks
```

## Support / URLs (after GitHub Pages is enabled)

- Support URL: https://chang88s.github.io/FoodAppTS/
- Privacy Policy URL: https://chang88s.github.io/FoodAppTS/privacy-policy.html
- Terms URL (optional field, where offered): https://chang88s.github.io/FoodAppTS/terms.html
- Marketing URL: leave empty

## Age Rating Questionnaire (App Store age rating)

Answered to land at 4+ (13+ with UGC) — answer consistently:

| Question | Answer |
|---|---|
| Cartoon/fantasy violence, realistic violence, profanity/crude humor, horror, alcohol/tobacco/drugs, gambling, sexual content | None of these |
| Unrestricted web access | No |
| User-generated content | Yes |
| Does UGC include messaging, sharing violence/sexual content/gore? | No |
| Age assurance for UGC apps | 13+ — age confirmed at sign-up checkbox |
| Moderation | Yes — profanity filter at creation, user reporting, blocking, moderator review, content removal |

## Privacy "Nutrition Labels" (Data Collection)

Answer: **Data Linked to You** — collected, not used for tracking:

| Type | Data collected |
|---|---|
| Contact Info | Email address, name (optional display name) |
| User Content | Reviews, ratings, photos, other user content (tweets/comments) |
| Identifiers | User ID |
| Usage Data | Product interaction (feature usage, coarse) — only if comfortable; otherwise answer None for usage |

- Tracking across companies' apps: **No** (no tracking of any kind)
- Third-party sharing: Mapbox receives map-tile requests (not identity-linked); answer "No data shared with third parties for tracking/advertising"

## App Review Notes (paste into Review Notes field)

```
BuhEats is a social food-rating app. For review:

DEMO ACCOUNT (email/password, ready to sign in):
  Email:    [CREATE THIS — see below, then paste credentials here]
  Password: [password here]

Sign in with Apple is available, but the demo account works without an Apple ID.
Both sign-in paths are supported (email/password is the primary path).

User-generated content is moderated: profanity filtering runs at content creation,
users can report and block others, and reports are reviewed by moderators who can
remove content and suspend users. Age 13+ is confirmed with a checkbox at sign-up.

Everything else in the app is self-explanatory: browse the feed, search restaurants,
rate a menu item, or post to the feed. Thank you!
```

**Before submitting, create the demo account** (e.g. `buhdemo@example.com` /
`Demo1234!`) on the prod deployment via the app's sign-up, rate a couple of items
and make one post with it so App Review sees populated content.

## Screenshot Plan (6.7" — required set, no iPad needed)

Simulator: iPhone 16 Pro (6.9") or any 6.7"/6.9" device — capture these screens in order:
1. Home feed (populated with posts)
2. Restaurant detail with rated items
3. Item rating screen with granular attributes
4. Search/discover
5. Profile with badges

## Reminders Before Submitting

- [ ] Icon/splash art still shows old FoodRater branding — replace assets if desired
- [x] Support email: `support@buheats.com` — domain registered, inbox live, referenced consistently in app (privacy/terms/help) and docs
- [ ] Enable GitHub Pages (Settings → Pages → Deploy from branch → main → /docs)
- [ ] Push docs/ so the Pages URLs go live
- [ ] Enable Sign in with Apple on App ID com.chang88s.buheats
- [ ] Create demo account on prod
