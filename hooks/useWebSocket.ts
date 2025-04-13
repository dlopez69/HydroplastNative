import { useState, useEffect, useRef } from "react";

// const WS_SERVER = "ws://192.168.1.248:10000"; // localhost
const WS_SERVER = "wss://servidorhydroplas.onrender.com"	; // servidor remoto


export default function useWebSocket() {
	const [status, setStatus] = useState("Desconectado");
	const [messages, setMessages] = useState<string[]>([]);
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
			websocket.send("clienteWeb"); // mensaje para identificar el cliente
		};

		websocket.onmessage = (event) => {
			console.log("📩 Mensaje recibido:", event.data);
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

	useEffect(() => {
		return () => {
			if (websocketRef.current) {
				websocketRef.current.close();
			}
		};
	}, []);

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
	};
}
