import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import CreateTransaction from './CreateTransaction';
import { AuthProvider, useAuth } from '@/context/AuthContext';


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <AuthProvider>
  <RootLayoutNav />
</AuthProvider>
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth(); // Access the auth state
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (!isAuthenticated) {
      router.replace('/Login');
    }
  }, [isAuthenticated, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
      screenOptions={{
        headerShown: false, // Global setting to hide the header
      }}
    >
        
        {/* <Stack.Screen name="login" /> */}

        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
            <Stack.Screen name="CreateTransaction" options={{ headerShown: true}} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </>
        ): (
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }} />
            <Stack.Screen name="Signup" options={{ headerShown: false }} />
          </>
      )}
      </Stack>
    </ThemeProvider>
  );
}
