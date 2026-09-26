# Vetaal

Vetaal is a general knowledge trivia app for people who actually want to learn something, not just rack up a score. The name comes from Vikram aur Betaal, the old Indian folk tale of a riddling spirit who challenges a king with one clever question after another. That is the spirit this app is going for: a good, honest question, followed by an answer worth knowing.

## Why this exists

Most trivia apps are built to hold your attention rather than earn it. They are loud with streaks and badges, cluttered with ads, and not always careful about whether the answers are even correct. Vetaal tries to be the opposite of that. There is no leaderboard, no points to chase, and no ads. Every question comes with a short explanation, so even a wrong answer leaves you knowing something new. The aim is a calm, trustworthy place to learn, rather than another app competing for your time.

## How it works

The app currently covers three categories: capitals, physical geography, and history, each split into smaller subjects you can play individually or mix together. A round is untimed and solo. You choose a subject, answer at your own pace, and never see the same question twice. The correct answer and its explanation are only sent to your browser after you submit a choice, so nothing can be seen ahead of time, even by someone poking around in the network traffic.

New players get a private session automatically, with nothing to sign up for. That session quietly keeps track of what you have already answered, so your progress carries over the next time you come back.

## How it was built

Vetaal is built with Lovable, describing features and changes in plain language rather than writing every line of code by hand. That does not mean it was thrown together. Details like how questions are picked at random without slowing down as the question bank grows, or how the admin screen checks a CSV file before anything reaches the database, were worked through deliberately rather than accepted on the first try. The questions themselves are written and checked by hand, not pulled from the internet, because getting the facts right is the whole point of the app.

Under the hood, it runs on:

- TanStack Start for the application
- React and TypeScript
- Tailwind CSS for styling
- Supabase for the database, authentication, and server-side functions

## What's next

This is still a prototype, built to prove the idea out before turning it into a native app. More categories are on the way, along with a way to turn a private session into a proper account, so progress can follow you across devices instead of staying on one browser.

## Running it locally

You will need Node.js and npm. If you do not have them, [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) is the easiest way to install both.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
