// app/services/PlantixService.js - Actualizado para Plant.id API
import AsyncStorage from '@react-native-async-storage/async-storage';

class PlantixService {
    constructor() {
        this.baseURL = 'https://api.plant.id/v3';
        this.apiKey = 'YQ4ffusNIz3llHYjqrZS9Rfv5VhXuNreLQlrHf5zE1BsgBcB7v'; // Tu API key real
    }

    /**
     * Analiza una imagen de planta para detectar enfermedades e identificar la planta
     * @param {string} imageUri - URI de la imagen a analizar
     * @param {boolean} fromGallery - Si la imagen viene de la galería
     * @returns {Promise} Resultado del análisis
     */
    async analyzeImage(imageUri, fromGallery = false) {
        try {
            console.log('🔍 Iniciando análisis con Plant.id API...');
            console.log('📷 URI de imagen:', imageUri);

            // Preparar los datos para la API
            const requestData = {
                images: [imageUri],
                similar_images: true,
                plant_details: [
                    "common_names",
                    "url",
                    "name_authority",
                    "wiki_description",
                    "taxonomy"
                ],
                // Modelos de análisis
                modifiers: ["crops_fast", "similar_images"],
                plant_language: "es"
            };

            console.log('📤 Enviando datos a Plant.id:', JSON.stringify(requestData, null, 2));

            const response = await fetch(`${this.baseURL}/identification`, {
                method: 'POST',
                headers: {
                    'Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            console.log('📡 Respuesta HTTP status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error de API:', errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('📊 Resultado completo de Plant.id:', JSON.stringify(result, null, 2));

            return this.processAnalysisResult(result, fromGallery);
        } catch (error) {
            console.error('❌ Error al analizar imagen con Plant.id:', error);
            throw new Error(`Error de conexión: ${error.message}`);
        }
    }

    /**
     * Procesa el resultado del análisis para formato más amigable
     * @param {Object} rawResult - Resultado crudo de la API
     * @param {boolean} fromGallery - Si viene de galería
     * @returns {Object} Resultado procesado
     */
    processAnalysisResult(rawResult, fromGallery = false) {
        try {
            console.log('🔄 Procesando resultado de Plant.id...');

            // Verificar si hay sugerencias de plantas
            const suggestions = rawResult.result?.classification?.suggestions || [];
            const isPlantDetected = suggestions.length > 0;

            // Información de la planta identificada
            const plantInfo = suggestions.slice(0, 3).map(suggestion => ({
                name: suggestion.name || 'Desconocida',
                probability: suggestion.probability || 0,
                commonNames: suggestion.details?.common_names || [],
                description: suggestion.details?.wiki_description?.value || ''
            }));

            // Determinar salud de la planta
            let cropHealth = 'unknown';
            let diseases = [];
            let confidence = 0;

            if (isPlantDetected && suggestions.length > 0) {
                const topSuggestion = suggestions[0];
                confidence = topSuggestion.probability || 0;

                // Simular análisis de salud basado en la confianza
                if (confidence > 0.8) {
                    cropHealth = 'healthy';
                } else if (confidence > 0.5) {
                    cropHealth = 'unhealthy';
                    // Generar enfermedades simuladas para demostración
                    diseases = this.generateSimulatedDiseases();
                } else {
                    cropHealth = 'unknown';
                }
            }

            const processedResult = {
                cropHealth,
                diseases,
                recommendations: this.generateRecommendations(cropHealth, diseases),
                confidence,
                analysisDate: new Date().toISOString(),
                isPlantDetected,
                plantInfo,
                source: fromGallery ? 'galería' : 'cámara',
                rawData: rawResult // Para debugging
            };

            console.log('✅ Resultado procesado:', JSON.stringify(processedResult, null, 2));
            return processedResult;

        } catch (error) {
            console.error('❌ Error al procesar resultado:', error);
            throw new Error(`Error al procesar: ${error.message}`);
        }
    }

    /**
     * Genera enfermedades simuladas (Plant.id no siempre detecta enfermedades específicas)
     * @returns {Array} Lista de enfermedades simuladas
     */
    generateSimulatedDiseases() {
        const diseases = [
            {
                name: 'Posible estrés hídrico',
                probability: 0.7,
                severity: 'media',
                description: 'La planta podría mostrar signos de estrés por falta o exceso de agua'
            },
            {
                name: 'Deficiencia nutricional leve',
                probability: 0.6,
                severity: 'baja',
                description: 'Posibles signos de carencia de nutrientes en las hojas'
            }
        ];

        // Retornar 0-2 enfermedades aleatoriamente
        const numDiseases = Math.floor(Math.random() * 3);
        return diseases.slice(0, numDiseases);
    }

    /**
     * Calcula la severidad basada en la probabilidad
     * @param {number} probability - Probabilidad de la enfermedad
     * @returns {string} Nivel de severidad
     */
    calculateSeverity(probability) {
        if (probability >= 0.8) return 'crítica';
        if (probability >= 0.6) return 'alta';
        if (probability >= 0.4) return 'media';
        if (probability >= 0.2) return 'baja';
        return 'mínima';
    }

    /**
     * Genera recomendaciones basadas en el análisis
     * @param {string} cropHealth - Estado de salud de la planta
     * @param {Array} diseases - Lista de enfermedades detectadas
     * @returns {Array} Lista de recomendaciones
     */
    generateRecommendations(cropHealth, diseases = []) {
        const recommendations = [];
        
        if (cropHealth === 'unhealthy' && diseases.length > 0) {
            recommendations.push('🔍 Se detectaron posibles problemas en la planta');
            recommendations.push('💧 Revisa los niveles de humedad y riego');
            recommendations.push('🌡️ Verifica la temperatura del ambiente');
            recommendations.push('💡 Ajusta la iluminación si es necesario');
            recommendations.push('🌱 Considera fertilizar con nutrientes apropiados');
        } else if (cropHealth === 'healthy') {
            recommendations.push('✅ La planta se ve saludable');
            recommendations.push('🔄 Mantén las condiciones actuales de cuidado');
            recommendations.push('📊 Continúa monitoreando regularmente');
            recommendations.push('💧 Mantén un riego constante y apropiado');
        } else {
            recommendations.push('❓ Imagen no clara - intenta con mejor iluminación');
            recommendations.push('📷 Acércate más a la planta para mejor análisis');
            recommendations.push('🌿 Enfoca las hojas o partes problemáticas');
        }

        return recommendations;
    }

    /**
     * Obtiene el historial de análisis
     * @returns {Promise<Array>} Historial de análisis
     */
    async getAnalysisHistory() {
        try {
            const history = await AsyncStorage.getItem('plant_analysis_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error al obtener historial:', error);
            return [];
        }
    }

    /**
     * Guarda un análisis en el historial
     * @param {Object} analysis - Resultado del análisis
     */
    async saveAnalysisToHistory(analysis) {
        try {
            const history = await this.getAnalysisHistory();
            const newAnalysis = {
                ...analysis,
                id: Date.now().toString(),
                timestamp: Date.now()
            };
            
            const newHistory = [newAnalysis, ...history.slice(0, 49)]; // Mantener últimos 50
            await AsyncStorage.setItem('plant_analysis_history', JSON.stringify(newHistory));
            console.log('✅ Análisis guardado en historial');
        } catch (error) {
            console.error('Error al guardar historial:', error);
        }
    }

    /**
     * Limpia el historial de análisis
     */
    async clearHistory() {
        try {
            await AsyncStorage.removeItem('plant_analysis_history');
            console.log('🗑️ Historial limpiado');
        } catch (error) {
            console.error('Error al limpiar historial:', error);
        }
    }

    /**
     * Obtiene estadísticas del uso de la API
     * @returns {Promise<Object>} Estadísticas de uso
     */
    async getUsageStats() {
        try {
            const history = await this.getAnalysisHistory();
            const today = new Date().toDateString();
            const thisMonth = new Date().getMonth();
            
            const todayCount = history.filter(item => 
                new Date(item.timestamp).toDateString() === today
            ).length;
            
            const monthCount = history.filter(item => 
                new Date(item.timestamp).getMonth() === thisMonth
            ).length;

            return {
                totalAnalyses: history.length,
                todayAnalyses: todayCount,
                monthAnalyses: monthCount,
                lastAnalysis: history[0]?.timestamp || null
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return {
                totalAnalyses: 0,
                todayAnalyses: 0,
                monthAnalyses: 0,
                lastAnalysis: null
            };
        }
    }
}

export default new PlantixService();