import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/hooks/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width } = Dimensions.get("window");
const cardWidth = width > 600 ? "30%" : "46%";

interface MetricCardProps {
  icon: string;
  title: string;
  value: string | number;
  unit?: string;
  color: string;
  status?: string;
  showProgressBar?: boolean;
  progressValue?: number;
  isToggleableComponent?: boolean;
  isActive?: boolean;
  statusText?: string;
}

export default function MetricCard({
  icon,
  title,
  value,
  unit = "",
  color,
  status,
  showProgressBar = false,
  progressValue = 0,
  isToggleableComponent = false,
  isActive = false,
  statusText,
}: MetricCardProps) {
  const { theme } = useTheme();
  const secondaryTextColor = useThemeColor({}, "tabIconDefault");
  const cardBackground = theme === "dark" ? "#1F1F1F" : "#F7F9FC";
  const cardBorderColor = theme === "dark" ? "#2D2D2D" : "#E0E5EC";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorderColor,
        },
      ]}
    >
      <View
        style={[
          styles.cardHeader,
          {
            backgroundColor: theme === "dark" ? "#2A2A2A" : "#f0f3f8",
          },
        ]}
      >
        <Text style={[styles.cardIcon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: secondaryTextColor }]}>
          {title}
        </Text>
        <Text style={[styles.cardValue, { color }]}>
          {typeof value === "number" ? `${value}${unit}` : value}
        </Text>

        {status && (
          <Text style={[styles.cardStatus, { color: secondaryTextColor }]}>
            {status}
          </Text>
        )}

        {showProgressBar && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(100, Math.max(0, progressValue))}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        )}

        {isToggleableComponent && (
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isActive ? color : "#DDD",
              },
            ]}
          >
            <Text style={styles.statusIndicatorText}>
              {statusText || (isActive ? "ENCENDIDO" : "APAGADO")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 14,
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  cardStatus: {
    fontSize: 12,
    textAlign: "center",
  },
  progressBarContainer: {
    height: 8,
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  statusIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "center",
    marginTop: 8,
  },
  statusIndicatorText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});