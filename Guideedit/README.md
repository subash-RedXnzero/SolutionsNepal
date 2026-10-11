# ✏️ Guideedit — edit guides here (easy + manual)

Every file is **one guide**. The filename is the URL:
`my-guide.md` → `solutionsnepal.com/guides/my-guide`

Just edit the text and rebuild — `sync-content` runs automatically
before dev/build and converts these files for the site. **Never edit
anything inside `src/data/blog/`** (it gets overwritten).

## Edit text

Open any `.md` file. Write plainly:

- normal paragraphs, **bold**, links like [text](/some-page)
- `- ` bullet point, `1. ` numbered step
- `> **Tip:** ...` green tip box (one line starting with `> `)
- tables with `| like | this |`, formulas in ``` blocks

Top of the file (between the `---` lines) controls the page header:
title, description, category, cover `image:`, tags, FAQs.

## Headings + side menu

Each side-menu entry needs **two matching lines**:

1. In the text: `<h2 id="my-section">My section</h2>`
2. At the top under `headings:`:
   ```
     - id: my-section
       text: My section
       level: 2
   ```

The `id` must match exactly (lowercase, dashes, no spaces).

## Images

1. Drop the photo into `Guideedit/images/` (JPG under ~300 KB is best)
2. Cover photo — top of the file: `image: /blog/my-photo.jpg`
3. Inside the text, anywhere: `![describe the photo](/blog/my-photo.jpg)`

Delete an image = delete it from `images/` + remove its line.
Remote (Unsplash) links also still work.

## Add a new guide

1. Copy `_TEMPLATE.md` to a new name, e.g. `my-new-guide.md`
   (lowercase letters, numbers and dashes only — this becomes the URL)
2. Fill in the top block + text, rebuild. It appears under **Guides**.
   To put it on **Blog** instead, move the file into `Blogedit/`.

## Delete / move a guide

- Delete the `.md` file → its page, listing and sitemap entry disappear.
- Move the file between `Guideedit/` and `Blogedit/` → it moves
  between the Guides library and the Blog journal.

## Admin dashboard (optional)

Once Decap CMS is connected (see `DECAP-SETUP.md` at project root),
you can do all of the above at `yoursite.com/admin/` — create, edit,
upload images and delete — without touching files. It edits these
same `.md` files, so both ways stay in sync. If a new post has no
`headings:` block, the side menu is built from its headings automatically.
