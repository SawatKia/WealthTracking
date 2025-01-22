  import React from 'react';
  import FontAwesome from '@expo/vector-icons/FontAwesome';
  import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
  import { Link, Tabs } from 'expo-router';
  import { Pressable } from 'react-native';

  import Colors from '@/constants/Colors';
  import { useColorScheme } from '@/components/useColorScheme';
  import { useClientOnlyValue } from '@/components/useClientOnlyValue';

  // You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
  function TabBarIcon(props: {
    name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
  }) {
    return <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />;
  }
  

  export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: useClientOnlyValue(false, true),
        }}>

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />

        <Tabs.Screen
          name="IncomeExpense"
          options={{
            title: 'IncomeExpense',
            tabBarIcon: ({ color }) => <TabBarIcon name="swap-horizontal" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => <TabBarIcon name="bank" color={color} />,
          }}
        />

        <Tabs.Screen
          name="Debt"
          options={{
            title: 'Debt',
            tabBarIcon: ({ color }) => <TabBarIcon name="briefcase-variant" color={color} />, //currency-usd
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="account-outline" color={color} />,
          }}
        />



      </Tabs>

      
    );
  }
