# Shitty AI App Idea Generator

A single-page static website that serves random terrible AI startup ideas.

It is built for GitHub Pages, has no build step, and loads its idea pool from JSON files under [`ShittyIdeas/`](ShittyIdeas/).

## What It Does

- Shows one random shitty AI app idea on each visit.
- Avoids immediately repeating the last idea shown in the same browser.
- Loads ideas from multiple JSON files so the content pool can grow without turning into one giant file.
- Works as a plain static site: HTML, CSS, JavaScript, JSON, and a favicon.

## Project Structure

```text
.
├── index.html
├── styles.css
├── script.js
├── favicon.svg
├── CNAME
└── ShittyIdeas/
    ├── index.json
    ├── consumer-chaos.json
    ├── enterprise-nightmares.json
    └── ...
```

Key files:

- [`index.html`](index.html) is the page shell.
- [`styles.css`](styles.css) handles the visual design.
- [`script.js`](script.js) loads the idea files and picks a random idea.
- [`ShittyIdeas/index.json`](ShittyIdeas/index.json) is the manifest. If a JSON file is not listed there, the site will not load it.
- [`CNAME`](CNAME) defines the custom domain for GitHub Pages.

## Run Locally

Because the site fetches JSON files, do not open `index.html` directly from the filesystem. Serve it over HTTP instead.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## How Ideas Work

The site loads [`ShittyIdeas/index.json`](ShittyIdeas/index.json), reads the list of registered idea files, fetches each one, flattens all ideas into one pool, and picks a random entry.

Each idea file uses this shape:

```json
{
  "ideas": [
    {
      "text": "An AI toaster that detects emotional weakness and recommends venture debt."
    },
    {
      "text": "A startup copilot for people who should be stopped by friends."
    }
  ]
}
```

## Add More Shitty Ideas

You have two options.

### 1. Add ideas to an existing JSON file

Open any file inside [`ShittyIdeas/`](ShittyIdeas/) and append more objects inside its `ideas` array.

Example:

```json
{
  "text": "An AI roommate mediator that sides with whoever owns the nicer pan."
}
```

Rules:

- Keep each idea as an object with a `text` field.
- Keep the JSON valid.
- Do not leave empty strings.

### 2. Create a brand-new idea file

Create a new JSON file inside `ShittyIdeas`, for example:

```text
ShittyIdeas/absurd-fintech.json
```

Add content like this:

```json
{
  "ideas": [
    {
      "text": "An AI invoice generator that bills your friends for wasting your creative energy."
    },
    {
      "text": "A fintech app that rounds every purchase up into a therapy budget."
    }
  ]
}
```

Then register it in [`ShittyIdeas/index.json`](ShittyIdeas/index.json):

```json
{
  "file": "absurd-fintech.json",
  "slug": "absurd-fintech",
  "title": "Absurd Fintech"
}
```

Rules:

- `file` must match the filename exactly.
- `slug` should be unique.
- `title` is just a human-readable label for the pack.
- If you forget to add the file to the manifest, the site will ignore it.

## Publish on GitHub Pages

This repo is already structured for GitHub Pages. There is no build step.

Typical setup:

1. Push the repo to GitHub.
2. In the repository settings, open `Pages`.
3. Set the source to deploy from branch `main` and folder `/root`.
4. Save.

If you want to use the current custom domain, keep [`CNAME`](CNAME) as-is. If the domain changes, update that file.

## Tone Guide for New Ideas

The site works best when the ideas sit somewhere between:

- startup jargon
- low-stakes societal decay
- product managers making eye contact with evil
- apps that solve problems nobody should industrialize

Good ideas are short, specific, stupid, and a little too believable.
