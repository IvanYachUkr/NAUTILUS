# Competition definitions

Each JSON file in this directory is one OpenGuessr competition and one website
filter. The preferred format embeds the ordered location records directly.

The repository currently contains:

```text
europe-easy.json      8 locations
europe-medium.json    9 locations
europe-hard.json      8 locations
```

Coordinates are never typed manually. `npm run data:build` derives them from each
full `google_maps_link` and writes a paste-ready TXT under
`data/generated/competition-links/`.

Interactive export:

```powershell
npm run competition:export
```

Windows file picker:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\select-competition.ps1 -Copy
```

Direct export and clipboard copy:

```powershell
npm run competition:export -- --id=europe-easy --copy
```

The array order is the OpenGuessr round order. A file may contain at most 20
locations unless `splitIfNeeded` is `true`, in which case deterministic `part`
files are generated.

A minimal source file with only a `locations` array is valid; the ID and name
are derived from the filename. Use the optional `order` field to control the
Easy → Medium → Hard order in the website, extension, and export selector.
