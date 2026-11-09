# Animal Monopoly

Open `index.html` through the site or a local HTTP server. This is the current shared-device prototype: player setup, two dice, sequential turns, player pieces, $200 for Go, animal purchases, and property purchase requests.

- `game-source.html` is the editable game fragment.
- `index.html` is the standalone export, including its browser-local saved-game adapter. No personal saved game is included.

To regenerate the export, use the Visualize skill's `scripts/render.py` with `game-source.html` as the source and `index.html` as the destination, and pass `--title "Animal Monopoly" --force`.

Rent values and building rules are displayed, but automatic rent collection, construction, jail rules, and mystery-card effects are not implemented yet.
