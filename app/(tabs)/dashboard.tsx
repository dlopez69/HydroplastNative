import { View, Text, StyleSheet, RefreshControl, ScrollView, Dimensions } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import MetricCard from "@/components/MetricCard";

const { width } = Dimensions.get("window");
const cardWidth = width > 600 ? "30%" : "46%";

export default function DashboardScreen() {
	const { theme } = useTheme();
	const backgroundColor = useThemeColor({}, "background");
	const textColor = useThemeColor({}, "text");
	const accentColor = useThemeColor({}, "tint");
	const secondaryTextColor = useThemeColor({}, "tabIconDefault");

	// Colores para métricas específicas (adaptados a tema claro/oscuro)
	const tempColor = theme === "dark" ? "#FF7043" : "#F44336";
	const lightColor = theme === "dark" ? "#FFCA28" : "#FFC107";
	const waterColor = theme === "dark" ? "#29B6F6" : "#2196F3";
	const ledBlueColor = "#2979FF";
	const ledRedColor = "#F44336";
	const pumpColor = theme === "dark" ? "#66BB6A" : "#4CAF50";

	const [systemState, setSystemState] = useState({
		timestamp: "",
		temperatura: 0,
		iluminancia: 0,
		nivelAgua: 0,
		ledRojo: 0,
		ledAzul: 0,
		bombaAgua: 0,
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	const fetchLatestData = useCallback(async () => {
		setError(null);

		try {
			const response = await fetch(
				"https://servidorhydroplas.onrender.com/api/last-reading"
			);

			if (!response.ok) {
				let errorBody = "Error desconocido";
				try {
					errorBody = await response.text();
				} catch (parseError) {
					console.error("Could not parse error response:", parseError);
				}
				throw new Error(
					`HTTP error ${response.status}: ${response.statusText}. Body: ${errorBody}`
				);
			}

			const data = await response.json();

			setSystemState({
				timestamp: data.timestamp,
				temperatura: data.temperatura,
				iluminancia: data.iluminancia,
				nivelAgua: data.nivel_agua,
				ledRojo: data.led_rojo,
				ledAzul: data.led_azul,
				bombaAgua: data.bomba_agua,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(errorMessage);
			console.error("Error fetching data:", errorMessage);
		} finally {
			if (!refreshing) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		setLoading(true);
		fetchLatestData();

		const intervalId = setInterval(fetchLatestData, 5000);

		return () => {
			clearInterval(intervalId);
		};
	}, [fetchLatestData]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchLatestData();
		setRefreshing(false);
	}, [fetchLatestData]);

	const formatTimestamp = (timestamp: string): string => {
		if (!timestamp) return "N/A";

		const date = new Date(timestamp);
		const now = new Date();

		if (date.toDateString() === now.toDateString()) {
			return `Hoy ${date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			})}`;
		}

		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) {
			return `Ayer ${date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			})}`;
		}

		return date.toLocaleString();
	};

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor }}
			contentContainerStyle={{ flexGrow: 1 }}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor={accentColor}
					colors={[accentColor]}
				/>
			}
		>
			<View style={[styles.container, { backgroundColor }]}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: textColor }]}>
						 📊 Monitor en Tiempo Real
					</Text>
					<Text style={[styles.subtitle, { color: secondaryTextColor }]}>
						Sistema Hidropónico
					</Text>
				</View>

				{loading && !error && (
					<View style={styles.loadingContainer}>
						<Text style={[styles.statusText, { color: textColor }]}>
							Cargando datos del sistema...
						</Text>
					</View>
				)}

				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorTitle}>Error de conexión</Text>
						<Text style={styles.errorText}>
							No se pudieron cargar los datos: {error}
						</Text>
						<Text style={styles.errorHelp}>
							↓ Desliza hacia abajo para intentar nuevamente ↓
						</Text>
					</View>
				)}

				{!loading && !error && (
					<>
						<View style={styles.timestampContainer}>
							<Text style={[styles.timestampLabel, { color: secondaryTextColor }]}>
								Última actualización:
							</Text>
							<Text style={[styles.timestampValue, { color: textColor }]}>
								{formatTimestamp(systemState.timestamp)}
							</Text>
						</View>

						<View style={styles.metricsSection}>
							<Text style={[styles.sectionTitle, { color: textColor }]}>
								 🌡️ Condiciones Ambientales
							</Text>
							<View style={styles.grid}>
								<MetricCard
									icon="🌡️"
									title="Temperatura"
									value={systemState.temperatura}
									unit="°C"
									color={tempColor}
									status={
										systemState.temperatura > 30
											? "⚠️ Alta"
											: systemState.temperatura < 15
											? "❄️ Baja"
											: "✓ Normal"
									}
								/>

								<MetricCard
									icon="☀️"
									title="Iluminancia"
									value={systemState.iluminancia}
									unit=" lx"
									color={lightColor}
									status={
										systemState.iluminancia > 1000
											? "☀️ Brillante"
											: systemState.iluminancia > 500
											? "🌤️ Adecuada"
											: "🌥️ Baja"
									}
								/>
							</View>
						</View>

						<View style={styles.metricsSection}>
							<Text style={[styles.sectionTitle, { color: textColor }]}>
								💧 Sistema Hidráulico
							</Text>
							<View style={styles.grid}>
								<MetricCard
									icon="💧"
									title="Nivel de Agua"
									value={systemState.nivelAgua}
									unit="%"
									color={waterColor}
									showProgressBar={true}
									progressValue={systemState.nivelAgua}
								/>

								<MetricCard
									icon="🚰"
									title="Bomba de Agua"
									value={`${Math.floor((systemState.bombaAgua / 4095) * 100)}%`}
									color={pumpColor}
									isToggleableComponent={true}
									isActive={systemState.bombaAgua > 0}
									statusText={systemState.bombaAgua > 0 ? "ACTIVA" : "INACTIVA"}
								/>
							</View>
						</View>

						<View style={styles.metricsSection}>
							<Text style={[styles.sectionTitle, { color: textColor }]}>
								💡 Sistema de Iluminación
							</Text>
							<View style={styles.grid}>
								<MetricCard
									icon="🔵"
									title="LED Azul"
									value={`${Math.floor((systemState.ledAzul / 4095) * 100)}%`}
									color={ledBlueColor}
									isToggleableComponent={true}
									isActive={systemState.ledAzul > 0}
								/>

								<MetricCard
									icon="🔴"
									title="LED Rojo"
									value={`${Math.floor((systemState.ledRojo / 4095) * 100)}%`}
									color={ledRedColor}
									isToggleableComponent={true}
									isActive={systemState.ledRojo > 0}
								/>
							</View>
						</View>

						<Text style={[styles.refreshHint, { color: secondaryTextColor }]}>
							↓ Desliza hacia abajo para actualizar ↓
						</Text>
					</>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 60,
		padding: 16,
		alignItems: "center",
	},
	header: {
		width: "100%",
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 26,
		fontWeight: "bold",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginTop: 4,
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	statusText: {
		fontSize: 16,
		marginVertical: 20,
		textAlign: "center",
	},
	errorContainer: {
		marginVertical: 20,
		padding: 20,
		backgroundColor: "rgba(244, 67, 54, 0.1)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#F44336",
		width: "90%",
		alignItems: "center",
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#F44336",
		marginBottom: 8,
	},
	errorText: {
		fontSize: 14,
		color: "#D32F2F",
		textAlign: "center",
		marginBottom: 12,
	},
	errorHelp: {
		fontSize: 14,
		color: "#757575",
		textAlign: "center",
	},
	timestampContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
		flexWrap: "wrap",
		justifyContent: "center",
	},
	timestampLabel: {
		fontSize: 14,
		marginRight: 6,
	},
	timestampValue: {
		fontSize: 14,
		fontWeight: "600",
	},
	metricsSection: {
		width: "100%",
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 12,
		paddingLeft: 4,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		width: "100%",
	},
	refreshHint: {
		textAlign: "center",
		fontSize: 12,
		marginTop: 10,
		marginBottom: 20,
	},
});
