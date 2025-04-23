import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";

function TabLayout() {
	const { theme } = useTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[theme].tint,
				tabBarInactiveTintColor: Colors[theme].tabIconDefault,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: {
					...Platform.select({
						ios: { position: "absolute" },
						default: {},
					}),
					backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
					borderTopColor: theme === 'dark' ? '#333333' : '#E5E5E5',
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Inicio",
					tabBarIcon: ({ color, size }) => (
						<IconSymbol size={size} name="house.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, size }) => (
						<IconSymbol size={size} name="chart.bar.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="control"
				options={{
					title: "Control",
					tabBarIcon: ({ color, size }) => (
						<IconSymbol size={size} name="power" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Configuración",
					tabBarIcon: ({ color, size }) => (
						<IconSymbol size={size} name="gearshape.fill" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}

export default function RootLayout() {
	return (
		<ThemeProvider>
			<TabLayout />
		</ThemeProvider>
	);
}
