import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import useWebSocket from "@/hooks/useWebSocket";
import { useState } from "react";

interface OperationModesProps {
    onModeChange?: (mode: 'automatic' | 'manual') => void;
}

export default function OperationModes({ onModeChange }: OperationModesProps) {
    const { theme } = useTheme();
    const textColor = useThemeColor({}, "text");
    const accentColor = useThemeColor({}, "tint");
    const { status, sendMessage } = useWebSocket();
    const [currentMode, setCurrentMode] = useState<'automatic' | 'manual'>('automatic');

    const handleModeSelect = (mode: 'automatic' | 'manual') => {
        if (status === "Conectado") {
            setCurrentMode(mode);
            // Send the appropriate command to the ESP32
            if (mode === 'automatic') {
                sendMessage("auto 0");
            } else {
                sendMessage("manual 0");
            }
            console.log(`Modo seleccionado: ${mode}`);
            onModeChange?.(mode);
        } else {
            console.warn("No se puede cambiar el modo: Sistema desconectado");
        }
    };

    return (
        <View style={styles.modesSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
                🔄 Modos de Funcionamiento
            </Text>
            <View style={styles.modesContainer}>
                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor,
                            borderWidth: currentMode === 'automatic' ? 3 : 2,
                        }
                    ]}
                    onPress={() => handleModeSelect('automatic')}
                >
                    <Text style={[
                        styles.modeButtonText, 
                        { 
                            color: textColor,
                            fontWeight: currentMode === 'automatic' ? 'bold' : 'normal'
                        }
                    ]}>
                        Automático
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor,
                            borderWidth: currentMode === 'manual' ? 3 : 2,
                        }
                    ]}
                    onPress={() => handleModeSelect('manual')}
                >
                    <Text style={[
                        styles.modeButtonText, 
                        { 
                            color: textColor,
                            fontWeight: currentMode === 'manual' ? 'bold' : 'normal'
                        }
                    ]}>
                        Manual
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modesSection: {
        width: "100%",
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
        textAlign: "center",
    },
    modesContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
    },
    modeButton: {
        flex: 1,
        minWidth: 100,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 8,
    },
    modeButtonText: {
        fontSize: 16,
    },
});