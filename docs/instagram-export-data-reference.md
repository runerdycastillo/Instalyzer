# Instagram Export Data Reference

## Purpose

This document is the practical reference for what Instalyzer can realistically extract from an Instagram export.

Use it to answer:

- what data is clearly available
- what data is safe to rely on
- what data is useful but should be treated carefully
- what data should not be presented as stronger than it really is

This is meant to be a product and implementation reference, not a marketing promise.

## Source Of Truth For This Reference

This reference is based on:

- the real sample export already inspected in the project
- the current parser and classification work in `instalyzer-static/script/home-datasets.js`
- the existing schema notes in [dataset-schema-and-overview.md](/c:/Users/SYK/OneDrive/Desktop/Projects/2026/Mar/instalyzer-workspace/docs/dataset-schema-and-overview.md)

## Confidence Labels

- `Confirmed`: observed in the real sample export and already reflected in the parser or schema notes
- `Useful With Caution`: present or strongly indicated, but should be labeled carefully in product UI
- `Observed Family`: a file/category family we expect to use later, but it is not yet part of the normalized dataset model

## Core Rules

1. The export is not one perfect real-time account snapshot.
2. Relationship data and insight summary data should be treated as different trust layers.
3. Shorter date-range exports may still be useful for summary tools, but they are weaker for relationship tools.
4. We should only headline metrics that are stable and defensible from the export.

## Export Data Families

### 1. Account Identity

Primary source:

- `personal_information/personal_information/personal_information.json`

Confirmed extractable fields:

- username
- display name when present
- bio when present
- website when present
- private/public flag when present
- profile photo file reference
- profile photo timestamp when present

Why it matters:

- dataset identity header
- workspace top band
- report identity
- account snapshot context

Confidence:

- `Confirmed`

### 2. Relationship Records

Primary sources:

- `connections/followers_and_following/followers_1.json`
- `connections/followers_and_following/following.json`

Confirmed extractable fields:

- follower usernames
- following usernames
- href/profile links when present
- timestamps on records
- source type such as follower vs following

Reliable derived outputs:

- follower record count in dataset
- following record count in dataset
- mutuals from exported records
- not-following-back from exported records

Important caution:

- these are export-backed dataset records, not live synced Instagram state
- relationship completeness may depend on export scope and quality
- `Not Following Back` is strongest when the user exports `JSON` and `All time`

Confidence:

- raw records = `Confirmed`
- relationship tools built from those records = `Useful With Caution`

### 3. Audience Insight Summary Data

Primary source:

- `logged_information/past_instagram_insights/audience_insights.json`

Confirmed or strongly supported fields:

- follower total
- follows in range
- unfollows in range
- net follower change
- follower percentages by city
- follower percentages by country
- follower percentages by age
- follower percentages by gender
- follower activity by day
- insight date range label when present

Why it matters:

- audience insights
- growth summaries
- demographics views
- later posting-time guidance

Confidence:

- summary metrics = `Confirmed`
- strategy recommendations built from them = `Useful With Caution`

### 4. Reach / Visibility Insight Summary Data

Primary source:

- `logged_information/past_instagram_insights/profiles_reached.json`

Confirmed or strongly supported fields:

- accounts reached
- impressions
- profile visits
- external link taps
- insight date range label when present

Why it matters:

- visibility summary
- profile funnel reporting
- overview metrics

Confidence:

- `Confirmed`

### 5. Interaction Insight Summary Data

Primary source:

- `logged_information/past_instagram_insights/content_interactions.json`

Confirmed or strongly supported fields:

- content interactions
- post interactions
- story interactions
- story replies
- accounts engaged
- insight date range label when present

Why it matters:

- engagement summary
- content performance summary
- story interaction overview

Confidence:

- `Confirmed`

### 6. Date Range Signals

Known source behavior:

- some insight files include a `Date Range` field
- there does not appear to be one universal archive-level date range field for the whole export

What we can safely extract:

- a detected insight date range label
- the source file the label came from

What we should not overclaim:

- that one detected date range applies to every record in the dataset
- that the export is universally complete for every tool

Confidence:

- presence of date range signals = `Confirmed`
- one universal dataset-wide range = `Not Safe To Assume`

### 7. Media / Activity / Event Families

Observed or referenced export families include:

- profile photos
- comments
- liked posts
- story likes
- emoji story reactions
- poll responses
- question responses
- story/media timestamped records

What these can eventually support:

- story engagement breakdowns
- interaction pattern tools
- content cadence summaries
- deeper reporting modules

Current product reality:

- these families are promising, but they are not yet part of the main normalized dataset contract
- they should be treated as later expansion areas until we inspect and normalize them carefully

Confidence:

- category/file-family existence = `Observed Family`
- stable product metrics from them = `Not Ready Yet`

## Best Current Dataset Layers

### Stable Identity Layer

Good candidates for top-of-workspace display:

- username
- display name
- profile photo
- bio and website later if useful

### Trusted Overview Metrics

Best candidates for headline overview metrics:

- follower total from insights
- accounts reached
- impressions
- profile visits
- external link taps
- content interactions
- accounts engaged
- detected insight range when available

### Tool-Only Or Secondary Metrics

Useful, but better kept in tools or qualified UI:

- following count from exported records
- mutual count
- not-following-back count
- follows in range
- unfollows in range
- net follower change
- audience breakdowns
- event-family rollups

## What We Should Not Promise Yet

Do not treat these as confirmed first-class capabilities without more inspection:

- live follower count
- live following count
- exact real-time account state
- ghost followers as a trustworthy core metric
- deep relationship labels such as admirers or top followers
- precise posting-time optimization
- strong AI recommendations without clearer underlying logic

## Practical Product Takeaways

### What The Export Already Supports Well

- reusable account dataset identity
- relationship comparison tools
- visibility summary metrics
- interaction summary metrics
- audience insight summaries

### What The Export Supports, But With Qualification

- relationship-based counts and labels
- range-based growth interpretations
- audience strategy suggestions
- event-family drilldowns

### What Needs More Inspection Before We Build Around It

- deeper raw engagement event normalization
- content-level reporting layers
- advanced recommendation systems
- premium reporting claims beyond the current parser-backed metrics

## Recommended Next Inspection Pass

When we return to data work, inspect these next:

1. the exact shape of `audience_insights.json`
2. the exact shape of `profiles_reached.json`
3. the exact shape of `content_interactions.json`
4. one or two event-family files such as comments or story reactions
5. whether all-time vs shorter-range exports materially affect relationship completeness

## Working Summary

If we had to summarize the export in one sentence:

Instalyzer can already support a strong dataset workspace built from account identity, relationship records, and Instagram insight summary files, but we should keep deeper event-based and AI-style features behind further inspection and normalization work.
