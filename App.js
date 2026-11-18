import React, { useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, Appbar, BottomNavigation } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SystemUI from 'expo-system-ui';

import ReaderView from './views/reader';
import SettingsView from './views/settings';
import LibraryView from './views/library';
import GameDetailsView from './views/gameDetails';
import { SettingsContext, SettingsProvider } from './contexts/SettingsContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { getTheme } from './lib/themeUtils';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <LibraryProvider>
          <StatusBar style="auto" />
          <MainApp />
        </LibraryProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

function MainApp() {
  const { colorScheme, showDlcsTab } = useContext(SettingsContext);
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(theme.colors.background).catch((error) => {
        console.warn('Unable to update system background color:', error);
      });
    }
  }, [theme.colors.background]);

  const HomeView = () => {
    const navigation = useNavigation();
    const [index, setIndex] = useState(0);
    const routes = [
      { key: 'games', title: 'Games', focusedIcon: 'gamepad-variant' },
      ...(showDlcsTab ? [{ key: 'dlcs', title: "DLC's", focusedIcon: 'puzzle' }] : []),
      { key: 'library', title: 'Library', focusedIcon: 'bookshelf' },
    ];

    useEffect(() => {
      if (index >= routes.length) setIndex(0);
    }, [index, routes.length]);

    const openDetails = (item, platform, type) => {
      navigation.navigate('GameDetails', { item, platform, type });
    };

    const renderScene = ({ route }) => {
      if (route.key === 'games') {
        return <ReaderView type="GAMES" onSelectItem={openDetails} />;
      }
      if (route.key === 'dlcs') {
        return <ReaderView type="DLCS" onSelectItem={openDetails} />;
      }
      return <LibraryView onSelectItem={openDetails} />;
    };

    return (
      <>
        <Appbar.Header>
          <Appbar.Content title="NoPayStation" />
          <Appbar.Action
            icon="cog"
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          />
        </Appbar.Header>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
        />
      </>
    );
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeView}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GameDetails"
            component={GameDetailsView}
            options={{ title: 'Game details' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsView}
            options={{
              header: ({ navigation }) => (
                <Appbar.Header>
                  <Appbar.BackAction onPress={() => navigation.goBack()} />
                  <Appbar.Content title="Settings" />
                </Appbar.Header>
              ),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
