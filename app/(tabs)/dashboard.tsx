import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function DashboardScreen() {
	const { theme } = useTheme();
	const backgroundColor = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "text");

	// 🔥 Usa un número en lugar de un booleano para `forceUpdate`
	const [forceUpdate, setForceUpdate] = useState(0);

	// 🔥 Forzar re-render cuando el tema cambie
	useEffect(() => {
		setForceUpdate((prev) => prev + 1);
	}, [theme]);

	return (
		<View style={[styles.container, { backgroundColor }]} key={forceUpdate}>
			<Text style={[styles.title, { color: textColor }]}>📊 Dashboard</Text>
			<Text style={{ color: textColor }}>Aquí verás datos en tiempo real.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
		padding: 20,
		justifyContent: "flex-start",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
        
	},
});
