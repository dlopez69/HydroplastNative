import { View, Text, StyleSheet, Switch } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function SettingsScreen() {
	const { theme, toggleTheme } = useTheme(); // 🔥 Ahora usa el contexto global
	const backgroundColor = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "text");

	return (
		<View style={[styles.container, { backgroundColor }]}>
			<Text style={[styles.title, { color: textColor }]}>⚙️ Configuración</Text>

			<View style={styles.settingItem}>
				<Text style={[styles.text, { color: textColor }]}>Modo Oscuro</Text>
				<Switch value={theme === "dark"} onValueChange={toggleTheme} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		paddingTop: 60,
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	text: {
		fontSize: 16,
	},
	settingItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		width: "80%",
		marginTop: 20,
	},
});
