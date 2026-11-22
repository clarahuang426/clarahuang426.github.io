# Animal Monopoly

Open `index.html` through the site or a local HTTP server. This is the current shared-device prototype: player setup, two dice, sequential turns, player pieces, $200 for Go, animal purchases, and property purchase requests.

- `game-source.html` is the editable game fragment.
- `index.html` is the standalone export, including its browser-local saved-game adapter. No personal saved game is included.

To regenerate the export, use the Visualize skill's `scripts/render.py` with `game-source.html` as the source and `index.html` as the destination, and pass `--title "Animal Monopoly" --force`.

Rent and Mystery Card expenses must be paid. If cash is insufficient, properties are automatically sold back to the bank, lowest purchase price first, until the bill can be covered. Each sale returns 60% of the current owner's actual purchase price (including negotiated trades). Sold properties become unowned and related trade offers are cancelled. If all property sales still cannot cover the bill, remaining cash is paid and the player goes bankrupt and leaves play. Bankrupt players are skipped; the last remaining player wins. Balances never go below $0. Purchases and trades require enough cash. Purchase prices and bankruptcy persist in saved games; older saves use the bank price for properties whose actual purchase price was not recorded. Passing or reaching Go awards $200. Landing on the $500 corner awards $500. Landing on Mystery Card draws from a shuffled deck of 15 animal events and applies the printed cash reward or expense immediately. The deck reshuffles after the last card. Go to Jail moves the piece directly to Jail and skips its next turn. A normal landing on Jail is just visiting. Use Buy a house beside Trade to see properties in your complete color sets. Each house costs the color’s listed house price, and the fifth purchase converts that property to a hotel. Uneven building is allowed. Buildings increase actual rent and are saved with the game. Complete sets (three properties, or two black properties) are marked on the board, in property details, and in the player roster. Buildings stay with a property when traded; forced bank sales remove its buildings and return 60% of the recorded property purchase price.

Run economy regression checks with `node projects/animal-monopoly/tests/economy.cjs` from the repository root.

Mystery Cards appear in a large shared-screen dialog for both humans and CPUs. Cards remain visible for at least 10 seconds, with a countdown before Continue is enabled. Play then stays paused until someone presses Continue; pending cards also reopen after restoring the saved game.

The Buy a house panel also lets you voluntarily sell houses before or after rolling on your turn, regardless of your cash balance. Each sold house returns 60% of its color’s construction price and reduces rent; you keep the property. A hotel is sold down to four houses one upgrade at a time. A complete color set is not required to sell existing houses.

Owned properties show a color marker matching their owner’s player piece, rather than an owner-name label. The property details and accessible tile labels still identify the owner by name.
