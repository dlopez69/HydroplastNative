// app/services/PlantixService.js
class PlantixService {
    constructor() {
        this.baseURL = 'https://api.plantix.net/v2';
        this.apiKey = 'YOUR_API_KEY_HERE'; // Reemplaza con tu API key
    }

    /**
     * Analiza una imagen de planta para detectar enfermedades
     * @param {string} imageUri - URI de la imagen a analizar
     * @param {boolean} useImageGallery - Si usar galería de imágenes
     * @returns {Promise} Resultado del análisis
     */
    async analyzeImage(imageUri, useImageGallery = false) {
        try {
            const formData = new FormData();
            
            // Preparar la imagen
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'plant-image.jpg',
            });
            
            formData.append('application_used_image_gallery', useImageGallery.toString());

            const response = await fetch(`${this.baseURL}/image_analysis`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            return this.processAnalysisResult(result);
        } catch (error) {
            console.error('Error al analizar imagen con Plantix:', error);
            throw error;
        }
    }

    /**
     * Procesa el resultado del análisis para formato más amigable
     * @param {Object} rawResult - Resultado crudo de la API
     * @returns {Object} Resultado procesado
     */
    processAnalysisResult(rawResult) {
        return {
            cropHealth: rawResult.crop_health || 'unknown',
            diseases: rawResult.crops?.map(crop => ({
                name: crop.name,
                probability: crop.probability,
                description: crop.description,
                treatment: crop.treatment_recommendations || [],
                severity: this.calculateSeverity(crop.probability)
            })) || [],
            recommendations: this.generateRecommendations(rawResult),
            analysisDate: new Date().toISOString(),
            confidence: this.calculateOverallConfidence(rawResult)
        };
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
     * Calcula la confianza general del análisis
     * @param {Object} result - Resultado del análisis
     * @returns {number} Nivel de confianza (0-1)
     */
    calculateOverallConfidence(result) {
        if (!result.crops || result.crops.length === 0) return 0;
        
        const avgProbability = result.crops.reduce((sum, crop) => 
            sum + (crop.probability || 0), 0) / result.crops.length;
        
        return Math.round(avgProbability * 100) / 100;
    }

    /**
     * Genera recomendaciones basadas en el análisis
     * @param {Object} result - Resultado del análisis
     * @returns {Array} Lista de recomendaciones
     */
    generateRecommendations(result) {
        const recommendations = [];
        
        if (result.crop_health === 'unhealthy') {
            recommendations.push('🔍 Se detectaron posibles problemas en la planta');
            recommendations.push('💧 Revisa los niveles de humedad y nutrientes');
            recommendations.push('🌡️ Verifica la temperatura del ambiente');
            recommendations.push('💡 Ajusta la iluminación si es necesario');
        } else if (result.crop_health === 'healthy') {
            recommendations.push('✅ La planta se ve saludable');
            recommendations.push('🔄 Mantén las condiciones actuales');
            recommendations.push('📊 Continúa monitoreando regularmente');
        }

        return recommendations;
    }

    /**
     * Obtiene el historial de análisis (simulado - implementar con AsyncStorage)
     * @returns {Promise<Array>} Historial de análisis
     */
    async getAnalysisHistory() {
        // Implementar con AsyncStorage o base de datos local
        try {
            const history = await AsyncStorage.getItem('plantix_history');
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
            const newHistory = [analysis, ...history.slice(0, 49)]; // Mantener últimos 50
            await AsyncStorage.setItem('plantix_history', JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error al guardar historial:', error);
        }
    }
}

export default new PlantixService();