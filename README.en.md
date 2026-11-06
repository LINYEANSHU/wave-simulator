<p align="center"><a href="README.md">简体中文</a> · English</p>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="WaveLab: a two-dimensional wave equation lab, with a diagram of double slits and an observation screen">
</p>

**Draw sources and barriers, then watch propagation, interference and diffraction.**
WaveLab advances a two-dimensional scalar wave equation with WebGL2 and measures waveforms and time-averaged intensity with a probe and observation screen.

![Current desktop interface: the initial propagation phase of the double-slit experiment, with wavefronts approaching the slits and controls on the right](assets/readme/current-desktop.png)

<details>
<summary>View the mobile interface</summary>

<img src="assets/readme/current-mobile.png" width="390" alt="Mobile interface with horizontally selectable scenes, a wave field and probe above the controls">

</details>

[![CI](https://github.com/LINYEANSHU/wave-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/LINYEANSHU/wave-simulator/actions/workflows/ci.yml)
[MIT](LICENSE) · Vanilla JavaScript / WebGL2 · No build · English / 中文

## Start with double-slit interference

Open `index.html` directly to load the double-slit scene, or start a local server with Python 3:

```bash
git clone https://github.com/LINYEANSHU/wave-simulator.git
cd wave-simulator
python -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080**. All scripts and assets are in the repository; no runtime downloads or dependency installation are needed.

The browser needs **WebGL2** and **`EXT_color_buffer_float`**. Initialization failures appear on the page. Use a modern Chrome, Edge or Firefox configuration that supports both.

1. Wait for the wavefront to pass through the slits and reach the dashed observation screen.
2. Select the time-averaged intensity view and watch the fringes develop.
3. Change the source frequency or erase part of a wall to change the slit width; compare the patterns.
4. Place a probe to inspect a local waveform. Pause and step through changes, or export a PNG with the camera button.

## Twelve editable scenes

Presets place sources, barriers and measurement tools. You can continue editing after loading any scene.

| Scene | What to observe |
| --- | --- |
| Double-slit interference | Time-averaged screen fringes |
| Single-slit diffraction | Slit width and lateral spreading |
| Huygens' principle | Directional beams from multiple slits |
| Opposing standing waves | Fixed nodes and antinodes |
| Lloyd's mirror | Direct and reflected wave interference |
| Parabolic focusing | Amplitude at and away from the focus |
| Multiple-source interference | Main lobe of equally spaced, in-phase sources |
| Doppler effect | Wavefront spacing ahead of and behind a moving source |
| Beats | Envelope formed by nearby frequencies |
| Dipole radiation | Directionality of opposite-phase sources |
| Reflective cavity | Standing-wave patterns inside the cavity |
| Free experiment | Your own sources and reflective or absorbing walls |

## Tools and measurements

| Action | Control |
| --- | --- |
| Place / move a source | `1`; click to place, drag an existing source |
| Pulse / wall / eraser / probe | `2` / `3` / `4` / `5` |
| Temporary erasing | Right-drag with any tool |
| Pause / step / reset the field | `Space` / `S` / `R` |
| Frequency, amplitude and phase | Source card |
| Intensity view, colors, boundary and screen | View controls |
| Wave speed, playback speed, brush and wall material | Parameter panel |
| Export / change language | Camera / language button in the top bar |

The probe shows displacement over time and measured frequency. The observation screen samples exponentially averaged intensity `⟨u²⟩` along a vertical line. Allow time for waves to arrive and samples to accumulate; the screen is not an instantaneous far-field analytic solution.

## Numerical model

The solver advances `∂²u/∂t² = c²∇²u` with explicit second-order central differences and a fixed timestep `Δt = 1/180`. The UI constrains the Courant number `C = cΔt/Δx` to 0.08–0.70, below the two-dimensional stability limit `1/√2`.

A fragment shader advances double-buffered floating-point field textures. Reflective walls impose `u = 0`; absorbing walls add damping. The outer boundary can use a sponge layer or reflection. Physics uses fixed steps; at low frame rates, accumulated time is discarded to bound the computation.

Open **Scientific Notes** in the app for the full explanation. Keep roughly 10 or more cells per wavelength to reduce numerical dispersion. Absorbers can still reflect some waves. This is a linear two-dimensional scalar model, without the full fluid dynamics of real water waves.

## Source and checks

| File | Responsibility |
| --- | --- |
| [sim.js](js/sim.js) / [glutil.js](js/glutil.js) | FDTD, WebGL2 rendering and measurement readback |
| [scenes.js](js/scenes.js) | Twelve teaching scenes |
| [ui.js](js/ui.js) / [i18n.js](js/i18n.js) | Tools, measurement panels and bilingual text |
| [main.js](js/main.js) | Fixed-timestep loop and canvas sizing |

CI uses Node.js 22 to syntax-check all JavaScript. In PowerShell:

```powershell
Get-ChildItem js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE) { throw $_.FullName } }
```

Syntax checks do not cover shader compilation, numerical accuracy or device performance. Recheck wave propagation and measurements in the browser after changing the numerical model.

## Contributors

- [LINYEANSHU](https://github.com/LINYEANSHU)

## License

[MIT](LICENSE) © 2026 LINYEANSHU. The project uses native browser APIs with no third-party runtime libraries. Scenes are based on classic wave-optics teaching experiments.
