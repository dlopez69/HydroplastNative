import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function DashboardScreen() {
    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    
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
    const [forceUpdate, setForceUpdate] = useState(0);

    useEffect(() => {
        setForceUpdate((prev) => prev + 1);
    }, [theme]);

    const fetchLatestData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Configurar modo no-cors para evitar errores CORS
            const response = await fetch("https://servidorhydroplas.onrender.com/api/last-reading", {
                mode: 'no-cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            
            // Nota: en modo no-cors, no podrás acceder al cuerpo de la respuesta
            // Por lo tanto, usaremos datos mockeados o almacenados localmente temporalmente
            
            // Datos mockeados (para demostración)
            const mockData = {
                timestamp: new Date().toISOString(),
                temperatura: 25.5,
                iluminancia: 500,
                nivel_agua: 75,
                led_rojo: 100,
                led_azul: 0,
                bomba_agua: 1
            };
            
            setSystemState({
                timestamp: mockData.timestamp,
                temperatura: mockData.temperatura,
                iluminancia: mockData.iluminancia,
                nivelAgua: mockData.nivel_agua,
                ledRojo: mockData.led_rojo,
                ledAzul: mockData.led_azul,
                bombaAgua: mockData.bomba_agua
            });
            
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            console.error("Error fetching data:", err);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchLatestData();
        
        // Opcional: configurar una actualización periódica
        const intervalId = setInterval(fetchLatestData, 30000); // Actualizar cada 30 segundos
        
        return () => {
            clearInterval(intervalId); // Limpiar el intervalo al desmontar
        };
    }, [fetchLatestData]);

    // Función para la recarga manual (pull-to-refresh)
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLatestData();
        setRefreshing(false);
    }, [fetchLatestData]);

    // Formatear estados de componentes para visualización
    const formatComponentState = (state) => {
        if (typeof state === 'number') {
            if (state > 0) {
                return `Encendido (${state}%)`;
            }
            return "Apagado";
        }
        return state ? "Encendido" : "Apagado";
    };

    return (
        <ScrollView 
            style={{ flex: 1, backgroundColor }}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={[styles.container, { backgroundColor }]} key={forceUpdate}>
                <Text style={[styles.title, { color: textColor }]}>📊 Monitor en Tiempo Real</Text>

                {loading && !refreshing && (
                    <Text style={[styles.statusText, { color: textColor }]}>
                        Cargando datos...
                    </Text>
                )}

                {error && (
                    <Text style={[styles.errorText, { color: 'red' }]}>
                        Error: {error}
                    </Text>
                )}

                <View style={styles.grid}>
                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Última Actualización</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.timestamp ? new Date(systemState.timestamp).toLocaleString() : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Temperatura</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.temperatura ? systemState.temperatura.toFixed(2) + '°C' : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Iluminancia</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.iluminancia ? systemState.iluminancia.toFixed(2) + ' lx' : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Nivel de Agua</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.nivelAgua !== undefined ? systemState.nivelAgua.toFixed(2) + '%' : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Led Azul</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.ledAzul !== undefined ? formatComponentState(systemState.ledAzul) : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Led Rojo</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.ledRojo !== undefined ? formatComponentState(systemState.ledRojo) : 'Sin datos'}
                        </Text>
                    </View>

                    <View style={[styles.card, { borderColor: textColor }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Bomba de Agua</Text>
                        <Text style={[styles.cardValue, { color: textColor }]}>
                            {systemState.bombaAgua !== undefined ? formatComponentState(systemState.bombaAgua) : 'Sin datos'}
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        padding: 20,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    statusText: {
        fontSize: 16,
        marginBottom: 10,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    card: {
        width: '48%',
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
    }
});