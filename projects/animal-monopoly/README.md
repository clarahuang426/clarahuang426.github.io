# Animal Monopoly

Open `index.html` through the site or a local HTTP server. This is the current shared-device prototype: player setup, two dice, sequential turns, player pieces, $200 for Go, animal purchases, and property purchase requests.

- `game-source.html` is the editable game fragment.
- `index.html` is the standalone export, including its browser-local saved-game adapter. No personal saved game is included.

To regenerate the export, use the Visualize skill's `scripts/render.py` with `game-source.html` as the source and `index.html` as the destination, and pass `--title "Animal Monopoly" --force`.

Landing on another player’s property transfers the full base rent to its owner, even if the visitor’s balance goes below zero. Passing or reaching Go awards $200. Landing on the $500 corner awards $500. Landing on Mystery Card draws from a shuffled deck of 15 animal events and applies the printed cash reward or expense immediately. The deck reshuffles after the last card. Go to Jail moves the piece directly to Jail and skips its next turn. A normal landing on Jail is just visiting. Construction is not implemented yet.
