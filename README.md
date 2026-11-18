# はたらく車レース · Working Cars Race

A friendly desert race for kids who like Japanese working vehicles (働く車): an ambulance, a fire truck, a garbage truck, a tractor, and a truck.

This is a fork of the MIT-licensed [pmndrs/racing-game](https://github.com/pmndrs/racing-game). The track, cannon-es vehicle physics, and rendering approach come from that project. The cars, garage, practice mode, and two-player split screen are new.

## Play

- **Practice (れんしゅう):** pick one vehicle and drive. A lap timer starts at the start line. Nothing to lose.
- **Two-player race (2 人レース):** each player picks a vehicle. First to 2 laps wins.
- **Speed:** ゆっくり / Gentle is the slower default. はやい / Faster is still an easy arcade car, not the original race car.
- A car that lands upside down, or falls off the map, is put back on its wheels.

### Controls

Keys use `KeyboardEvent.code`, so they follow the physical key, not the keyboard layout.

|          | Accelerate             | Brake / reverse          | Left                     | Right                     |
| -------- | ---------------------- | ------------------------ | ------------------------ | ------------------------- |
| Player 1 | Numpad 8 (or Arrow Up) | Numpad 5 (or Arrow Down) | Numpad 4 (or Arrow Left) | Numpad 6 (or Arrow Right) |
| Player 2 | D                      | X                        | Z                        | C                         |

Letter keys are only Player 2's four controls. The old WASD, camera, editor, and debug shortcuts are gone so the two players do not fight over the keyboard.

## Develop

```bash
npm install
npm run dev
```

The dev server uses the same base path as GitHub Pages, so open `http://localhost:5173/working-cars-race/`.

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

Production is built with Vite `base: '/working-cars-race/'` and deployed by `.github/workflows/pages.yml` on every push to `main`.

The repository owner still has to turn Pages on once:

1. GitHub → **Settings → Pages**.
2. **Build and deployment → Source:** GitHub Actions.
3. Merge this branch to `main`. The workflow publishes `https://arpi-ai-automation.github.io/working-cars-race/`.

## Credits

See [CREDITS.md](CREDITS.md). The code license stays MIT; see [LICENSE.md](LICENSE.md).
