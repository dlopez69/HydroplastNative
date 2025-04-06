import { Image, StyleSheet, View, Button, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import useWebSocket from "@/hooks/useWebSocket";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/ThemeContext";

export default function ControlScreen() {
	const {
		status,
		messages,
		connectWebSocket,
		disconnectWebSocket,
		sendMessage,
	} = useWebSocket();

	// Aplicar colores según el tema
	const backgroundColor = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "text");
	const buttonColor = useThemeColor({}, "primary");
	const [forceUpdate, setForceUpdate] = useState(false);
	const { theme } = useTheme();

	useEffect(() => {
		setForceUpdate((prev) => !prev); // 🔥 Fuerza re-render cuando cambia el tema
	}, [theme]);

	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
			headerImage={
				<Image
					source={require("@/assets/images/partial-react-logo.png")}
					style={styles.reactLogo}
				/>
			}
		>
			<View style={[styles.container, { backgroundColor }]}>
				<ThemedView style={styles.titleContainer}>
					<ThemedText type="title" style={{ color: textColor }}>
						Control ESP32
					</ThemedText>
				</ThemedView>

				<ThemedView style={styles.stepContainer}>
					<ThemedText type="subtitle" style={{ color: textColor }}>
						Estado del WebSocket:
					</ThemedText>
					<ThemedText style={{ color: textColor }}>{status}</ThemedText>

					<View style={styles.connectionButtonContainer}>
						<Button
							title="Conectar"
							onPress={connectWebSocket}
							disabled={status === "Conectado"}
							color={buttonColor}
						/>
						<Button
							title="Desconectar"
							onPress={disconnectWebSocket}
							disabled={status !== "Conectado"}
							color="#F44336"
						/>
					</View>
				</ThemedView>

				<ThemedView style={styles.stepContainer}>
					<ThemedText type="subtitle" style={{ color: textColor }}>
						Acciones
					</ThemedText>
					<View style={styles.buttonContainer}>
						<Button
							title="Encender LED"
							onPress={() => sendMessage("ENCENDER_LED")}
							disabled={status !== "Conectado"}
						/>
						<Button
							title="Apagar LED"
							onPress={() => sendMessage("APAGAR_LED")}
							disabled={status !== "Conectado"}
						/>
					</View>
				</ThemedView>

				<ThemedView style={styles.stepContainer}>
					<ThemedText type="subtitle" style={{ color: textColor }}>
						Mensajes Recibidos
					</ThemedText>
					<ScrollView
						style={[styles.messagesContainer, { borderColor: textColor }]}
					>
						{messages.map((msg, index) => (
							<ThemedText key={index} style={{ color: textColor }}>
								{msg}
							</ThemedText>
						))}
					</ScrollView>
				</ThemedView>
			</View>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stepContainer: {
		gap: 8,
		marginBottom: 16,
	},
	reactLogo: {
		height: 178,
		width: 290,
		bottom: 0,
		left: 0,
		position: "absolute",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 10,
	},
	connectionButtonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
		gap: 10,
	},
	messagesContainer: {
		borderWidth: 1,
		padding: 10,
		maxHeight: 200,
	},
});
