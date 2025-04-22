import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

interface OperationModesProps {
    onModeSelect?: (mode: 'automatic' | 'manual' | 'intelligent') => void;
}

export default function OperationModes({ onModeSelect }: OperationModesProps) {
    const { theme } = useTheme();
    const textColor = useThemeColor({}, "text");
    const accentColor = useThemeColor({}, "tint");

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
                            borderColor: accentColor
                        }
                    ]}
                    onPress={() => onModeSelect?.('automatic')}
                >
                    <Text style={[styles.modeButtonText, { color: textColor }]}>
                        Automático
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor
                        }
                    ]}
                    onPress={() => onModeSelect?.('manual')}
                >
                    <Text style={[styles.modeButtonText, { color: textColor }]}>
                        Manual
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[
                        styles.modeButton, 
                        { 
                            backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                            borderColor: accentColor
                        }
                    ]}
                    onPress={() => onModeSelect?.('intelligent')}
                >
                    <Text style={[styles.modeButtonText, { color: textColor }]}>
                        Inteligente
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modesSection: {
        width: "100%",
        marginBottom: 32,
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
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    modeButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});