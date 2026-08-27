---
title: Analytics Disclosure
deck: Why Ocotillo records production sessions and uses site analytics.
date: 2026-08-14
---

## What is recorded?

Ocotillo uses PostHog to collect site analytics and, on the production site, session recordings for signed-in users. A session recording captures page views, clicks, navigation, and general interface behavior so the development team can understand where the application is confusing, slow, or broken.

Form inputs are masked by default in session recordings. Ocotillo does not use session recordings to collect passwords or intentionally capture sensitive field values.

## Why we need it

Ocotillo supports Bureau staff working with geologic data across many workflows. Session analytics help the team:

- Find broken or confusing screens
- Understand which workflows need performance or usability improvements
- Troubleshoot support requests with the page and browser context needed to reproduce problems
- Prioritize fixes based on real usage instead of guesses

## When it starts

Session recording starts after sign-in on the production Ocotillo site. Analytics events may also record basic application activity, such as page views and feature usage.

## Questions

Contact the Data Services team at [ocotillo-nmbg@nmt.edu](mailto:ocotillo-nmbg@nmt.edu) with questions about Ocotillo analytics or session recording.
