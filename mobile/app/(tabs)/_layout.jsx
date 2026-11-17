import { Tabs } from 'expo-router'
import { Beaker, Home, User } from 'lucide-react-native'
import { colors } from '../../constants/theme'

export default function TabsLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.blue,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.white },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={18} color={color} /> }} />
    <Tabs.Screen name="experiments" options={{ title: 'Experiments', tabBarIcon: ({ color }) => <Beaker size={18} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={18} color={color} /> }} />
  </Tabs>
}
