// ✅ HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BASE_URL } from './config';
import {
  TapGestureHandler,
  TapGestureHandlerEventPayload,
  GestureEvent,
} from 'react-native-gesture-handler';

interface Restaurant {
  id: string;
  name: string;
}

type RootStackParamList = {
  Home: undefined;
  Menu: { restaurant: { id: string; name: string } };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/restaurants`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setRestaurants(data);
        } catch (parseError) {
          console.error("JSON Parse error:", text.substring(0, 100));
          throw parseError;
        }
      } catch (error) {
        console.error("Error loading restaurants:", error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handlePress = (restaurant: Restaurant) => {
    navigation.navigate('Menu', {
      restaurant: { id: restaurant.id, name: restaurant.name },
    });
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search restaurants"
          style={styles.searchBar}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <Text style={{ alignSelf: 'center', marginTop: 30 }}>Loading...</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {restaurants.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handlePress(item)}
            >
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => console.log('Camera feature coming soon')}
          style={styles.cameraButton}
        >
          <Text style={styles.cameraText}>📷</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  cameraButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 30,
  },
  cameraText: {
    fontSize: 24,
  },
});

export default HomeScreen;