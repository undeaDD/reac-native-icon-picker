import React, { useRef, useState, useEffect } from 'react';
import { Text, View, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, useTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const INJECTED_CSS = `
  // Inject custom CSS styles
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = \`
    .app-page-section-title, .section-grid-title, .hero-gradient, .i8-dropdown, 
    .app-icons-menu, .sstk, .grid-icons__addon , .app-accordion2, .app-bottom-info,
    .grid-icons__cross-search, .app-support, .i8-search-switch, .i8-text-input__right-icon,
    .mobile-filters-header { 
      display: none !important; 
    }
    .new-icons-page {
      padding: 0 10px 0 10px !important;
    }
  \`;
  document.head.appendChild(style);

  // Disable zoom
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  document.head.appendChild(meta);

  // Listen for clicks on grid icons
  document.addEventListener('click', function(event) {
    const target = event.target.closest('.app-grid-icon');
    if (target) {
      const img = target.querySelector('img');
      if (img && img.srcset) {
        const firstSrc = img.srcset.split(',')[0].trim().split(' ')[0];
        window.ReactNativeWebView.postMessage(firstSrc);
      }
    }
  }, true);
  true;
`;

const clickFilterButton = `
  // Programmatically toggle the filter button
  (function() {
    const filterBtn = document.querySelector('button.filter-button');
    if (filterBtn) {
      filterBtn.click();
    } else {
      console.warn("Filter button not found");
    }
  })();
  true;
`;

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [selectedIconUrl, setSelectedIconUrl] = useState(route.params?.selectedIconUrl || null);

  useEffect(() => {
    if (route.params?.newSelectedIconUrl) {
      setSelectedIconUrl(route.params.newSelectedIconUrl);
      navigation.setParams({ newSelectedIconUrl: undefined });
    }
  }, [route.params?.newSelectedIconUrl]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={{uri: selectedIconUrl}}
        style={[styles.iconImage, { tintColor: colors.primary }]}
      />
      <TouchableOpacity
        style={[styles.pickButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          navigation.navigate('SymbolPicker', {
            onSelect: (iconUrl) => {
              setSelectedIconUrl(iconUrl);
            },
          });
        }}
      >
        <Text style={styles.pickButtonText}>Pick Symbol</Text>
      </TouchableOpacity>
    </View>
  );
}

function SymbolPickerScreen({ navigation, route }) {
  const webviewRef = useRef(null);

  const handleSelect = (iconUrl) => {
    if (route.params?.onSelect) {
      const selectedIconUrl = iconUrl.replace("size=24", "size=200");
      console.log("Selected Icon URL:", selectedIconUrl);
      route.params.onSelect(selectedIconUrl);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  useFocusEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            webviewRef.current?.injectJavaScript(clickFilterButton);
          }}
          style={{ marginLeft: 10, padding: 6, backgroundColor: '#eee', borderRadius: 20 }}
        >
          <Ionicons name="filter" size={20} color="#333" />
        </TouchableOpacity>
      ),
    });
  });

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: 'https://icons8.com/icons/new' }}
      onLoadEnd={() => {
        webviewRef.current?.injectJavaScript(`(function() { ${INJECTED_CSS} })(); true;`);
      }}
      onMessage={(event) => {
        const selectedIconUrl = event.nativeEvent.data;
        handleSelect(selectedIconUrl);
      }}
      onShouldStartLoadWithRequest={(event) => {
        return !!(event.url.startsWith('http'));
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
    />
  );
}

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="SymbolPicker"
          component={SymbolPickerScreen}
          options={({ navigation }) => ({
            title: 'Pick a Symbol',
            presentation: 'modal',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  backgroundColor: '#eee',
                  borderRadius: 20,
                  padding: 6,
                  marginRight: 10
                }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  pickButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 2,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});