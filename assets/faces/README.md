# Enemy face images

Drop up to 10 circular PNGs here, named exactly:

```
face1.png
face2.png
...
face10.png
```

Transparent background recommended — each is applied as a flat circular
disc on the bot's head, replacing the default sci-fi visor.

- Add as few or as many as you like. With none present, bots use the
  default procedural visor instead — nothing breaks.
- When a round has more than one bot, faces are shuffled and handed out
  without repeats (up to however many images you've actually supplied).
- **These files are gitignored on purpose** (see the repo's `.gitignore`)
  — they never get committed or pushed, so this stays a purely local
  customization. If the photos are of real, identifiable people, keep it
  that way rather than publishing them.
