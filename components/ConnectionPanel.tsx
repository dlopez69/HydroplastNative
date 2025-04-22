import { View, Text, StyleSheet, Button } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import useWebSocket from "@/hooks/useWebSocket";

interface ConnectionPanelProps {
    showInstructions?: boolean;
}

export default function ConnectionPanel({ showInstructions = false }: ConnectionPanelProps) {
    const { theme } = useTheme();
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");

    const {
        status,
        connectWebSocket,
        disconnectWebSocket,
    } = useWebSocket();

    const isConnected = status === "Conectado";
    
    // Colores para estados de conexión
    const connectedColor = "#4CAF50";
    const disconnectedColor = "#F44336";
    const connectButtonColor = theme === "dark" ? "#2979FF" : "#2979FF";
    const disconnectButtonColor = "#F44336";

    return (
        <>
            {/* Panel de Conexión */}
            <View style={[styles.connectionCard, { 
                backgroundColor: theme === "dark" ? "#1F1F1F" : "#F7F9FC",
                borderColor: theme === "dark" ? "#2D2D2D" : "#E0E5EC"
            }]}>
                <View style={styles.statusRow}>
                    <Text style={[styles.statusLabel, { color: secondaryTextColor }]}>
                        Estado del Sistema:
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
                        title="Reconectar"
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

                {status === "Error" && (
                    <Text style={[styles.errorMessage, { color: disconnectedColor }]}>
                        No se pudo conectar al servidor. Intente reconectar.
                    </Text>
                )}
            </View>

            {/* Instrucciones opcionales */}
            {showInstructions && (
                <View style={styles.instructionsContainer}>
                    <Text style={[styles.instructionTitle, { color: secondaryTextColor }]}>
                        Instrucciones de Conexión:
                    </Text>
                    <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                        1. La aplicación intentará conectarse automáticamente al iniciar
                    </Text>
                    <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                        2. Si la conexión falla, presione "Reconectar"
                    </Text>
                    <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                        3. Use "Desconectar" si necesita detener la comunicación
                    </Text>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    connectionCard: {
        width: "100%",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    statusIndicator: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusIndicatorText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    connectionButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    errorMessage: {
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
    },
    instructionsContainer: {
        width: "100%",
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    instruction: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    }
});