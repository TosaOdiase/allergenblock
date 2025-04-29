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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BASE_URL } from './config'; // Ensure this file holds your machine's IP
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from './types/navigation';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  id: string;
  name: string;
  allergens: string[];
}

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { restaurant } = route.params as {
    restaurant: { id: string; name: string };
  };

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  // Simulated user allergen profile (replace with real user data in production)
  const userAllergies = ['peanuts', 'gluten', 'dairy'];

  const Card = ({ item, index }: { item: MenuItem; index: number }) => {
    // Calculate actual allergen matches from the item's allergens
    const matchCount = item.allergens.filter(a => userAllergies.includes(a)).length;
    const isExpanded = expandedIndex === index && matchCount > 0;
    const canExpand = matchCount > 0;
    const [pressed, setPressed] = useState(false);

    return (
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={() => {
          if (canExpand) {
            setExpandedIndex(isExpanded ? null : index);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        style={[styles.menuCard, { backgroundColor: pressed ? '#e0e0e6' : '#f2f2f7', minHeight: isExpanded ? 160 : 100 }]}
        disabled={!canExpand}
      >
        <View style={styles.menuCardContent}>
          <View style={styles.menuTextCenterer}>
            <Text style={styles.menuItemName}>{item.name}</Text>
          </View>
          <Text style={[
            styles.menuItemAllergensCount,
            matchCount === 0 ? { color: '#4CAF50' } : {}
          ]}>
            {matchCount === 0 ? 'No allergen matches' : `${matchCount} allergen(s) match your profile`}
          </Text>
          {isExpanded && (
            <View style={styles.allergenListContainer}>
              <View style={styles.allergenRow}>
                <Text style={styles.menuItemAllergensExpanded}>Contains:</Text>
                <Text style={[styles.allergenText, { marginLeft: 4 }]}>
                  {item.allergens.map((allergen, index) => (
                    <Text key={index}>
                      {index > 0 ? ', ' : ''}
                      <Text style={userAllergies.includes(allergen) ? { fontWeight: 'bold', color: '#ff4d4d' } : {}}>
                        {allergen}
                      </Text>
                    </Text>
                  ))}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{restaurant.name} Menu</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menu}
          renderItem={({ item, index }) => <Card item={item} index={index} />}
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
    paddingTop: 70,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
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
    backgroundColor: '#f2f2f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  menuCardContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuTextCenterer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  menuItemName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
  },
  menuItemAllergensCount: {
    fontSize: 14,
    color: '#ff4d4d', // defined red
    marginTop: -20,
    marginBottom: 20,
    textAlign: 'center',
  },
  allergenListContainer: {
    width: '100%',
    marginTop: 0,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menuItemAllergensExpanded: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergenText: {
    color: '#000',
    fontSize: 14,
  },
  profileButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 10,
    backgroundColor: '#f2f2f7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    fontSize: 24,
  },
});
