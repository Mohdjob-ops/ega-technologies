# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project using `expo-router`.
The app source is located in `src/app`, and the Expo Router entry files are handled by `app.json`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing `src/app/index.tsx` and the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction) and the router root is configured in `app.json`.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Production web deployment

This project exports a single-page web application to `dist` and includes Vercel routing rules so Expo Router pages continue to work after a browser refresh.

Before deployment, run:

```bash
npm install
npm run check:deploy
```

For Vercel, import the repository and keep the committed settings:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

After deployment, add the production domain and password-reset callback URL to the Supabase Auth URL allowlist. Then verify registration, learner lookup, administrator access, payment review, EmailJS delivery, Chapa initialization/verification, and refreshed deep links such as `/admin-dashboard`.

The Supabase publishable key and EmailJS public key used by the browser are not server secrets. Chapa and Supabase service-role credentials must remain only in Supabase Edge Function secrets and must never be added to this repository or Vercel client environment variables.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
