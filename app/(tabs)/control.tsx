import { Image, StyleSheet, View, Button, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
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
        systemState,
    } = useWebSocket();

    // Aplicar colores según el tema
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const buttonColor = useThemeColor({}, "primary");
    const [forceUpdate, setForceUpdate] = useState(false);
    const { theme } = useTheme();

    // Estados para cada slider
    const [sliderValue1, setSliderValue1] = useState(0);
    const [sliderValue2, setSliderValue2] = useState(0);
    const [sliderValue3, setSliderValue3] = useState(0);

    // Actualizar los sliders cuando cambie systemState
    useEffect(() => {
        setSliderValue1(systemState.ledAzul);
        setSliderValue2(systemState.ledRojo);
        setSliderValue3(systemState.bombaAgua);
    }, [systemState]);

    useEffect(() => {
        setForceUpdate((prev) => !prev); // 🔥 Fuerza re-render cuando cambia el tema
    }, [theme]);

    // Verificar si está conectado al WebSocket
    const isConnected = status === "Conectado";

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
                            disabled={isConnected}
                            color={buttonColor}
                        />
                        <Button
                            title="Desconectar"
                            onPress={disconnectWebSocket}
                            disabled={!isConnected}
                            color="#F44336"
                        />
                    </View>
                </ThemedView>

                {/* Mostrar los sliders solo cuando está conectado */}
                {isConnected && (
                    <ThemedView style={styles.stepContainer}>
                        <ThemedText type="subtitle" style={{ color: textColor }}>
                            Acciones - Ajusta las barras
                        </ThemedText>
                        <View style={styles.sliderContainer}>
                            <ThemedText style={{ color: textColor }}>
                                Led Azul: {sliderValue1}
                            </ThemedText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={255}
                                value={sliderValue1}
                                onValueChange={value => {
                                    const val = Math.floor(value);
                                    setSliderValue1(val);
                                    sendMessage(`LedAzul ${val}`);
                                }}
                                minimumTrackTintColor={buttonColor}
                                maximumTrackTintColor="#d3d3d3"
                            />
                            <ThemedText style={{ color: textColor }}>
                                Led Roja: {sliderValue2}
                            </ThemedText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={255}
                                value={sliderValue2}
                                onValueChange={value => {
                                    const val = Math.floor(value);
                                    setSliderValue2(val);
                                    sendMessage(`LedRojo ${val}`);
                                }}
                                minimumTrackTintColor={buttonColor}
                                maximumTrackTintColor="#d3d3d3"
                            />
                            <ThemedText style={{ color: textColor }}>
                                Bomba de Agua: {sliderValue3}
                            </ThemedText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={255}
                                value={sliderValue3}
                                onValueChange={value => {
                                    const val = Math.floor(value);
                                    setSliderValue3(val);
                                    sendMessage(`BombaDeAgua ${val}`);
                                }}
                                minimumTrackTintColor={buttonColor}
                                maximumTrackTintColor="#d3d3d3"
                            />
                        </View>
                    </ThemedView>
                )}

                {/* <ThemedView style={styles.stepContainer}>
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
                </ThemedView> */}
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
    sliderContainer: {
        gap: 10,
    },
    slider: {
        width: "100%",
        height: 40,
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