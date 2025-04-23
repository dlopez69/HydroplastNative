import { useState, useEffect } from "react";

// const WS_SERVER = "ws://192.168.1.248:10000/ws"; // localhost
const WS_SERVER = "wss://servidorhydroplas.onrender.com/ws"; // servidor remoto

interface SystemState {
    timestamp: string;
    temperatura: number;
    iluminancia: number;
    nivelAgua: number;
    ledRojo: number;
    ledAzul: number;
    bombaAgua: number;
}

// Mantener una única instancia global del estado
let globalStatus = "Desconectado";
let globalWebSocket: WebSocket | null = null;
let globalSystemState: SystemState = {
    timestamp: "",
    temperatura: 0,
    iluminancia: 0,
    nivelAgua: 0,
    ledRojo: 0,
    ledAzul: 0,
    bombaAgua: 0
};

// Configuración de reconexión
const RECONNECT_INTERVAL = 5000; // Intentar reconectar cada 5 segundos
const MAX_RECONNECT_ATTEMPTS = 3; // Máximo número de intentos de reconexión
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

// Array de callbacks para notificar cambios
const statusListeners: ((status: string) => void)[] = [];
const systemStateListeners: ((state: SystemState) => void)[] = [];

export default function useWebSocket() {
    const [status, setStatus] = useState(globalStatus);
    const [systemState, setSystemState] = useState<SystemState>(globalSystemState);

    useEffect(() => {
        // Registrar listeners
        const statusCallback = (newStatus: string) => setStatus(newStatus);
        const stateCallback = (newState: SystemState) => setSystemState(newState);
        
        statusListeners.push(statusCallback);
        systemStateListeners.push(stateCallback);

        // Actualizar estado inicial si ya está conectado
        if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
            setStatus("Conectado");
            setSystemState(globalSystemState);
        }

        // Cleanup
        return () => {
            const statusIndex = statusListeners.indexOf(statusCallback);
            const stateIndex = systemStateListeners.indexOf(stateCallback);
            if (statusIndex > -1) statusListeners.splice(statusIndex, 1);
            if (stateIndex > -1) systemStateListeners.splice(stateIndex, 1);
        };
    }, []);

    const updateStatus = (newStatus: string) => {
        globalStatus = newStatus;
        statusListeners.forEach(listener => listener(newStatus));
    };

    const updateSystemState = (newState: SystemState) => {
        globalSystemState = newState;
        systemStateListeners.forEach(listener => listener(newState));
    };

    const scheduleReconnect = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(`🔄 Intentando reconectar... (intento ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            reconnectTimer = setTimeout(() => {
                reconnectAttempts++;
                connectWebSocket();
            }, RECONNECT_INTERVAL);
        } else {
            console.log("❌ Máximo número de intentos de reconexión alcanzado");
            updateStatus("Error");
            reconnectAttempts = 0; // Resetear para futuros intentos manuales
        }
    };

    const connectWebSocket = () => {
        if (globalWebSocket?.readyState === WebSocket.OPEN) {
            console.log("✅ WebSocket ya está conectado");
            return;
        }

        // Limpiar cualquier temporizador de reconexión existente
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        updateStatus("Conectando...");
        const websocket = new WebSocket(WS_SERVER);

        websocket.onopen = () => {
            console.log("✅ Conectado al ESP32");
            updateStatus("Conectado");
            websocket.send("clienteWeb");
            reconnectAttempts = 0; // Resetear contador de intentos al conectar exitosamente
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📥 Mensaje recibido:", data);
                
                if (
                    data.timestamp &&
                    typeof data.temperatura === 'number' &&
                    typeof data.iluminancia === 'number' &&
                    // Cambiar para aceptar las claves en snake_case
                    typeof data.nivelAgua === 'number' &&
                    typeof data.ledRojo === 'number' &&
                    typeof data.ledAzul === 'number' &&
                    typeof data.bombaAgua === 'number'
                ) {
                    updateSystemState({
                        timestamp: data.timestamp,
                        temperatura: data.temperatura,
                        iluminancia: data.iluminancia,
                        // Asignar valores de snake_case a camelCase
                        nivelAgua: data.nivelAgua,
                        ledRojo: data.ledRojo,
                        ledAzul: data.ledAzul,
                        bombaAgua: data.bombaAgua
                    });
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        };

        websocket.onerror = (error) => {
            console.error("❌ Error WebSocket:", error);
            updateStatus("Error");
            scheduleReconnect();
        };

        websocket.onclose = () => {
            console.log("🔌 WebSocket cerrado");
            updateStatus("Desconectado");
            scheduleReconnect();
        };

        globalWebSocket = websocket;
    };

    const disconnectWebSocket = () => {
        // Limpiar cualquier temporizador de reconexión
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        reconnectAttempts = 0; // Resetear intentos

        if (globalWebSocket) {
            globalWebSocket.close();
            globalWebSocket = null;
            updateStatus("Desconectado manualmente");
        }
    };

    const sendMessage = (message: string) => {
        if (globalWebSocket?.readyState === WebSocket.OPEN) {
            console.log("📤 Enviando mensaje:", message);
            globalWebSocket.send(message);
        } else {
            console.warn("⚠️ WebSocket no está conectado.");
            updateStatus("Error: No conectado");
        }
    };

    return {
        status,
        messages: [], // Ya no necesitamos mantener historial de mensajes
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        systemState,
    };
}
