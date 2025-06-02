// app/components/PlantAnalyzer.tsx - Compatible con SDK 53
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/hooks/ThemeContext';
// import PlantixService from '@/services/PlantixService'; // Activar cuando tengas API key

const PlantAnalyzer = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [useRealAPI, setUseRealAPI] = useState(false);
    const [facing, setFacing] = useState<'front' | 'back'>('back'); // ← NUEVO: Estado para cámara
    
    // SDK 53: Nuevo hook para permisos de cámara
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const primaryColor = useThemeColor({}, "tint");
    const cardColor = theme === "dark" ? "#1F1F1F" : "#F7F9FC";
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");
    const borderColor = theme === "dark" ? "#2D2D2D" : "#E0E5EC";

    // Función para cambiar cámara
    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // SDK 53: Manejo de permisos actualizado
    const requestCameraPermission = async () => {
        if (!permission) {
            const result = await requestPermission();
            return result.granted;
        }
        
        if (!permission.granted) {
            Alert.alert('Permisos', 'Se necesitan permisos de cámara para esta función');
            return false;
        }
        return true;
    };

    // SDK 53: Función actualizada para tomar foto
    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        if (cameraRef.current) {
            try {
                console.log('📸 Tomando foto...');
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipProcessing: false
                });
                console.log('✅ Foto tomada:', photo.uri);
                setSelectedImage(photo.uri);
                setShowCamera(false);
                analyzeImage(photo.uri);
            } catch (error) {
                console.error('Error al tomar foto:', error);
                Alert.alert(
                    'Error', 
                    'No se pudo tomar la foto. Asegúrate de que la cámara esté lista.',
                    [
                        { text: 'Reintentar', onPress: takePhoto },
                        { text: 'Cancelar' }
                    ]
                );
            }
        } else {
            Alert.alert('Error', 'La cámara no está lista. Intenta nuevamente.');
        }
    };

    // Seleccionar imagen de la galería
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos', 'Se necesitan permisos para acceder a las fotos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // ← ACTUALIZADO
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setSelectedImage(imageUri);
            analyzeImage(imageUri, true);
        }
    };

    // Type definitions
    interface Disease {
        name: string;
        probability: number;
        severity: 'crítica' | 'alta' | 'media' | 'baja';
        description: string;
    }

    interface AnalysisResult {
        cropHealth: 'healthy' | 'unhealthy';
        diseases: Disease[];
        recommendations: string[];
        confidence: number;
    }

    const analyzeImage = async (imageUri: string, fromGallery: boolean = false): Promise<void> => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            if (useRealAPI) {
                // ✅ USAR API REAL DE PLANTIX (cuando esté configurada)
                console.log('🔍 Analizando con API real de Plantix...');
                // const result = await PlantixService.analyzeImage(imageUri, fromGallery);
                // setAnalysisResult(result);
                
                // Por ahora, mostrar que no está configurada
                Alert.alert(
                    'API no configurada',
                    'Configura tu API key de Plantix en PlantixService.js',
                    [{ text: 'OK' }]
                );
                setIsAnalyzing(false);
                return;
            } else {
                // 🧪 MODO SIMULACIÓN (Para desarrollo/testing)
                console.log('🧪 Re-analizando imagen con datos simulados...');
                setTimeout(() => {
                    // Generar resultados aleatorios diferentes cada vez
                    const healthOptions = ['healthy', 'unhealthy'];
                    const diseaseNames = [
                        'Mancha foliar simulada',
                        'Mildiu simulado', 
                        'Roya simulada',
                        'Antracnosis simulada',
                        'Virus del mosaico simulado'
                    ];
                    const severityLevels: ('crítica' | 'alta' | 'media' | 'baja')[] = ['crítica', 'alta', 'media', 'baja'];
                    
                    const randomHealth = healthOptions[Math.floor(Math.random() * healthOptions.length)] as 'healthy' | 'unhealthy';
                    const hasDisease = Math.random() > 0.4; // 60% chance of disease
                    
                    const mockResult: AnalysisResult = {
                        cropHealth: randomHealth,
                        diseases: hasDisease ? [
                            {
                                name: diseaseNames[Math.floor(Math.random() * diseaseNames.length)],
                                probability: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
                                severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
                                description: 'Simulación: Análisis generado aleatoriamente para demostración'
                            }
                        ] : [],
                        recommendations: [
                            '💧 [DEMO] Ajustar niveles de humedad',
                            '🌡️ [DEMO] Verificar temperatura',
                            '💡 [DEMO] Optimizar iluminación',
                            '🌱 [DEMO] Revisar nutrientes',
                            '🔍 [DEMO] Monitorear crecimiento'
                        ].sort(() => 0.5 - Math.random()).slice(0, 3), // 3 recomendaciones aleatorias
                        confidence: Math.random() * 0.4 + 0.6 // 0.6 - 1.0
                    };
                    
                    setAnalysisResult(mockResult);
                    setIsAnalyzing(false);

                    if (mockResult.diseases.length > 0) {
                        Alert.alert(
                            '🧪 Re-análisis Completado',
                            `Nuevo resultado: ${mockResult.diseases[0].name} (${mockResult.diseases[0].severity})`,
                            [{ text: 'OK' }]
                        );
                    } else {
                        Alert.alert(
                            '✅ Re-análisis Completado',
                            'Esta vez no se detectaron problemas en la planta.',
                            [{ text: 'OK' }]
                        );
                    }
                }, 1500); // Slightly faster for re-analysis
                return;
            }

        } catch (error) {
            console.error('Error en análisis:', error);
            Alert.alert(
                'Error en Análisis',
                'Ocurrió un error durante el análisis. Intenta nuevamente.',
                [
                    { text: 'Reintentar', onPress: () => analyzeImage(imageUri, fromGallery) },
                    { text: 'Cancelar' }
                ]
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Obtener color según severidad
    const getSeverityColor = (severity: 'crítica' | 'alta' | 'media' | 'baja'): string => {
        const severityColors = {
            'crítica': '#F44336',
            'alta': '#FF9800',
            'media': '#FFC107',
            'baja': '#8BC34A'
        };
        
        return severityColors[severity] || '#4CAF50';
    };

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <View style={[styles.analysisSection, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <Text style={[styles.title, { color: textColor }]}>🔬 Análisis de Plantas IA</Text>
                
                {/* Toggle para API Real */}
                <View style={styles.toggleContainer}>
                    <Text style={[styles.toggleLabel, { color: secondaryTextColor }]}>
                        {useRealAPI ? '🌐 API Real' : '🧪 Simulación'}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            { backgroundColor: useRealAPI ? '#4CAF50' : '#9E9E9E' }
                        ]}
                        onPress={() => setUseRealAPI(!useRealAPI)}
                    >
                        <Text style={styles.toggleButtonText}>
                            {useRealAPI ? 'ON' : 'OFF'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.description, { color: secondaryTextColor }]}>
                        {useRealAPI 
                            ? 'Conectado a Plantix IA para análisis profesional'
                            : 'Modo demostración con datos simulados'
                        }
                    </Text>

                    {/* Botones de acción */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: primaryColor }]}
                            onPress={() => setShowCamera(true)}
                            disabled={isAnalyzing}
                        >
                            <Text style={[styles.buttonText, { color: theme === 'dark' ? 'white' : 'black' }]
                            }>📷 Cámara</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: primaryColor }]}
                            onPress={pickImage}
                            disabled={isAnalyzing}
                        >
                            <Text style={[styles.buttonText, { color: theme === 'dark' ? 'white' : 'black' }]}>🖼️ Galería</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Imagen seleccionada */}
                    {selectedImage && (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity 
                                onPress={() => analyzeImage(selectedImage, false)}
                                disabled={isAnalyzing}
                                style={styles.imageButton}
                            >
                                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                                {/* Overlay con icono de re-análisis */}
                                <View style={styles.imageOverlay}>
                                    {isAnalyzing ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <View style={styles.reAnalyzeIcon}>
                                            <Text style={styles.reAnalyzeText}>🔄</Text>
                                            <Text style={styles.reAnalyzeLabel}>Tocar para re-analizar</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Indicador de carga */}
                    {isAnalyzing && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={primaryColor} />
                            <Text style={[styles.loadingText, { color: textColor }]}>
                                {useRealAPI ? 'Analizando con Plantix IA...' : 'Simulando análisis...'}
                            </Text>
                        </View>
                    )}

                    {/* Resultado del análisis */}
                    {analysisResult && (
                        <View style={[styles.resultContainer, { backgroundColor: cardColor }]}>
                            <Text style={[styles.resultTitle, { color: textColor }]}>
                                📊 Resultado {useRealAPI ? '(Real)' : '(Simulado)'}
                            </Text>

                            {/* Estado general */}
                            <View style={styles.healthStatus}>
                                <Text style={[styles.healthLabel, { color: textColor }]}>
                                    Estado:
                                </Text>
                                <Text style={[
                                    styles.healthValue,
                                    {
                                        color: analysisResult.cropHealth === 'healthy' ? '#4CAF50' : '#F44336'
                                    }
                                ]}>
                                    {analysisResult.cropHealth === 'healthy' ? '✅ Saludable' : '⚠️ Problemas'}
                                </Text>
                            </View>

                            {/* Confianza */}
                            <Text style={[styles.confidence, { color: secondaryTextColor }]}>
                                Confianza: {(analysisResult.confidence * 100).toFixed(0)}%
                            </Text>

                            {/* Enfermedades detectadas */}
                            {analysisResult.diseases.length > 0 && (
                                <View style={styles.diseasesSection}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                                        🦠 Problemas detectados:
                                    </Text>
                                    {analysisResult.diseases.map((disease, index) => (
                                        <View key={index} style={styles.diseaseItem}>
                                            <Text style={[styles.diseaseName, { color: textColor }]}>
                                                • {disease.name}
                                            </Text>
                                            <Text style={[
                                                styles.diseaseSeverity,
                                                { color: getSeverityColor(disease.severity) }
                                            ]}>
                                                ({disease.severity})
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Recomendaciones */}
                            {analysisResult.recommendations.length > 0 && (
                                <View style={styles.recommendationsSection}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                                        💡 Recomendaciones:
                                    </Text>
                                    {analysisResult.recommendations.slice(0, 2).map((rec, index) => (
                                        <Text key={index} style={[styles.recommendation, { color: secondaryTextColor }]}>
                                            • {rec}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Modal de cámara - SDK 53 Compatible */}
            <Modal visible={showCamera} animationType="slide">
                <View style={styles.cameraContainer}>
                    {permission?.granted ? (
                        <CameraView
                            style={styles.camera}
                            facing={facing} // ← ACTUALIZADO: usar el estado
                            ref={cameraRef}
                            onCameraReady={() => console.log('📷 Cámara lista')}
                        >
                            {/* Controles superpuestos con posición absoluta */}
                            <View style={styles.cameraOverlay}>
                                {/* Header con botón de cambiar cámara */}
                                <View style={styles.cameraHeader}>
                                    <TouchableOpacity
                                        style={styles.flipButton}
                                        onPress={toggleCameraFacing}
                                    >
                                        <Text style={styles.flipButtonText}>🔄</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.cameraIndicator}>
                                        {facing === 'back' ? '📱 Trasera' : '🤳 Frontal'}
                                    </Text>
                                </View>

                                <View style={styles.cameraControls}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowCamera(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={styles.captureButton}
                                        onPress={takePhoto}
                                    >
                                        <Text style={styles.captureButtonText}>📸</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </CameraView>
                    ) : (
                        <View style={styles.permissionContainer}>
                            <Text style={styles.permissionText}>
                                Se necesitan permisos de cámara
                            </Text>
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={requestPermission}
                            >
                                <Text style={styles.permissionButtonText}>
                                    Conceder Permisos
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    analysisSection: {
        width: "100%",
        marginBottom: 24,
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        minWidth: 50,
    },
    toggleButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 12,
    },
    content: {
        padding: 4,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 14,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    imageButton: {
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    selectedImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    reAnalyzeIcon: {
        alignItems: 'center',
    },
    reAnalyzeText: {
        fontSize: 20,
        marginBottom: 4,
    },
    reAnalyzeLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
    },
    resultContainer: {
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    healthStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    healthLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    healthValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    confidence: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 8,
    },
    diseasesSection: {
        marginBottom: 8,
    },
    diseaseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    diseaseName: {
        fontSize: 13,
        flex: 1,
    },
    diseaseSeverity: {
        fontSize: 12,
        fontWeight: '500',
    },
    recommendationsSection: {
        marginBottom: 8,
    },
    recommendation: {
        fontSize: 12,
        marginBottom: 2,
        lineHeight: 16,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between', // ← CAMBIADO: espacio entre header y controles
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60, // Para evitar el notch
        paddingHorizontal: 20,
    },
    flipButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 12,
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButtonText: {
        fontSize: 20,
        color: 'white',
    },
    cameraIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 64,
        marginBottom: 100,
    },
    cancelButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
    },
    captureButton: {
        backgroundColor: 'white',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonText: {
        fontSize: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PlantAnalyzer;