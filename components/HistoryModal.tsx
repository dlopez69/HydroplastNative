import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  color: string;
  metric: string;
  unit: string;
}

interface DataPoint {
  timestamp: string;
  value: number;
}

const { width, height } = Dimensions.get('window');
const modalWidth = width * 0.95;
const modalHeight = height * 0.8;
const chartWidth = modalWidth - 60;
const chartHeight = Math.min(modalHeight * 0.4, 220);
const MAX_DATA_POINTS = 100;
const REAL_TIME_MAX_POINTS = 10;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  fillShadowGradient: '#000000',
  fillShadowGradientOpacity: 0.1,
  decimalPlaces: 1,
  propsForLabels: {
    fontSize: 10,
  },
};

export default function HistoryModal({ visible, onClose, title, color, metric, unit }: HistoryModalProps) {
  const { theme } = useTheme();
  const backgroundColor = theme === 'dark' ? '#1F1F1F' : '#FFFFFF';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'realtime' | '1d' | '7d' | '30d'>('realtime');
  const [realtimeInterval, setRealtimeInterval] = useState<NodeJS.Timeout | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // Separar los datos de tiempo real de los datos históricos
  const [realtimeData, setRealtimeData] = useState<DataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  const getCurrentValue = () => {
    const currentData = timeRange === 'realtime' ? realtimeData : historicalData;
    if (!currentData || currentData.length === 0) return '---';
    const lastDataPoint = currentData[currentData.length - 1];
    if (!lastDataPoint || typeof lastDataPoint.value !== 'number') return '---';
    return `${lastDataPoint.value.toFixed(1)}${unit}`;
  };

  // Efecto para manejar la visibilidad del modal
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      setChartError(null);
      setChartReady(false);
      // Iniciar en modo tiempo real
      setTimeRange('realtime');
      fetchRealtimeData(true);
    } else {
      // Limpiar estados cuando se cierra el modal
      if (realtimeInterval) {
        clearInterval(realtimeInterval);
        setRealtimeInterval(null);
      }
      setRealtimeData([]);
      setHistoricalData([]);
      setChartReady(false);
    }
  }, [visible]);

  // Efecto para manejar cambios en el timeRange
  useEffect(() => {
    if (visible && metric) {
      if (timeRange === 'realtime') {
        fetchRealtimeData(true);
      } else {
        if (realtimeInterval) {
          clearInterval(realtimeInterval);
          setRealtimeInterval(null);
        }
        fetchData(true);
      }
    }
  }, [timeRange, metric]);

  const fetchRealtimeData = async (isMounted: boolean) => {
    if (!isMounted) return;
    
    setLoading(true);
    setError(null);
    setChartError(null);
    setChartReady(false);
    
    try {
      const response = await fetch('https://servidorhydroplas.onrender.com/api/history');
      if (!isMounted) return;

      if (!response.ok) {
        throw new Error('Error al obtener datos históricos');
      }
      
      const historyData = await response.json();
      if (!isMounted) return;

      const validData = historyData
        .filter((item: any) => item && item[metric] !== undefined)
        .map((item: any) => ({
          timestamp: item.timestamp,
          value: item[metric] || 0
        }))
        .slice(-REAL_TIME_MAX_POINTS);
      
      setRealtimeData(validData);
      setChartReady(true);
      setLoading(false);

      // Limpiar intervalo existente si hay uno
      if (realtimeInterval) {
        clearInterval(realtimeInterval);
      }

      // Configurar nuevo intervalo para datos en tiempo real
      const interval = setInterval(async () => {
        try {
          const lastReadingResponse = await fetch('https://servidorhydroplas.onrender.com/api/last-reading');
          if (!isMounted) return;

          if (!lastReadingResponse.ok) {
            throw new Error('Error al obtener último valor');
          }

          const lastReading = await lastReadingResponse.json();
          if (lastReading && lastReading[metric] !== undefined) {
            setRealtimeData(prevData => {
              const newData = [...prevData, {
                timestamp: lastReading.timestamp,
                value: lastReading[metric] || 0
              }];
              return newData.slice(-REAL_TIME_MAX_POINTS);
            });
          }
        } catch (err) {
          console.error('Error en actualización en tiempo real:', err);
        }
      }, 5000);

      setRealtimeInterval(interval);
    } catch (err) {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      console.error('Error al cargar datos en tiempo real:', err);
      setLoading(false);
    }
  };

  const fetchData = async (isMounted: boolean) => {
    if (!isMounted) return;
    
    setLoading(true);
    setError(null);
    setChartError(null);
    setChartReady(false);
    
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const url = `https://servidorhydroplas.onrender.com/api/data-by-date-range?start_date=${formattedStartDate}&end_date=${formattedEndDate}&column=${metric}`;
      const response = await fetch(url);
      
      if (!isMounted) return;

      if (!response.ok) {
        throw new Error('Error al obtener datos');
      }
      
      const result = await response.json();
      if (!isMounted) return;

      // Filtrar y validar datos
      const validData = result
        .filter((item: any) => 
          item && 
          item.timestamp && 
          item[metric] !== undefined && 
          !isNaN(item[metric]) &&
          isFinite(item[metric])
        )
        .map((item: any) => ({
          timestamp: item.timestamp,
          value: item[metric] || 0
        }));

      // Reducir puntos si hay demasiados
      let processedData = validData;
      if (validData.length > MAX_DATA_POINTS) {
        const step = Math.floor(validData.length / MAX_DATA_POINTS);
        processedData = validData.filter((_, index) => index % step === 0);
        // Asegurar que incluimos el último punto
        if (validData.length > 0) {
          processedData.push(validData[validData.length - 1]);
        }
      }
      
      setHistoricalData(processedData);
      setChartReady(true);
    } catch (err) {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      console.error('Error al cargar datos históricos:', err);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const safeRenderChart = () => {
    try {
      const currentData = timeRange === 'realtime' ? realtimeData : historicalData;
      if (!currentData || currentData.length === 0) return null;

      // Validar y limpiar datos antes de renderizar
      const validData = currentData.filter(item => 
        item && 
        item.timestamp && 
        typeof item.value === 'number' && 
        !isNaN(item.value) &&
        isFinite(item.value)
      );

      if (validData.length === 0) {
        throw new Error('No hay datos válidos para mostrar');
      }

      // Preparar datos seguros para la gráfica
      const chartData = {
        labels: validData.map(item => {
          try {
            const date = new Date(item.timestamp);
            if (timeRange === 'realtime') {
              return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            } else if (timeRange === '1d') {
              return `${date.getHours()}h`;
            }
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          } catch (e) {
            return '';
          }
        }),
        datasets: [{
          data: validData.map(item => Number(item.value) || 0),
          color: () => color,
          strokeWidth: 2
        }]
      };

      return (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              ...chartConfig,
              backgroundGradientFrom: backgroundColor,
              backgroundGradientTo: backgroundColor,
              decimalPlaces: 1,
              color: () => color,
              labelColor: () => secondaryTextColor,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: color
              },
              propsForLabels: {
                fontSize: 10,
                fontWeight: '400'
              }
            }}
            bezier
            style={styles.chart}
            withDots={validData.length < 50}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisSuffix={unit}
            onDataPointClick={() => {}}
          />
        </View>
      );
    } catch (err) {
      console.error('Error al renderizar la gráfica:', err);
      setChartError(err instanceof Error ? err.message : 'Error al generar la gráfica');
      return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            {timeRange === 'realtime' ? 'Iniciando monitoreo...' : 'Cargando datos...'}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="red" />
          <Text style={[styles.errorText, { color: 'red' }]}>{error}</Text>
          <TouchableOpacity 
            onPress={() => {
              setError(null);
              timeRange === 'realtime' ? fetchRealtimeData(true) : fetchData(true);
            }}
            style={[styles.retryButton, { backgroundColor: color }]}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (chartError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="orange" />
          <Text style={[styles.errorText, { color: 'orange' }]}>{chartError}</Text>
          <TouchableOpacity 
            onPress={() => {
              setChartError(null);
              setChartReady(false);
              timeRange === 'realtime' ? fetchRealtimeData(true) : fetchData(true);
            }}
            style={[styles.retryButton, { backgroundColor: color }]}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentData = timeRange === 'realtime' ? realtimeData : historicalData;
    if (!chartReady || !currentData || currentData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="document-text-outline" size={40} color={secondaryTextColor} />
          <Text style={[styles.noDataText, { color: secondaryTextColor }]}>
            No hay datos disponibles
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.chartScrollContainer}
        contentContainerStyle={styles.chartContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chartContainer}>
          {timeRange === 'realtime' && (
            <Text style={[styles.realtimeIndicator, { color }]}>
              ● En vivo
            </Text>
          )}
          {safeRenderChart()}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor,
            width: modalWidth,
            maxHeight: modalHeight,
          }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.timeRangeContainer}>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'realtime' && { backgroundColor: color }]}
              onPress={() => {
                if (timeRange !== 'realtime') {
                  setTimeRange('realtime');
                }
              }}
            >
              <Text style={[styles.timeRangeText, timeRange === 'realtime' && styles.activeTimeRangeText]}>
                LIVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '1d' && { backgroundColor: color }]}
              onPress={() => {
                if (timeRange !== '1d') {
                  setTimeRange('1d');
                }
              }}
            >
              <Text style={[styles.timeRangeText, timeRange === '1d' && styles.activeTimeRangeText]}>1D</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '7d' && { backgroundColor: color }]}
              onPress={() => {
                if (timeRange !== '7d') {
                  setTimeRange('7d');
                }
              }}
            >
              <Text style={[styles.timeRangeText, timeRange === '7d' && styles.activeTimeRangeText]}>7D</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === '30d' && { backgroundColor: color }]}
              onPress={() => {
                if (timeRange !== '30d') {
                  setTimeRange('30d');
                }
              }}
            >
              <Text style={[styles.timeRangeText, timeRange === '30d' && styles.activeTimeRangeText]}>30D</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.currentValueContainer}>
            <Text style={[styles.currentValueLabel, { color: secondaryTextColor }]}>Valor actual:</Text>
            <Text style={[styles.currentValue, { color }]}>{getCurrentValue()}</Text>
          </View>

          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#E0E0E0',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  activeTimeRangeText: {
    color: 'white',
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currentValueLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  currentValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginLeft: 10,
    padding: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  dataPointsInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  noDataText: {
    marginTop: 10,
    textAlign: 'center',
  },
  chartScrollContainer: {
    flexGrow: 0,
  },
  chartContentContainer: {
    flexGrow: 1,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'transparent',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 40,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dotLabel: {
    position: 'absolute',
    fontSize: 10,
    width: 30,
    textAlign: 'center',
  },
  realtimeIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});