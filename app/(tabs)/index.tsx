import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useEffect } from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import useWebSocket from "@/hooks/useWebSocket";
import ConnectionPanel from "@/components/ConnectionPanel";
import { default as Collapsible } from "@/components/Collapsible";
import OperationModes from "@/components/OperationModes";

export default function HomeScreen() {
    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");
    const { status, connectWebSocket } = useWebSocket();

    // Intentar conectar automáticamente al iniciar la app
    useEffect(() => {
        if (status === "Desconectado") {
            console.log("🔄 Intentando conexión automática...");
            connectWebSocket();
        }
    }, []);

    return (
        <ScrollView style={[styles.scrollView, { backgroundColor }]}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: textColor }]}>
                    Bienvenido a HydroPlas
                </Text>
                <Text style={[styles.text, { color: textColor }]}>
                    Monitorea y controla tu sistema hidropónico.
                </Text>

                <ConnectionPanel showInstructions={false} />

                

                <View style={styles.operationModesWrapper}>
                    <OperationModes/>
                </View>

                {/* Instrucciones Desplegables */}
                <View style={styles.instructionsSection}>
                    <Collapsible title="📱 Instrucciones Generales">
                        <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                            • La aplicación intentará conectarse automáticamente al iniciar{"\n"}
                            • Ve al tablero para monitorear las métricas{"\n"}
                            • Usa el panel de control para ajustar las luces y la bomba{"\n"}
                            • Revisa la configuración para personalizar la aplicación
                        </Text>
                    </Collapsible>

                    <Collapsible title="🔄 Modos de Operación">
                        <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                            • Modo Automático: El sistema funciona según horarios predefinidos{"\n"}
                            • Modo Manual: Control total sobre cada componente del sistema{"\n"}
                            • Modo Inteligente: Ajustes automáticos basados en las condiciones
                        </Text>
                    </Collapsible>

                    <Collapsible title="💡 Consejos de Uso">
                        <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                            • Mantén una conexión estable a internet{"\n"}
                            • Verifica el estado de conexión antes de realizar cambios{"\n"}
                            • Monitorea regularmente las métricas del sistema{"\n"}
                            • Ajusta la configuración según las necesidades de tus cultivos
                        </Text>
                    </Collapsible>

                    <Collapsible title="⚠️ Solución de Problemas">
                        <Text style={[styles.instruction, { color: secondaryTextColor }]}>
                            • Si pierdes conexión, intenta reconectar manualmente{"\n"}
                            • Verifica tu conexión a internet si hay problemas{"\n"}
                            • Reinicia la aplicación si persisten los problemas{"\n"}
                            • Contacta soporte técnico si necesitas ayuda adicional
                        </Text>
                    </Collapsible>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingTop: 60,
        padding: 20,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    operationModesWrapper: {
        marginBottom: 54,
        width: '100%',
    },
    text: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: "center",
    },
    instructionsSection: {
        width: "100%",
        gap: 16,
    },
    instruction: {
        fontSize: 14,
        lineHeight: 22,
    },
});
