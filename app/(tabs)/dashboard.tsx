import { View, Text, StyleSheet, RefreshControl, ScrollView, Dimensions } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width } = Dimensions.get("window");
const cardWidth = width > 600 ? "30%" : "46%"; // Adapta para tablets/phones

export default function DashboardScreen() {
    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const accentColor = useThemeColor({}, "tint");
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");
    const cardBackground = theme === "dark" ? "#1F1F1F" : "#F7F9FC";
    const cardBorderColor = theme === "dark" ? "#2D2D2D" : "#E0E5EC";

    // Colores para métricas específicas (adaptados a tema claro/oscuro)
    const tempColor = theme === "dark" ? "#FF7043" : "#F44336";  // Rojo/Naranja
    const lightColor = theme === "dark" ? "#FFCA28" : "#FFC107"; // Amarillo
    const waterColor = theme === "dark" ? "#29B6F6" : "#2196F3";  // Azul
    const ledBlueColor = "#2979FF";
    const ledRedColor = "#F44336";
    const pumpColor = theme === "dark" ? "#66BB6A" : "#4CAF50";  // Verde

    const [systemState, setSystemState] = useState({
        timestamp: "",
        temperatura: 0,
        iluminancia: 0,
        nivelAgua: 0,
        ledRojo: 0,
        ledAzul: 0,
        bombaAgua: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLatestData = useCallback(async () => {
        setError(null);

        try {
            const response = await fetch("https://servidorhydroplas.onrender.com/api/last-reading");

            if (!response.ok) {
                let errorBody = "Error desconocido";
                try {
                    errorBody = await response.text();
                } catch (parseError) {
                    console.error("Could not parse error response:", parseError);
                }
                throw new Error(`HTTP error ${response.status}: ${response.statusText}. Body: ${errorBody}`);
            }

            const data = await response.json();

            setSystemState({
                timestamp: data.timestamp,
                temperatura: data.temperatura,
                iluminancia: data.iluminancia,
                nivelAgua: data.nivel_agua,
                ledRojo: data.led_rojo,
                ledAzul: data.led_azul,
                bombaAgua: data.bomba_agua
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

    // Formatear estados de componentes para visualización con icons
    const formatComponentState = (state, type) => {
        let stateText = "";
        let stateIcon = "";
        
        if (typeof state === 'number') {
            if (state === 0) {
                stateText = "Apagado";
                stateIcon = "❌";
            } else if (state === 1) {
                stateText = "Encendido";
                stateIcon = type === "bomba" ? "💧" : "✅";
            } else if (state > 0) {
                stateText = `${state}%`;
                stateIcon = "✅";
            }
        }
        
        return { text: stateText, icon: stateIcon };
    };

    // Determinar el estado colorizado para indicadores de nivel
    const getStatusColor = (value, thresholds) => {
        if (value <= thresholds.low) return "#F44336"; // Rojo - crítico
        if (value <= thresholds.medium) return "#FFC107"; // Amarillo - cuidado
        return "#4CAF50"; // Verde - óptimo
    };

    // Formatear fecha en formato amigable
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        const date = new Date(timestamp);
        const now = new Date();
        
        // Si es hoy, mostrar solo la hora
        if (date.toDateString() === now.toDateString()) {
            return `Hoy ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }
        
        // Si es ayer, mostrar "Ayer" y la hora
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Ayer ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }
        
        // Otro caso, mostrar fecha y hora completas
        return date.toLocaleString();
    };

    // Calcular estado del agua para visualización
    const waterLevelStatus = {
        color: getStatusColor(systemState.nivelAgua, { low: 20, medium: 50 }),
        icon: systemState.nivelAgua < 20 ? "⚠️" : "💧",
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
                        📊 Monitor en Tiempo Real.
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
                                {/* Tarjeta de temperatura */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: tempColor }]}>🌡️</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            Temperatura
                                        </Text>
                                        <Text style={[styles.cardValue, { color: tempColor }]}>
                                            {systemState.temperatura != null 
                                                ? `${systemState.temperatura.toFixed(1)}°C` 
                                                : 'N/A'
                                            }
                                        </Text>
                                        <Text style={[styles.cardStatus, { color: secondaryTextColor }]}>
                                            {systemState.temperatura > 30 
                                                ? "⚠️ Alta" 
                                                : systemState.temperatura < 15 
                                                    ? "❄️ Baja" 
                                                    : "✓ Normal"
                                            }
                                        </Text>
                                    </View>
                                </View>

                                {/* Tarjeta de iluminancia */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: lightColor }]}>☀️</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            Iluminancia
                                        </Text>
                                        <Text style={[styles.cardValue, { color: lightColor }]}>
                                            {systemState.iluminancia != null 
                                                ? `${systemState.iluminancia.toFixed(0)} lx` 
                                                : 'N/A'
                                            }
                                        </Text>
                                        <Text style={[styles.cardStatus, { color: secondaryTextColor }]}>
                                            {systemState.iluminancia > 1000 
                                                ? "☀️ Brillante" 
                                                : systemState.iluminancia > 500 
                                                    ? "🌤️ Adecuada" 
                                                    : "🌥️ Baja"
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.metricsSection}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                💧 Sistema Hidráulico
                            </Text>
                            <View style={styles.grid}>
                                {/* Tarjeta de nivel de agua */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: waterColor }]}>
                                            {waterLevelStatus.icon}
                                        </Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            Nivel de Agua
                                        </Text>
                                        <Text style={[styles.cardValue, { color: waterLevelStatus.color }]}>
                                            {systemState.nivelAgua != null 
                                                ? `${systemState.nivelAgua.toFixed(1)}%` 
                                                : 'N/A'
                                            }
                                        </Text>
                                        <View style={styles.progressBarContainer}>
                                            <View 
                                                style={[
                                                    styles.progressBar, 
                                                    { 
                                                        width: `${Math.min(100, Math.max(0, systemState.nivelAgua))}%`,
                                                        backgroundColor: waterLevelStatus.color 
                                                    }
                                                ]} 
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Tarjeta de bomba de agua */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: pumpColor }]}>🚰</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            Bomba de Agua
                                        </Text>
                                        <Text style={[styles.cardValue, { color: systemState.bombaAgua ? pumpColor : secondaryTextColor }]}>
                                            {systemState.bombaAgua != null 
                                                ? formatComponentState(systemState.bombaAgua, "bomba").text
                                                : 'N/A'
                                            }
                                        </Text>
                                        <View style={[
                                            styles.statusIndicator, 
                                            { backgroundColor: systemState.bombaAgua ? pumpColor : '#DDD' }
                                        ]}>
                                            <Text style={styles.statusIndicatorText}>
                                                {systemState.bombaAgua ? "ACTIVA" : "INACTIVA"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.metricsSection}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                💡 Sistema de Iluminación
                            </Text>
                            <View style={styles.grid}>
                                {/* Tarjeta de LED azul */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: ledBlueColor }]}>🔵</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            LED Azul
                                        </Text>
                                        <Text style={[
                                            styles.cardValue, 
                                            { color: systemState.ledAzul ? ledBlueColor : secondaryTextColor }
                                        ]}>
                                            {systemState.ledAzul != null 
                                                ? formatComponentState(systemState.ledAzul).text
                                                : 'N/A'
                                            }
                                        </Text>
                                        <View style={[
                                            styles.statusIndicator, 
                                            { backgroundColor: systemState.ledAzul ? ledBlueColor : '#DDD' }
                                        ]}>
                                            <Text style={styles.statusIndicatorText}>
                                                {systemState.ledAzul ? "ENCENDIDO" : "APAGADO"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Tarjeta de LED rojo */}
                                <View style={[
                                    styles.card, 
                                    { 
                                        backgroundColor: cardBackground,
                                        borderColor: cardBorderColor 
                                    }
                                ]}>
                                    <View style={[styles.cardHeader, { backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8" }]}>
                                        <Text style={[styles.cardIcon, { color: ledRedColor }]}>🔴</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
                                            LED Rojo
                                        </Text>
                                        <Text style={[
                                            styles.cardValue, 
                                            { color: systemState.ledRojo ? ledRedColor : secondaryTextColor }
                                        ]}>
                                            {systemState.ledRojo != null 
                                                ? formatComponentState(systemState.ledRojo).text
                                                : 'N/A'
                                            }
                                        </Text>
                                        <View style={[
                                            styles.statusIndicator, 
                                            { backgroundColor: systemState.ledRojo ? ledRedColor : '#DDD' }
                                        ]}>
                                            <Text style={styles.statusIndicatorText}>
                                                {systemState.ledRojo ? "ENCENDIDO" : "APAGADO"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
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
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    statusText: {
        fontSize: 16,
        marginVertical: 20,
        textAlign: 'center',
    },
    errorContainer: {
        marginVertical: 20,
        padding: 20,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
        width: '90%',
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F44336',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#D32F2F',
        textAlign: 'center',
        marginBottom: 12,
    },
    errorHelp: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    timestampLabel: {
        fontSize: 14,
        marginRight: 6,
    },
    timestampValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    metricsSection: {
        width: '100%',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        paddingLeft: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    card: {
        width: cardWidth,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        padding: 14,
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 28,
    },
    cardTitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    cardStatus: {
        fontSize: 12,
        textAlign: 'center',
    },
    progressBarContainer: {
        height: 8,
        width: '100%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
    statusIndicator: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'center',
        marginTop: 8,
    },
    statusIndicatorText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    refreshHint: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 20,
    }
});