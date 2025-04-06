import { Colors } from "@/constants/Colors";
import { useTheme } from "@/hooks/ThemeContext";
import { useState, useEffect } from "react";

export function useThemeColor(
	props: { light?: string; dark?: string },
	colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
	const { theme } = useTheme();
	const [currentColor, setCurrentColor] = useState<string>(
		Colors[theme][colorName]
	);

	useEffect(() => {
		setCurrentColor(Colors[theme][colorName]); // 🔥 Se ejecuta cuando cambia el tema
	}, [theme]);

	return props[theme] ?? currentColor;
}
