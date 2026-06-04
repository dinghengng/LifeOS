import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "../theme/palettes";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <Stack
      screenOptions={{
        // Hide the default headers
        headerShown: false,
        // Set the base background color using custom palette system
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      {/* Your main dashboard screen */}
      <Stack.Screen name="index" />
      
      {/* The error fallback screen */}
      <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
    </Stack>
  );
}