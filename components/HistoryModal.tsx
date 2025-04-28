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

export default function HistoryModal({ visible, onClose, title, color, metric, unit }: HistoryModalProps) {
  const { theme } = useTheme();
  const backgroundColor = theme === 'dark' ? '#1F1F1F' : '#FFFFFF';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault');
  
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'realtime' | '1d' | '7d' | '30d'>('1d');
  const [realtimeInterval, setRealtimeInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Limpiar el intervalo cuando se cierra el modal
  useEffect(() => {
    if (!visible && realtimeInterval) {
      clearInterval(realtimeInterval);
      setRealtimeInterval(null);
    }
  }, [visible]);

  // Cargar datos históricos iniciales
  useEffect(() => {
    if (visible && metric) {
      if (timeRange === 'realtime') {
        fetchRealtimeData();
      } else {
        fetchData();
      }
    }
    return () => {
      if (realtimeInterval) {
        clearInterval(realtimeInterval);
        setRealtimeInterval(null);
      }
    };
  }, [visible, metric, timeRange]);

  const fetchRealtimeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener los últimos 10 valores primero
      const historyResponse = await fetch('https://servidorhydroplas.onrender.com/api/history');
      if (!historyResponse.ok) {
        throw new Error('Error al obtener datos históricos');
      }
      
      const historyData = await historyResponse.json();
      const initialData = historyData.map((item: any) => ({
        timestamp: item.timestamp,
        value: item[metric] || 0
      })).slice(-REAL_TIME_MAX_POINTS);
      
      setData(initialData);
      setLoading(false);

      // Configurar actualización en tiempo real
      if (realtimeInterval) {
        clearInterval(realtimeInterval);
      }

      const interval = setInterval(async () => {
        try {
          const response = await fetch('https://servidorhydroplas.onrender.com/api/last-reading');
          if (!response.ok) {
            throw new Error('Error al obtener último valor');
          }

          const lastReading = await response.json();
          setData(prevData => {
            const newData = [...prevData, {
              timestamp: lastReading.timestamp,
              value: lastReading[metric] || 0
            }];
            // Mantener solo los últimos REAL_TIME_MAX_POINTS puntos
            if (newData.length > REAL_TIME_MAX_POINTS) {
              return newData.slice(-REAL_TIME_MAX_POINTS);
            }
            return newData;
          });
        } catch (err) {
          console.error('Error en actualización en tiempo real:', err);
        }
      }, 5000);

      setRealtimeInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching realtime data:', err);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      if (timeRange === '1d') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (timeRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }
      
      // Formatear las fechas como YYYY-MM-DD
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const url = `https://servidorhydroplas.onrender.com/api/data-by-date-range?start_date=${formattedStartDate}&end_date=${formattedEndDate}&column=${metric}`;
      
      console.log('Fetching data from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al obtener datos');
      }
      
      const result = await response.json();
      console.log(`Received ${result.length} data points`);
      
      // Reducir la cantidad de datos para la gráfica
      let transformedData: DataPoint[] = [];
      if (result.length > MAX_DATA_POINTS) {
        const step = Math.floor(result.length / MAX_DATA_POINTS);
        for (let i = 0; i < result.length; i += step) {
          transformedData.push({
            timestamp: result[i].timestamp,
            value: result[i][metric] || 0
          });
        }
        // Asegurar que siempre incluimos el último punto
        const lastPoint = result[result.length - 1];
        transformedData.push({
          timestamp: lastPoint.timestamp,
          value: lastPoint[metric] || 0
        });
      } else {
        transformedData = result.map((item: any) => ({
          timestamp: item.timestamp,
          value: item[metric] || 0
        }));
      }
      
      console.log(`Reduced to ${transformedData.length} data points for chart`);
      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshData = () => {
    fetchData();
  };
  
  // Preparar datos para la gráfica
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.timestamp);
      if (timeRange === '1h') {
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      } else if (timeRange === '24h') {
        return `${date.getHours()}:00`;
      } else {
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      }
    }),
    datasets: [
      {
        data: data.map(item => item.value),
        color: () => color,
        strokeWidth: 2
      }
    ]
  };
  
  const chartConfig = {
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 1,
    color: () => color,
    labelColor: () => secondaryTextColor,
    style: {
      borderRadius: 16,
      paddingRight: 0,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color
    },
    strokeWidth: 2,
    fillShadowGradientTo: color,
    fillShadowGradientFrom: `${color}33`,
    propsForBackgroundLines: {
      strokeDasharray: [],
      strokeWidth: 0.5,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return (num/1000).toFixed(1) + 'k';
      }
      return Math.round(parseFloat(value)).toString(); // Redondeando valores para ahorrar espacio
    },
    propsForLabels: {
      fontSize: '10',
    },
  };
  
  const getCurrentValue = () => {
    if (data.length > 0) {
      const latestData = data[data.length - 1];
      return `${latestData.value}${unit}`;
    }
    return 'N/A';
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
            <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={color} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={color} />
              <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
                {timeRange === 'realtime' 
                  ? 'Iniciando monitoreo en tiempo real...'
                  : 'Cargando datos históricos...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="red" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={refreshData} style={[styles.retryButton, { backgroundColor: color }]}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Ionicons name="document-text-outline" size={40} color={secondaryTextColor} />
              <Text style={[styles.noDataText, { color: secondaryTextColor }]}>No hay datos disponibles</Text>
            </View>
          ) : (
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
                <Text style={[styles.dataPointsInfo, { color: secondaryTextColor }]}>
                  Mostrando {data.length} puntos de datos
                </Text>
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={chartHeight}
                  chartConfig={chartConfig}
                  bezier
                  style={[styles.chart, { paddingLeft: 10 }]}
                  yAxisSuffix={unit}
                  yAxisInterval={1}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={false}
                  segments={5}
                  formatXLabel={(value) => {
                    const index = parseInt(value);
                    // Solo mostrar 10 etiquetas distribuidas uniformemente
                    if (data.length > 10 && index % Math.ceil(data.length / 10) !== 0) {
                      return '';
                    }
                    const date = new Date(data[index]?.timestamp || '');
                    if (timeRange === 'realtime') {
                      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                    } else if (timeRange === '1d') {
                      return `${date.getHours()}h`;
                    } else {
                      return (date.getDate() + '/' + (date.getMonth() + 1));
                    }
                  }}
                  getDotColor={(dataPoint) => color}
                  withShadow={false}
                  withDots={data.length < 50}
                  renderDotContent={({ x, y, index }) => {
                    if (data.length < 10 || index % Math.floor(data.length / 5) === 0) {
                      return (
                        <Text
                          key={index}
                          style={[
                            styles.dotLabel,
                            { color: textColor, top: y - 15, left: x - 15 }
                          ]}
                        >
                          {Math.round(data[index]?.value)}
                        </Text>
                      );
                    }
                    return null;
                  }}
                />
              </View>
            </ScrollView>
          )}
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 40,
    paddingTop: 10,
    marginRight: 10, // Añadir margen derecho
    paddingBottom: 20, // Añadir espacio para las etiquetas del eje X
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