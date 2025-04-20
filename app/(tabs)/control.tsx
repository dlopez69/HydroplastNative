import { View, Text, StyleSheet, ScrollView, Dimensions, Button, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTheme } from "@/hooks/ThemeContext";
import useWebSocket from "@/hooks/useWebSocket";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";

const { width } = Dimensions.get("window");
const cardWidth = width > 600 ? "30%" : "46%"; // Adapta para tablets/phones
const MAX_VALUE = 4095;

export default function ControlScreen() {
    const {
        status,
        messages,
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        systemState,
    } = useWebSocket();

    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const accentColor = useThemeColor({}, "tint");
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");
    const cardBackground = theme === "dark" ? "#1F1F1F" : "#F7F9FC";
    const cardBorderColor = theme === "dark" ? "#2D2D2D" : "#E0E5EC";
    
    // Colores para controles específicos (adaptados a tema claro/oscuro)
    const ledBlueColor = "#2979FF";
    const ledRedColor = "#F44336";
    const pumpColor = theme === "dark" ? "#66BB6A" : "#4CAF50";  // Verde
    const connectedColor = "#4CAF50"; // Color verde para estado conectado
    const disconnectedColor = "#F44336"; // Color rojo para desconectado
    
    // Definir colores específicos para los botones de conexión
    const connectButtonColor = theme === "dark" ? "#2979FF" : "#2979FF"; // Azul para ambos temas
    const disconnectButtonColor = "#F44336"; // Rojo para ambos temas

    // Estados para cada slider
    const [sliderValue1, setSliderValue1] = useState(0);
    const [sliderValue2, setSliderValue2] = useState(0);
    const [sliderValue3, setSliderValue3] = useState(0);
    const [forceUpdate, setForceUpdate] = useState(false);

    // Actualizar los sliders cuando cambie systemState
    useEffect(() => {
        setSliderValue1(systemState.ledAzul);
        setSliderValue2(systemState.ledRojo);
        setSliderValue3(systemState.bombaAgua);
    }, [systemState]);

    useEffect(() => {
        setForceUpdate((prev) => !prev); // Fuerza re-render cuando cambia el tema
    }, [theme]);

    // Verificar si está conectado al WebSocket (comparación explícita)
    const isConnected = status === "Conectado";
    
    // Función para obtener estado como texto
    const getStateText = (value) => {
        if (value === 0) return "Apagado";
        if (value === MAX_VALUE) return "Encendido";
        return `${Math.floor((value / MAX_VALUE) * 100)}%`;
    };

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
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textColor }]}>
                        🎮 Panel de Control
                    </Text>
                    <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                        Sistema Hidropónico
                    </Text>
                </View>

                <View style={styles.metricsSection}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                        🔌 Conexión al Sistema
                    </Text>
                    <View style={[
                        styles.statusCard, 
                        { 
                            backgroundColor: cardBackground,
                            borderColor: cardBorderColor 
                        }
                    ]}>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: secondaryTextColor }]}>
                                Estado:
                            </Text>
                            <View style={[
                                styles.statusIndicator, 
                                { backgroundColor: isConnected ? connectedColor : disconnectedColor }
                            ]}>
                                <Text style={styles.statusIndicatorText}>
                                    {status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.connectionButtonContainer}>
                            <Button
                                title="Conectar"
                                onPress={connectWebSocket}
                                disabled={isConnected}
                                color={connectButtonColor}
                            />
                            <Button
                                title="Desconectar"
                                onPress={disconnectWebSocket}
                                disabled={!isConnected}
                                color={disconnectButtonColor}
                            />
                        </View>
                        {/* Indicador de depuración - Solo para desarrollo */}
                        <Text style={{color: secondaryTextColor, marginTop: 8, fontSize: 12}}>
                            Estado de conexión: {isConnected ? "Conectado (true)" : "Desconectado (false)"}
                        </Text>
                    </View>
                </View>

                {/* El resto del código permanece igual */}
                
                {isConnected && (
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
                                        { color: sliderValue1 > 0 ? ledBlueColor : secondaryTextColor }
                                    ]}>
                                        {getStateText(sliderValue1)}
                                    </Text>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={MAX_VALUE}
                                        value={sliderValue1}
                                        onValueChange={value => {
                                            const val = Math.floor(value);
                                            setSliderValue1(val);
                                            sendMessage(`LedAzul ${val}`);
                                        }}
                                        minimumTrackTintColor={ledBlueColor}
                                        maximumTrackTintColor="#d3d3d3"
                                        thumbTintColor={ledBlueColor}
                                    />
                                    <View style={styles.buttonRow}>
                                        <Button
                                            title="OFF" 
                                            onPress={() => {
                                                setSliderValue1(0);
                                                sendMessage("LedAzul 0");
                                            }}
                                            color="#757575"
                                        />
                                        <Button
                                            title="ON" 
                                            onPress={() => {
                                                setSliderValue1(MAX_VALUE);
                                                sendMessage("LedAzul 255");
                                            }}
                                            color={ledBlueColor}
                                        />
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
                                        { color: sliderValue2 > 0 ? ledRedColor : secondaryTextColor }
                                    ]}>
                                        {getStateText(sliderValue2)}
                                    </Text>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={MAX_VALUE}
                                        value={sliderValue2}
                                        onValueChange={value => {
                                            const val = Math.floor(value);
                                            setSliderValue2(val);
                                            sendMessage(`LedRojo ${val}`);
                                        }}
                                        minimumTrackTintColor={ledRedColor}
                                        maximumTrackTintColor="#d3d3d3"
                                        thumbTintColor={ledRedColor}
                                    />
                                    <View style={styles.buttonRow}>
                                        <Button
                                            title="OFF" 
                                            onPress={() => {
                                                setSliderValue2(0);
                                                sendMessage("LedRojo 0");
                                            }}
                                            color="#757575"
                                        />
                                        <Button
                                            title="ON" 
                                            onPress={() => {
                                                setSliderValue2(MAX_VALUE);
                                                sendMessage("LedRojo 255");
                                            }}
                                            color={ledRedColor}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {isConnected && (
                    <View style={styles.metricsSection}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>
                            💧 Sistema Hidráulico
                        </Text>
                        <View style={[
                            styles.wideCard, 
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
                                <Text style={[
                                    styles.cardValue, 
                                    { color: sliderValue3 > 0 ? pumpColor : secondaryTextColor }
                                ]}>
                                    {getStateText(sliderValue3)}
                                </Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={MAX_VALUE}
                                    value={sliderValue3}
                                    onValueChange={value => {
                                        const val = Math.floor(value);
                                        setSliderValue3(val);
                                        sendMessage(`BombaDeAgua ${val}`);
                                    }}
                                    minimumTrackTintColor={pumpColor}
                                    maximumTrackTintColor="#d3d3d3"
                                    thumbTintColor={pumpColor}
                                />
                                <View style={styles.progressBarContainer}>
                                    <View 
                                        style={[
                                            styles.progressBar, 
                                            { 
                                                width: `${Math.min(100, Math.max(0, sliderValue3/MAX_VALUE*100))}%`,
                                                backgroundColor: pumpColor 
                                            }
                                        ]} 
                                    />
                                </View>
                                <View style={styles.buttonRow}>
                                    <Button
                                        title="APAGAR" 
                                        onPress={() => {
                                            setSliderValue3(0);
                                            sendMessage("BombaDeAgua 0");
                                        }}
                                        color="#757575"
                                    />
                                    <Button
                                        title="MÁXIMO" 
                                        onPress={() => {
                                            setSliderValue3(MAX_VALUE);
                                            sendMessage("BombaDeAgua 255");
                                        }}
                                        color={pumpColor}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Panel de consejos */}
                <View style={styles.metricsSection}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                        💡 Consejos de Operación
                    </Text>
                    <View style={[
                        styles.wideCard, 
                        { 
                            backgroundColor: cardBackground,
                            borderColor: cardBorderColor 
                        }
                    ]}>
                        <View style={styles.cardBody}>
                            <Text style={[styles.tipText, { color: secondaryTextColor }]}>
                                • Encienda los LEDs azules durante 18 horas para estimular el crecimiento vegetativo
                            </Text>
                            <Text style={[styles.tipText, { color: secondaryTextColor }]}>
                                • Los LEDs rojos favorecen la floración; úselos durante 12 horas en fase de floración
                            </Text>
                            <Text style={[styles.tipText, { color: secondaryTextColor }]}>
                                • Mantenga la bomba de agua activa durante períodos de 15 minutos con pausas de 45 minutos
                            </Text>
                            <Text style={[styles.tipText, { color: secondaryTextColor }]}>
                                • Supervisar el tablero para mantener la temperatura entre 18°C y 25°C
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.footer, { color: secondaryTextColor }]}>
                    Diseñado para optimizar el crecimiento de cultivos hidropónicos
                </Text>
            </View>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        padding: 16,
        alignItems: "center",
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: "absolute",
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
    wideCard: {
        width: '100%',
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
    statusCard: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
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
    slider: {
        width: '100%',
        height: 40,
        marginVertical: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusIndicator: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    connectionButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    progressBarContainer: {
        height: 8,
        width: '100%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginVertical: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
    tipText: {
        fontSize: 14,
        textAlign: 'left',
        width: '100%',
        marginBottom: 8,
        lineHeight: 20,
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 20,
        fontStyle: 'italic',
    }
});