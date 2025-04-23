import { View, Text, StyleSheet, ScrollView, Dimensions, Button, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTheme } from "@/hooks/ThemeContext";
import useWebSocket from "@/hooks/useWebSocket";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import OperationModes from "@/components/OperationModes";
import ConnectionPanel from "@/components/ConnectionPanel";

const { width } = Dimensions.get("window");
const cardWidth = width > 600 ? "30%" : "46%"; // Adapta para tablets/phones
const MAX_VALUE = 4095;

export default function ControlScreen() {
    const {
        status,
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
    
    // Estados para cada slider
    const [sliderValue1, setSliderValue1] = useState(0);
    const [sliderValue2, setSliderValue2] = useState(0);
    const [sliderValue3, setSliderValue3] = useState(0);
    const [forceUpdate, setForceUpdate] = useState(false);

    // Actualizar los sliders cuando cambie systemState
    useEffect(() => {
        // console.log("🔄 Actualizando sliders con datos del servidor:", systemState);


        setSliderValue1(systemState.ledAzul);
        setSliderValue2(systemState.ledRojo);
        setSliderValue3(systemState.bombaAgua);
    }, [systemState]);

    useEffect(() => {
        setForceUpdate((prev) => !prev);
    }, [theme]);

    // Verificar si está conectado al WebSocket
    const isConnected = status === "Conectado";

    // Si no está conectado, mostrar mensaje
    if (!isConnected) {
        return (
			
            <View style={[styles.container, { backgroundColor }]}>
				<ConnectionPanel showInstructions={false} />
                <View style={styles.notConnectedMessage}>
                    <Text style={[styles.title, { color: textColor }]}>
                        ⚠️ Sistema Desconectado
                    </Text>
                    <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                        Por favor, conecta el sistema desde la página principal
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
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

                <View style={styles.operationModesWrapper}>
                    <OperationModes/>
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
                                    { color: sliderValue1 > 0 ? ledBlueColor : secondaryTextColor }
                                ]}>
                                    {`${Math.floor((sliderValue1 / MAX_VALUE) * 100)}%`}
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
                                            sendMessage(`LedAzul ${MAX_VALUE}`);
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
                                    {`${Math.floor((sliderValue2 / MAX_VALUE) * 100)}%`}
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
                                            sendMessage(`LedRojo ${MAX_VALUE}`);
                                        }}
                                        color={ledRedColor}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

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
                                {`${Math.floor((sliderValue3 / MAX_VALUE) * 100)}%`}
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
                                        sendMessage(`BombaDeAgua ${MAX_VALUE}`);
                                    }}
                                    color={pumpColor}
                                />
                            </View>
                        </View>
                    </View>
                </View>

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
        paddingTop: 40,
        padding: 16,
        alignItems: "center",
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    operationModesWrapper: {
        marginBottom: 54,
        width: '100%',
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
    progressBarContainer: {
        height: 10,
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
    },
    notConnectedMessage: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
});