import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as _useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";
type ThemeContextType = {
	theme: Theme;
	toggleTheme: () => void;
};

// Crear el contexto de tema
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const systemTheme = _useColorScheme();
	const [theme, setTheme] = useState<Theme>("light");
	const [isReady, setIsReady] = useState(false); // 🔥 Nuevo estado para evitar parpadeos

	// Cargar el tema guardado en AsyncStorage al iniciar
	useEffect(() => {
		const loadTheme = async () => {
			const savedTheme = await AsyncStorage.getItem("theme");
			if (savedTheme === "light" || savedTheme === "dark") {
				setTheme(savedTheme);
			} else {
				setTheme(systemTheme ?? "light");
			}
			setIsReady(true); // 🔥 Solo cambia el estado después de cargar el tema
		};
		loadTheme();
	}, [systemTheme]);

	// Alternar tema y forzar re-render
	const toggleTheme = async () => {
		const newTheme = theme === "light" ? "dark" : "light";
		await AsyncStorage.setItem("theme", newTheme);
		setTheme(newTheme);
	};

	if (!isReady) return null; // 🔥 Evita parpadeos de la pantalla mientras carga el tema

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

// Hook personalizado para usar el contexto del tema
export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme debe ser usado dentro de ThemeProvider");
	}
	return context;
};
