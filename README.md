# StudyPair

StudyPair is a private, browser-based study partner matcher. Create a profile, exchange a compact share code with a classmate, and compare subject, level, preferred session style, and schedule overlap. The match score is transparent and deterministic.

## Try it

Visit the GitHub Pages site linked in this repository's About section. For local development, serve this folder over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000`. The app uses JavaScript modules, so opening `index.html` directly with `file://` is not supported. Save a profile, load the clearly labeled example profiles to see how matching works, then exchange real share codes with friends.

## Features

- 21 selectable weekly time blocks, a live overlap map, and an explainable 100-point compatibility score.
- Share code export and import, including Unicode names.
- Profiles stored only in your browser's local storage.
- Responsive layout, semantic controls, and visible keyboard focus.
- No account, analytics, server, or third-party API.

## Privacy and limitations

Profiles never leave the browser automatically. A share code contains your nickname, subject, level, goal, preferred session style, and selected time blocks. Anyone with the code can read that information, so share it intentionally. This version cannot search for strangers or synchronize devices; both people must exchange codes through a channel of their choice. Availability is compared in local time, so it works best for people in the same time zone.

## Development

The application is plain HTML, CSS, and JavaScript. No install step or build service is needed. To run the unit tests, use Node.js 20 or newer:

```sh
npm test
```

## Deployment

Publish the repository root from the `main` branch with GitHub Pages. No secrets or configuration variables are needed.

## License

MIT — see [LICENSE](LICENSE).
