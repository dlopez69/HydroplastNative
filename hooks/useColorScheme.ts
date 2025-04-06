import { useColorScheme as _useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

// Hook para manejar el tema manual o del sistema
export function useColorScheme() {
	const systemTheme = _useColorScheme(); // Detecta el tema del sistema
	const [theme, setTheme] = useState<"light" | "dark">("light"); // Inicializa en "light"

	// Cargar el tema guardado en AsyncStorage
	useEffect(() => {
		const loadTheme = async () => {
			const savedTheme = await AsyncStorage.getItem("theme");
			if (savedTheme === "light" || savedTheme === "dark") {
				setTheme(savedTheme);
			} else {
				setTheme(systemTheme ?? "light"); // Asegurar que no sea undefined
			}
		};
		loadTheme();
	}, [systemTheme]);

	// Guardar el tema cuando cambie
	const toggleTheme = async () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		await AsyncStorage.setItem("theme", newTheme);
	};

	return { theme, toggleTheme };
}
