import { useState, useEffect, useRef } from "react";

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

export default function useWebSocket() {
    const [status, setStatus] = useState("Desconectado");
    const [messages, setMessages] = useState<string[]>([]);
    const [systemState, setSystemState] = useState<SystemState>({
        timestamp: "",
        temperatura: 0,
        iluminancia: 0,
        nivelAgua: 0,
        ledRojo: 0,
        ledAzul: 0,
        bombaAgua: 0
    });
    const websocketRef = useRef<WebSocket | null>(null);

    const connectWebSocket = () => {
        if (
            websocketRef.current &&
            websocketRef.current.readyState === WebSocket.OPEN
        ) {
            console.log("✅ WebSocket ya está conectado");
            return;
        }

        setStatus("Conectando...");
        const websocket = new WebSocket(WS_SERVER);

        websocket.onopen = () => {
            console.log("✅ Conectado al ESP32");
            setStatus("Conectado");
            websocket.send("clienteWeb");
        };

        websocket.onmessage = (event) => {
            console.log("📩 Mensaje recibido:", event.data);
            try {
                const data = JSON.parse(event.data);
                // Verificar que el mensaje tenga el formato correcto
                if (
                    data.timestamp &&
                    typeof data.temperatura === 'number' &&
                    typeof data.iluminancia === 'number' &&
                    typeof data.nivelAgua === 'number' &&
                    typeof data.ledRojo === 'number' &&
                    typeof data.ledAzul === 'number' &&
                    typeof data.bombaAgua === 'number'
                ) {
                    setSystemState(data);
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
            setMessages((prev) => [...prev, event.data]);
        };

        websocket.onerror = (error) => {
            console.error("❌ Error WebSocket:", error);
            setStatus("Error");
        };

        websocket.onclose = () => {
            console.log("🔌 WebSocket cerrado");
            setStatus("Desconectado");
        };

        websocketRef.current = websocket;
    };

    const disconnectWebSocket = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
            setStatus("Desconectado manualmente");
        }
    };

    const sendMessage = (message: string) => {
        if (
            websocketRef.current &&
            websocketRef.current.readyState === WebSocket.OPEN
        ) {
            console.log("📤 Enviando mensaje:", message);
            websocketRef.current.send(message);
        } else {
            console.warn("⚠️ WebSocket no está conectado.");
            setStatus("Error: No conectado");
        }
    };

    return {
        status,
        messages,
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        systemState,
    };
}
