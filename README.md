# Jeremy Kalfus Homepage

The live site is available [here](https://jeremykalfus.github.io/JeremyKalfus/).

## Local checks

Install the QA harness:

```bash
npm install
```

Run the homepage smoke suite:

```bash
npm test
```

Preview the static site locally:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

## Homepage guardrails

- Keep homepage prose at `18px` with `1.5` line height.
- Keep readable copy capped to roughly `64ch`.
- Default first-load theme to light mode, while preserving a stored manual theme choice.
- Maintain high contrast in both themes; do not drop body/supporting text below the current readability floor.
- Do not add default tracking or letter-spacing changes as a readability gimmick.
- Keep the homepage focused on scanning linked PDFs; do not convert or transform the PDFs in the homepage experience.
- After every push to `main`, smoke-check the deployed site at `https://jeremykalfus.github.io/JeremyKalfus/`.

## Notes

Writing samples are presented as evidence of writing ability rather than as academic research claims. Dates shown in LaTeX files reflect retrieval dates, and school names have been replaced with `"NAME"` for privacy.
