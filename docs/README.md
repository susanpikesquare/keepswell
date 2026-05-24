# Customer-facing docs

This folder holds Keepswell's customer-facing documentation.

| File | What it is |
|---|---|
| `USER_GUIDE.md` | The canonical user guide (Markdown source of truth). Renders nicely on GitHub. |
| `Keepswell-User-Guide.pdf` | A branded PDF export of the user guide. Generated from the Markdown — don't hand-edit. |
| `assets/` | Brand logos referenced by both the Markdown and the PDF builder. |
| `.tools/build-pdf.mjs` | Script that converts the Markdown into the branded PDF. |

## Regenerating the PDF

After editing `USER_GUIDE.md`, regenerate the PDF:

```bash
node docs/.tools/build-pdf.mjs
```

Requirements (macOS):

- **Node.js** 18+
- **Google Chrome** installed at the default Application path (used as a
  headless renderer)

The script:

1. Resolves `marked` (from any nearby `node_modules`, or installs it
   into `docs/.tools/vendor/` on first run).
2. Converts the Markdown to HTML with the embedded brand CSS
   (Playfair Display + Inter via Google Fonts, Keepswell color palette,
   page footer with pagination).
3. Calls headless Chrome with `--print-to-pdf` to render the final PDF.

Output lands at `docs/Keepswell-User-Guide.pdf`.
