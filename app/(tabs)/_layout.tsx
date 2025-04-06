import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext"; // 🔥 Importamos el ThemeProvider

function TabLayout() {
	const { theme } = useTheme(); // 🔥 Ahora usa el tema en tiempo real

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[theme ?? "light"].tint, // 🔥 Cambia con el tema en tiempo real
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: { position: "absolute" },
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Inicio",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="house.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="chart.bar.fill" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="control"
				options={{
					title: "Control",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="power" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Configuración",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name="gearshape.fill" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}

// 🔥 Envolver toda la app con ThemeProvider
export default function RootLayout() {
	return (
		<ThemeProvider>
			<TabLayout />
		</ThemeProvider>
	);
}
