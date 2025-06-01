import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, PanResponder, GestureResponderEvent } from 'react-native';
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

// Definición para el tooltip
interface TooltipData {
  value: number;
  timestamp: string;
  index: number;
  x: number;
  y: number;
}

const { width, height } = Dimensions.get('window');
const modalWidth = width * 0.95;
const modalHeight = height * 0.8;
const chartWidth = modalWidth - 40; // Ajustado para mejorar espacio disponible
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
    fontSize: 12,
  },
  yAxisInterval: 1,
  yAxisSuffix: '',
  yAxisLabel: '',
  formatYLabel: (value: string) => value,
  paddingLeft: 40,
  paddingRight: 20,
  paddingTop: 10,
  paddingBottom: 10,
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

  const [realtimeData, setRealtimeData] = useState<DataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  
  const chartRef = useRef(null);
  const [isTouchActive, setIsTouchActive] = useState(false);

  const getCurrentValue = () => {
    const currentData = timeRange === 'realtime' ? realtimeData : historicalData;
    if (!currentData || currentData.length === 0) return '---';
    const lastDataPoint = currentData[currentData.length - 1];
    if (!lastDataPoint || typeof lastDataPoint.value !== 'number') return '---';
    return `${lastDataPoint.value.toFixed(1)}${unit}`;
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      setChartError(null);
      setChartReady(false);
      setTimeRange('realtime');
      fetchRealtimeData(true);
    } else {
      if (realtimeInterval) {
        clearInterval(realtimeInterval);
        setRealtimeInterval(null);
      }
      setRealtimeData([]);
      setHistoricalData([]);
      setChartReady(false);
    }
  }, [visible]);

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

      if (realtimeInterval) {
        clearInterval(realtimeInterval);
      }

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

      let processedData = validData;
      if (validData.length > MAX_DATA_POINTS) {
        const step = Math.floor(validData.length / MAX_DATA_POINTS);
        processedData = validData.filter((_, index) => index % step === 0);
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

      const chartData = {
        labels: validData.map((item, index) => {
          try {
            const date = new Date(item.timestamp);
            if (validData.length > 20) {
              if (index % Math.ceil(validData.length / 5) !== 0) {
                return '';
              }
            }
            
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

      const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt) => {
          handleTouch(evt);
          setIsTouchActive(true);
        },
        onPanResponderMove: (evt) => {
          handleTouch(evt);
        },
        onPanResponderRelease: () => {
          setIsTouchActive(false);
          setTimeout(() => {
            if (!isTouchActive) {
              setTooltipData(null);
            }
          }, 1500);
        },
        onPanResponderTerminate: () => {
          setIsTouchActive(false);
          setTooltipData(null);
        },
      });

      const handleTouch = (evt: GestureResponderEvent) => {
        try {
          const { locationX } = evt.nativeEvent;
          
          const paddingLeft = 55;
          const chartInnerWidth = chartWidth - paddingLeft - 25;
          
          if (locationX >= paddingLeft && locationX <= chartWidth - 25) {
            const touchPositionNormalized = (locationX - paddingLeft) / chartInnerWidth;
            
            const dataIndex = Math.min(
              Math.round(touchPositionNormalized * (validData.length - 1)),
              validData.length - 1
            );
            
            const nearestDataPoint = validData[dataIndex];
            
            const xPos = paddingLeft + (dataIndex / (validData.length - 1)) * chartInnerWidth;
            
            const minValue = Math.min(...validData.map(d => d.value));
            const maxValue = Math.max(...validData.map(d => d.value));
            const valueRange = maxValue - minValue;
            const valueNormalized = (nearestDataPoint.value - minValue) / (valueRange === 0 ? 1 : valueRange);
            const yPos = chartHeight - (valueNormalized * (chartHeight - 40)) - 20;
            
            setTooltipData({
              value: nearestDataPoint.value,
              timestamp: nearestDataPoint.timestamp,
              index: dataIndex,
              x: xPos,
              y: yPos,
            });
          }
        } catch (error) {
          console.error("Error al procesar el toque en la gráfica:", error);
        }
      };

      return (
        <View style={styles.chartWrapper} {...panResponder.panHandlers}>
          <LineChart
            ref={chartRef}
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
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                strokeWidth: 1,
                stroke: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              },
              paddingLeft: 55,
              paddingRight: 25,
              paddingTop: 20,
              paddingBottom: 15,
              formatYLabel: (value) => {
                const num = parseFloat(value);
                return Number.isInteger(num) ? num.toString() : num.toFixed(1);
              },
            }}
            bezier
            style={styles.chart}
            withDots={validData.length < 50}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            yAxisSuffix={unit}
            yAxisInterval={4}
            onDataPointClick={(data) => {
              setTooltipData({
                value: data.value,
                timestamp: validData[data.index].timestamp,
                index: data.index,
                x: data.x,
                y: data.y,
              });
            }}
            decorator={() => {
              return tooltipData ? (
                <View
                  style={[
                    styles.tooltipIndicator,
                    {
                      left: tooltipData.x - 1,
                      top: 0,
                      height: chartHeight - 20,
                    },
                  ]}
                />
              ) : null;
            }}
          />
          {tooltipData && (
            <View style={[styles.tooltip, { top: tooltipData.y - 50, left: Math.max(8, Math.min(modalWidth - 130, tooltipData.x - 50)) }]}>
              <Text style={styles.tooltipText}>
                {tooltipData.value.toFixed(1)}{unit}
              </Text>
              <Text style={styles.tooltipText}>
                {new Date(tooltipData.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
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
    paddingLeft: 10,
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
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 120,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
  },
  tooltipIndicator: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});