# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## WebRTC Consultations

The consultation page uses the authenticated Django Channels WebSocket endpoint. Deploy the backend with the ASGI application (`healthcare_backend.asgi:application`); the backend Procfile uses Daphne. A WSGI-only Gunicorn process cannot serve consultation sockets.

Set `REACT_APP_API_URL` to the deployed API base URL and `REACT_APP_WS_URL` to the matching secure WebSocket origin, for example `wss://api.example.com`. The default signaling URL is derived from the browser host and uses `wss` on HTTPS. Production must use HTTPS/WSS and include the frontend origin/host in Django's `ALLOWED_HOSTS` and allowed-origin configuration.

The app uses Google's public STUN server by default. STUN alone cannot connect every NAT/firewall combination. For reliable production calls, provide a Coturn-compatible TURN service and set these backend environment variables:

- `WEBRTC_TURN_URLS`: comma-separated `turn:` or `turns:` URLs.
- `WEBRTC_TURN_SHARED_SECRET`: Coturn REST shared secret. Keep this only on the backend; the API issues short-lived per-user credentials.
- `WEBRTC_TURN_CREDENTIAL_TTL`: credential lifetime in seconds; defaults to `3600`.
- `WEBRTC_STUN_URL`: optional STUN URL; defaults to `stun:stun.l.google.com:19302`.
- `CARELINE_REDIS_URL`: recommended shared Redis URL for Channels groups and participant-presence leases when running multiple backend workers. Without it, the development in-memory channel layer only works within one process.

Automated tests cover REST authorization and two-participant ASGI signaling. Actual camera/microphone quality and cross-network TURN behavior still require two logged-in devices/browsers with media permissions and an externally reachable TURN service; these were not simulated by the automated tests.
