// AppNavigator.tsx
// navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/homeScreen';
import HomeTabs from './HomeTabs';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeTabs} />
      {/* add more tabs here */}
    </Tab.Navigator>
  );
}

export default AppNavigator;