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
        nivelAgua: 0, // camelCase
        ledRojo: 0,   // camelCase
        ledAzul: 0,   // camelCase
        bombaAgua: 0  // camelCase
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0); // Considera si realmente necesitas forceUpdate

    useEffect(() => {
        // Si esto es solo para re-renderizar por cambio de tema,
        // los estilos que usan useThemeColor ya deberían hacerlo.
        // Podrías quitar forceUpdate si no es estrictamente necesario.
        setForceUpdate((prev) => prev + 1);
    }, [theme]);

    const fetchLatestData = useCallback(async () => {
        // No pongas setLoading(true) aquí si quieres que el refreshControl funcione bien
        // setLoading(true); // <- Quitar de aquí o manejar diferente para refresh
        setError(null);

        try {
            console.log("Fetching latest data...");
            const response = await fetch("https://servidorhydroplas.onrender.com/api/last-reading"); // <-- Sin mode: 'no-cors'

            console.log("Response status:", response.status);

            if (!response.ok) {
                // Intenta obtener más detalles del error si es posible
                let errorBody = "Error desconocido";
                try {
                    errorBody = await response.text(); // O response.json() si esperas JSON en errores
                } catch (parseError) {
                    console.error("Could not parse error response:", parseError);
                }
                throw new Error(`HTTP error ${response.status}: ${response.statusText}. Body: ${errorBody}`);
            }

            const data = await response.json(); // <-- Procesar la respuesta JSON real
            console.log("Data received:", data);

            // Actualizar el estado con los datos REALES, ajustando las claves
            setSystemState({
                timestamp: data.timestamp,
                temperatura: data.temperatura,
                iluminancia: data.iluminancia,
                nivelAgua: data.nivel_agua, // <- Mapear desde la clave de la API
                ledRojo: data.led_rojo,     // <- Mapear desde la clave de la API
                ledAzul: data.led_azul,     // <- Mapear desde la clave de la API
                bombaAgua: data.bomba_agua   // <- Mapear desde la clave de la API
            });

        } catch (err) {
            // Muestra el error de forma más clara
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setLoading(false); // Asegúrate de quitar el loading en caso de error
            setRefreshing(false); // Asegúrate de quitar el refreshing en caso de error
            console.error("Error fetching data:", errorMessage);
        } finally {
             // Quitar loading/refreshing aquí asegura que se haga siempre
             // Pero puede causar un "flash" si la carga es muy rápida.
             // Decide dónde es mejor ponerlo basado en la experiencia de usuario.
             if (!refreshing) { // Solo quita el loading inicial si no es un refresh
                 setLoading(false);
             }
             // setRefreshing(false); // onRefresh ya lo hace
        }
    }, [refreshing]); // Añadir refreshing como dependencia si afecta la lógica interna

    // Cargar datos al montar el componente
    useEffect(() => {
        setLoading(true); // Poner loading aquí para la carga inicial
        fetchLatestData();

        // Configurar una actualización periódica
        const intervalId = setInterval(fetchLatestData, 5000); // Actualizar cada 30 segundos

        return () => {
            clearInterval(intervalId); // Limpiar el intervalo al desmontar
        };
        // fetchLatestData depende de 'refreshing', pero aquí no queremos que se ejecute
        // cada vez que 'refreshing' cambia. Separar la lógica o ajustar dependencias.
        // Una forma simple es no incluir 'refreshing' en las dependencias de este useEffect.
    }, []); // Solo ejecutar al montar

    // Función para la recarga manual (pull-to-refresh)
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLatestData();
        setRefreshing(false); // fetchLatestData ya no debería manejar refreshing
    }, [fetchLatestData]); // Correcto

    // Formatear estados de componentes para visualización
    const formatComponentState = (state) => {
        if (typeof state === 'number') {
            // Considerar 0 como Apagado explícitamente
            if (state === 0) {
                return "Apagado";
            } else if (state > 0) {
                // Mostrar porcentaje si es > 0 y <= 100 (o según tu lógica)
                // Asumiendo que 1 es Encendido (100%) y 0 Apagado para la bomba
                if (state === 1) return "Encendido"; // Para la bomba
                // Para los LEDs, si envías 0-255 o 0-100, ajusta aquí
                return `Encendido (${state}%)`; // Asumiendo porcentaje para LEDs
            }
        }
        // Para booleanos u otros tipos, si los usaras
        return state ? "Encendido" : "Apagado";
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor }}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textColor} /> // Puedes tintar el spinner
            }
        >
            {/* Usar key={forceUpdate} puede ser ineficiente, intenta evitarlo si es posible */}
            <View style={[styles.container, { backgroundColor }]}>
                <Text style={[styles.title, { color: textColor }]}>📊 Monitor en Tiempo Real</Text>

                {/* Mostrar loading solo si no hay error y loading es true */}
                {loading && !error && (
                    <Text style={[styles.statusText, { color: textColor }]}>
                        Cargando datos...
                    </Text>
                )}

                {/* Mostrar error si existe */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>
                            Error al cargar datos: {error}
                        </Text>
                    </View>
                )}

                {/* Mostrar la grilla solo si no hay loading inicial y no hay error */}
                {!loading && !error && (
                    <View style={styles.grid}>
                        {/* ... tus cards ... */}
                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Última Actualización</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.timestamp ? new Date(systemState.timestamp).toLocaleString() : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Temperatura</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.temperatura != null ? systemState.temperatura.toFixed(1) + '°C' : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Iluminancia</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.iluminancia != null ? systemState.iluminancia.toFixed(0) + ' lx' : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Nivel de Agua</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.nivelAgua != null ? systemState.nivelAgua.toFixed(1) + '%' : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Led Azul</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.ledAzul != null ? formatComponentState(systemState.ledAzul) : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Led Rojo</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.ledRojo != null ? formatComponentState(systemState.ledRojo) : 'N/A'}
                            </Text>
                        </View>

                        <View style={[styles.card, { borderColor: textColor }]}>
                            <Text style={[styles.cardTitle, { color: textColor }]}>Bomba de Agua</Text>
                            <Text style={[styles.cardValue, { color: textColor }]}>
                                {systemState.bombaAgua != null ? formatComponentState(systemState.bombaAgua) : 'N/A'}
                            </Text>
                        </View>
                    </View>
                 )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60, // Ajusta según necesites (SafeAreaView es mejor)
        padding: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 16,
        marginVertical: 20,
        textAlign: 'center',
    },
    errorContainer: {
        marginVertical: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'red',
        width: '90%',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    card: {
        width: '48%', // Deja un pequeño espacio entre tarjetas
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderWidth: 1,
        // backgroundColor: 'rgba(0,0,0,0.05)', // El color de fondo viene del hook
    },
    cardTitle: {
        fontSize: 14, // Ligeramente más pequeño
        fontWeight: '500',
        marginBottom: 8, // Más espacio
    },
    cardValue: {
        fontSize: 18, // Ligeramente más pequeño
        fontWeight: 'bold',
    }
});