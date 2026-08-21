import { Analytics } from "@vercel/analytics/react";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {Platform.OS === "web" ? <Analytics /> : null}
    </>
  );
}
