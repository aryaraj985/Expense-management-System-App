# Expense Manager

A personal expense tracking app built with Expo, React Native, and TypeScript. It uses Firebase Authentication for accounts and Cloud Firestore for expense and budget data.

## Features

- Sign up and log in with Firebase Authentication
- Add and review expenses by category
- Set and manage monthly budgets
- View expense history and category breakdowns
- Review spending analysis

## Run locally

```sh
npm install
npx expo start
```

Use the Expo Go app to scan the development QR code. If your phone cannot reach the computer over the local network, start Expo with `npx expo start --tunnel`.

## Firebase setup

The client configuration is in `firebase.ts`. Configure it for your own Firebase project before using the app. Enable the sign-in method used by the app and create a Firestore database. Set Firestore Security Rules so each signed-in user can only access their own records; the client configuration is public app configuration and is not a substitute for database rules.

## Main technologies

- Expo SDK 54 and Expo Router
- React Native and TypeScript
- Firebase Authentication and Cloud Firestore
