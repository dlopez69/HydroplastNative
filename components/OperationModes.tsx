import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import useWebSocket from "@/hooks/useWebSocket";
import { useState } from "react";

interface OperationModesProps {
    onModeChange?: (mode: 'automatic' | 'manual' | 'ia') => void;
}

export default function OperationModes({ onModeChange }: OperationModesProps) {
    const { theme } = useTheme();
    const textColor = useThemeColor({}, "text");
    const accentColor = useThemeColor({}, "tint");
    const { status, sendMessage } = useWebSocket();
    const [currentMode, setCurrentMode] = useState<'automatic' | 'manual' | 'ia'>('automatic');    const handleModeSelect = (mode: 'automatic' | 'manual' | 'ia') => {
        if (status === "Conectado") {
            setCurrentMode(mode);
            // Send the appropriate command to the ESP32
            if (mode === 'automatic') {
                sendMessage("auto 0");
            } else if (mode === 'manual') {
                sendMessage("manual 0");
            } else if (mode === 'ia') {
                sendMessage("ia 0");
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
                            backgroundColor: currentMode === 'automatic' 
                                ? accentColor 
                                : theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor,
                            borderWidth: currentMode === 'automatic' ? 3 : 2,
                            elevation: currentMode === 'automatic' ? 8 : 2,
                            shadowOpacity: currentMode === 'automatic' ? 0.3 : 0.1,
                            transform: [{ scale: currentMode === 'automatic' ? 1.02 : 1 }],
                        }
                    ]}
                    onPress={() => handleModeSelect('automatic')}
                >
                    <Text style={[
                        styles.modeButtonText, 
                        { 
                            color: currentMode === 'automatic' 
                                ? (theme === 'dark' ? '#fff' : '#000')  
                                : textColor,
                            fontWeight: currentMode === 'automatic' ? 'bold' : 'normal'
                        }
                    ]}>
                        Automático
                    </Text>
                </TouchableOpacity>                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: currentMode === 'manual' 
                                ? accentColor 
                                : theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor,
                            borderWidth: currentMode === 'manual' ? 3 : 2,
                            elevation: currentMode === 'manual' ? 8 : 2,
                            shadowOpacity: currentMode === 'manual' ? 0.3 : 0.1,
                            transform: [{ scale: currentMode === 'manual' ? 1.02 : 1 }],
                        }
                    ]}
                    onPress={() => handleModeSelect('manual')}
                >
                    <Text style={[
                        styles.modeButtonText, 
                        { 
                            color: currentMode === 'manual' 
                                ? (theme === 'dark' ? '#fff' : '#000')  
                                : textColor,
                            fontWeight: currentMode === 'manual' ? 'bold' : 'normal'
                        }
                    ]}>
                        Manual
                    </Text>
                </TouchableOpacity>                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: currentMode === 'ia' 
                                ? accentColor 
                                : theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor,
                            borderWidth: currentMode === 'ia' ? 3 : 2,
                            elevation: currentMode === 'ia' ? 8 : 2,
                            shadowOpacity: currentMode === 'ia' ? 0.3 : 0.1,
                            transform: [{ scale: currentMode === 'ia' ? 1.02 : 1 }],
                        }
                    ]}
                    onPress={() => handleModeSelect('ia')}
                >
                    <Text style={[
                        styles.modeButtonText, 
                        { 
                            color: currentMode === 'ia' 
                                ? (theme === 'dark' ? '#fff' : '#000') 
                                : textColor,
                            fontWeight: currentMode === 'ia' ? 'bold' : 'normal'
                        }
                    ]}>
                        IA
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
    },    modeButton: {
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