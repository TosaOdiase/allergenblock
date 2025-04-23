import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  TapGestureHandler,
  GestureHandlerRootView,
  TapGestureHandlerEventPayload,
  GestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from './config'; // Ensure this file holds your machine's IP

const { width } = Dimensions.get('window');
const userAllergies = ['peanuts', 'gluten', 'dairy'];

interface MenuItem {
  id: string;
  name: string;
  allergens: string[];
}

export default function MenuScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurant } = route.params as {
    restaurant: { id: string; name: string };
  };

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/menuDetails/${restaurant.id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          const mapped = data.menuItems.map((item: any, index: number) => ({
            id: index.toString(),
            name: item.name,
            allergens: item.allergens || [],
          }));
          setMenu(mapped);
        } catch (parseError) {
          console.error("JSON Parse error:", text.substring(0, 100));
          throw parseError;
        }
      } catch (error) {
        console.error("Failed to fetch menu:", error);
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const Card = ({ item }: { item: MenuItem }) => {
    const flipValue = useSharedValue(0);
    const isFlipped = useSharedValue(false);

    const handleFlip = () => {
      flipValue.value = withSpring(isFlipped.value ? 0 : 1);
      isFlipped.value = !isFlipped.value;
    };

    const tapGesture = useAnimatedGestureHandler<GestureEvent<TapGestureHandlerEventPayload>>({
      onActive: () => {
        'worklet';
        runOnJS(handleFlip)();
      },
    });

    const flipAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotateY: `${interpolate(flipValue.value, [0, 1], [0, 180])}deg` }],
    }));

    const frontStyle = useAnimatedStyle(() => ({
      opacity: interpolate(flipValue.value, [0, 0.5, 1], [1, 0, 0]),
      backfaceVisibility: 'hidden',
    }));

    const backStyle = useAnimatedStyle(() => ({
      opacity: interpolate(flipValue.value, [0, 0.5, 1], [0, 0, 1]),
      transform: [{ rotateY: '180deg' }],
      position: 'absolute',
      backfaceVisibility: 'hidden',
    }));

    const hasAllergens = item.allergens.some(a => userAllergies.includes(a));
    const cardColor = hasAllergens ? 'rgba(255, 0, 0, 0.3)' : 'white';

    return (
      <TapGestureHandler onGestureEvent={tapGesture}>
        <Animated.View style={[styles.menuCard, flipAnimatedStyle, { backgroundColor: cardColor }]}>
          <Animated.View style={[styles.cardFace, frontStyle]}>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemAllergens}>
                {item.allergens.filter(a => userAllergies.includes(a)).length} allergen(s) match your profile
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.cardFace, backStyle]}>
            <Text style={styles.menuItemName}>{item.name}</Text>
            <Text style={styles.menuItemAllergens}>Contains:</Text>
            {item.allergens.map((a, i) => (
              <Text key={i} style={{ fontWeight: userAllergies.includes(a) ? 'bold' : 'normal' }}>{a}</Text>
            ))}
          </Animated.View>
        </Animated.View>
      </TapGestureHandler>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{restaurant.name} Menu</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menu}
          renderItem={({ item }) => <Card item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollView}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
  },
  scrollView: {
    width: '100%',
    padding: 20,
  },
  menuCard: {
    width: width - 40,
    height: 100,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuItemAllergens: {
    fontSize: 14,
    color: 'red',
    marginTop: 4,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 30,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    color: '#007bff',
  },
});
