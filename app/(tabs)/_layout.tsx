import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <>
      <Tabs screenOptions={{
        headerStyle: { backgroundColor: "#f5f5f5" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#f5f5f5",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: "#6200ee",
        tabBarInactiveTintColor: "#666666",
        }}>
        <Tabs.Screen name="index" options={{
          title:"Today's habits",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
            name="calendar-today"
            color={color}
            size={size}
            />
          )
        }}/>
        <Tabs.Screen name="streaks" options={{
          title:"Streaks",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
            name="chart-line"
            color={color}
            size={size}
            />
          )
        }}/>
        <Tabs.Screen name="add-habit" options={{
          title:"Add habit",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
            name="plus-circle"
            color={color}
            size={size}
            />
          )
        }}/>
      </Tabs>
    </>
  );
}
