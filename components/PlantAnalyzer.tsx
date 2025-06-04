// app/components/PlantAnalyzer.tsx - Con API Real de Plant.id
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    LogBox,
    Linking // Added Linking
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/hooks/ThemeContext';
import PlantixService from '../app/services/PlantixService';

// Ignorar warnings específicos
LogBox.ignoreLogs([
    'Text strings must be rendered within a <Text> component',
    'Warning: Text strings must be rendered within a <Text> component'
]);

const PlantAnalyzer = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [useRealAPI, setUseRealAPI] = useState(true); // CAMBIADO: Activar API real por defecto
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [isCameraReady, setIsCameraReady] = useState(false);
    
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);

    const { theme } = useTheme();
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const primaryColor = useThemeColor({}, "tint");
    const cardColor = theme === "dark" ? "#1F1F1F" : "#F7F9FC";
    const secondaryTextColor = useThemeColor({}, "tabIconDefault");
    const borderColor = theme === "dark" ? "#2D2D2D" : "#E0E5EC";

    // Type definitions - ACTUALIZADO para Plant.id
    interface Disease {
        name: string;
        probability: number;
        severity: 'crítica' | 'alta' | 'media' | 'baja';
        description: string;
        treatment?: string[];
    }

    interface AnalysisResult {
        cropHealth: 'healthy' | 'unhealthy' | 'unknown';
        diseases: Disease[];
        recommendations: string[];
        confidence: number;
        analysisDate?: string;
        isPlantDetected?: boolean;
        plantInfo?: {
            name: string;
            probability: number;
        }[];
    }

    useEffect(() => {
        if (!showCamera) {
            setIsCameraReady(false);
        }
    }, [showCamera]);

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const requestCameraPermission = async () => {
        try {
            let currentPermission = permission; // permission object from the useCameraPermissions hook's state

            if (!currentPermission?.granted) { // If not already granted
                if (currentPermission?.canAskAgain === false) { // Cannot ask again, must go to settings
                    console.log('❌ Permisos de cámara denegados permanentemente. Guiando a configuración.');
                    Alert.alert(
                        'Permisos Requeridos',
                        'Los permisos de cámara fueron denegados permanentemente. Debe habilitarlos desde la configuración de la aplicación para usar la cámara.',
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                                text: 'Abrir Configuración',
                                onPress: () => Linking.openSettings()
                            }
                        ]
                    );
                    return false;
                }

                // If we can ask again (or it's the first time asking)
                console.log('🔍 Solicitando permisos de cámara...');
                const newPermissionStatus = await requestPermission(); // requestPermission function from the hook

                if (!newPermissionStatus.granted) {
                    console.log('❌ Permisos de cámara denegados por el usuario tras solicitud.');
                    // Alert even if canAskAgain is true, because the user just denied it.
                    Alert.alert(
                        'Permisos Denegados',
                        'Se necesitan permisos de cámara para esta función. Puede intentar de nuevo o habilitarlos en la configuración.',
                        [
                            { text: 'OK', style: 'cancel' },
                            // Optionally, add settings button here too if canAskAgain is now false
                            // However, the next click will hit the "denied permanently" case if canAskAgain became false.
                        ]
                    );
                    return false;
                }
                console.log('✅ Permisos de cámara concedidos tras solicitud.');
                return true;
            }

            // If already granted (currentPermission.granted was true)
            console.log('✅ Permisos de cámara ya estaban concedidos.');
            return true;

        } catch (error) {
            console.error('Error al solicitar permisos de cámara:', error);
            Alert.alert('Error de Permisos', 'Ocurrió un error al solicitar los permisos de cámara. Por favor, inténtelo de nuevo.');
            return false;
        }
    };

    const openCamera = async () => {
        try {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                return;
            }

            console.log('📱 Abriendo cámara...');
            setIsCameraReady(false);
            setShowCamera(true);
        } catch (error) {
            console.error('Error al abrir cámara:', error);
            Alert.alert('Error', 'No se pudo abrir la cámara');
        }
    };

    const takePhoto = async () => {
        if (!isCameraReady) {
            Alert.alert('Espera', 'La cámara aún se está iniciando...');
            return;
        }

        if (!cameraRef.current) {
            Alert.alert('Error', 'Cámara no disponible');
            return;
        }

        try {
            console.log('📸 Tomando foto...');
            
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8, // Mejor calidad para API real
                base64: false,
                skipProcessing: true,
                exif: false,
                onPictureSaved: undefined
            });

            if (!photo || !photo.uri) {
                throw new Error('URI de foto no válida');
            }

            console.log('✅ Foto tomada exitosamente:', photo.uri);
            
            setSelectedImage(photo.uri);
            setShowCamera(false);
            setTimeout(() => {
                analyzeImage(photo.uri);
            }, 500);
            
        } catch (error) {
            console.error('❌ Error al tomar foto:', error);
            Alert.alert(
                'Error de Cámara', 
                'No se pudo capturar la imagen. Intenta cerrar y abrir la cámara nuevamente.',
                [
                    { 
                        text: 'Reintentar', 
                        onPress: () => {
                            setShowCamera(false);
                            setTimeout(() => openCamera(), 1000);
                        }
                    },
                    { text: 'Cancelar', onPress: () => setShowCamera(false) }
                ]
            );
        }
    };

    const pickImage = async () => {
        try {
            console.log('🖼️ Solicitando permisos de galería...');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permisos Requeridos', 
                    'Se necesitan permisos para acceder a las fotos'
                );
                return;
            }

            console.log('📱 Abriendo galería...');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8, // Mejor calidad para API real
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                console.log('✅ Imagen seleccionada:', imageUri);
                setSelectedImage(imageUri);
                analyzeImage(imageUri, true);
            }
        } catch (error) {
            console.error('❌ Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo acceder a la galería');
        }
    };

    const analyzeImage = async (imageUri: string, fromGallery: boolean = false): Promise<void> => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            if (useRealAPI) {
                console.log('🔍 Analizando con API real de Plant.id...');
                
                try {
                    // USAR API REAL
                    const result = await PlantixService.analyzeImage(imageUri, fromGallery);
                    console.log('📊 Resultado de API real:', result);
                    
                    setAnalysisResult(result);
                    
                    // Guardar en historial
                    await PlantixService.saveAnalysisToHistory(result);
                    
                    const message = result.diseases && result.diseases.length > 0 
                        ? `Análisis completado: ${result.diseases[0].name} (${result.diseases[0].severity})`
                        : result.isPlantDetected 
                            ? 'Análisis completado: Planta saludable'
                            : 'Análisis completado: No se detectó una planta clara';
                    
                    Alert.alert('✅ Análisis IA Completo', message, [{ text: 'OK' }]);
                    
                } catch (apiError) {
                    console.error('❌ Error de API:', apiError);
                    
                    // Mostrar error específico y fallback a simulación
                    const errorMessage = apiError instanceof Error ? apiError.message : 'Error desconocido';
                    Alert.alert(
                        'Error de API',
                        `No se pudo conectar con Plant.id: ${errorMessage}\n\n¿Usar modo simulación?`,
                        [
                            { 
                                text: 'Usar Simulación', 
                                onPress: () => {
                                    setUseRealAPI(false);
                                    analyzeImage(imageUri, fromGallery);
                                }
                            },
                            { text: 'Cancelar' }
                        ]
                    );
                    return;
                }
                
            } else {
                console.log('🧪 Analizando imagen con datos simulados...');
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const healthOptions = ['healthy', 'unhealthy'];
                const diseaseNames = [
                    'Mancha foliar detectada',
                    'Posible mildiu', 
                    'Indicios de roya',
                    'Síntomas de antracnosis',
                    'Posible virus del mosaico'
                ];
                const severityLevels: ('crítica' | 'alta' | 'media' | 'baja')[] = ['crítica', 'alta', 'media', 'baja'];
                
                const randomHealth = healthOptions[Math.floor(Math.random() * healthOptions.length)] as 'healthy' | 'unhealthy';
                const hasDisease = Math.random() > 0.3;
                
                const mockResult: AnalysisResult = {
                    cropHealth: randomHealth,
                    diseases: hasDisease ? [
                        {
                            name: diseaseNames[Math.floor(Math.random() * diseaseNames.length)],
                            probability: Math.random() * 0.4 + 0.6,
                            severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
                            description: `Análisis simulado - ${fromGallery ? 'desde galería' : 'desde cámara'}`,
                            treatment: ['Tratamiento simulado A', 'Tratamiento simulado B']
                        }
                    ] : [],
                    recommendations: [
                        '💧 Revisar niveles de riego',
                        '🌡️ Controlar temperatura ambiente',
                        '💡 Optimizar exposición a luz',
                        '🌱 Verificar nutrientes del suelo',
                        '🔍 Monitorear progreso semanal'
                    ].sort(() => 0.5 - Math.random()).slice(0, 3),
                    confidence: Math.random() * 0.4 + 0.6,
                    isPlantDetected: true,
                    analysisDate: new Date().toISOString()
                };
                
                setAnalysisResult(mockResult);
                
                const message = mockResult.diseases.length > 0 
                    ? `Análisis completado: ${mockResult.diseases[0].name}`
                    : 'Análisis completado: Planta saludable';
                
                Alert.alert('✅ Simulación Completa', message, [{ text: 'OK' }]);
            }

        } catch (error) {
            console.error('❌ Error en análisis:', error);
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

    const onCameraReady = () => {
        console.log('📷 Cámara lista para capturar');
        setIsCameraReady(true);
    };

    const closeCamera = () => {
        console.log('❌ Cerrando cámara...');
        setIsCameraReady(false);
        setShowCamera(false);
    };

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
                <Text style={[styles.title, { color: textColor }]}>
                    🔬 Análisis de Plantas IA
                </Text>
                
                <View style={styles.toggleContainer}>
                    <Text style={[styles.toggleLabel, { color: secondaryTextColor }]}>
                        {useRealAPI ? '🌐 Plant.id API' : '🧪 Simulación'}
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
                            ? 'Conectado a Plant.id IA para análisis profesional de plantas'
                            : 'Modo demostración con datos simulados'
                        }
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.button, 
                                { 
                                    backgroundColor: isAnalyzing ? '#CCCCCC' : primaryColor,
                                    opacity: isAnalyzing ? 0.6 : 1
                                }
                            ]}
                            onPress={openCamera}
                            disabled={isAnalyzing}
                        >
                            <Text style={[styles.buttonText, { color: theme === 'dark' ? 'white' : 'black' }]}>
                                📷 Cámara
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button, 
                                { 
                                    backgroundColor: isAnalyzing ? '#CCCCCC' : primaryColor,
                                    opacity: isAnalyzing ? 0.6 : 1
                                }
                            ]}
                            onPress={pickImage}
                            disabled={isAnalyzing}
                        >
                            <Text style={[styles.buttonText, { color: theme === 'dark' ? 'white' : 'black' }]}>
                                🖼️ Galería
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {selectedImage && (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity 
                                onPress={() => analyzeImage(selectedImage, false)}
                                disabled={isAnalyzing}
                                style={[
                                    styles.imageButton,
                                    { opacity: isAnalyzing ? 0.6 : 1 }
                                ]}
                            >
                                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                                <View style={styles.imageOverlay}>
                                    {isAnalyzing ? (
                                        <View style={styles.analyzingContainer}>
                                            <ActivityIndicator size="small" color="white" />
                                            <Text style={styles.analyzingText}>
                                                {useRealAPI ? 'Plant.id analizando...' : 'Simulando...'}
                                            </Text>
                                        </View>
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

                    {isAnalyzing && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={[styles.loadingText, { color: textColor }]}>
                                {useRealAPI ? 'Analizando con Plant.id IA...' : 'Procesando imagen...'}
                            </Text>
                            {useRealAPI && (
                                <Text style={[styles.apiNote, { color: secondaryTextColor }]}>
                                    Usando créditos de API
                                </Text>
                            )}
                        </View>
                    )}

                    {analysisResult && !isAnalyzing && (
                        <View style={[styles.resultContainer, { backgroundColor: cardColor }]}>
                            <Text style={[styles.resultTitle, { color: textColor }]}>
                                📊 Resultado {useRealAPI ? '(Plant.id IA)' : '(Simulado)'}
                            </Text>

                            {/* Info de la planta detectada */}
                            {analysisResult.plantInfo && analysisResult.plantInfo.length > 0 && (
                                <View style={styles.plantInfoSection}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                                        🌿 Planta identificada:
                                    </Text>
                                    <Text style={[styles.plantName, { color: primaryColor }]}>
                                        {analysisResult.plantInfo[0].name}
                                    </Text>
                                    <Text style={[styles.plantProbability, { color: secondaryTextColor }]}>
                                        Confianza: {(analysisResult.plantInfo[0].probability * 100).toFixed(0)}%
                                    </Text>
                                </View>
                            )}

                            <View style={styles.healthStatus}>
                                <Text style={[styles.healthLabel, { color: textColor }]}>
                                    Estado:
                                </Text>
                                <Text style={[
                                    styles.healthValue,
                                    {
                                        color: analysisResult.cropHealth === 'healthy' ? '#4CAF50' : 
                                               analysisResult.cropHealth === 'unhealthy' ? '#F44336' : '#FF9800'
                                    }
                                ]}>
                                    {analysisResult.cropHealth === 'healthy' ? '✅ Saludable' : 
                                     analysisResult.cropHealth === 'unhealthy' ? '⚠️ Problemas detectados' : '❓ Desconocido'}
                                </Text>
                            </View>

                            <Text style={[styles.confidence, { color: secondaryTextColor }]}>
                                Análisis general: {(analysisResult.confidence * 100).toFixed(0)}%
                            </Text>

                            {analysisResult.diseases && analysisResult.diseases.length > 0 && (
                                <View style={styles.diseasesSection}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                                        🦠 Problemas detectados:
                                    </Text>
                                    {analysisResult.diseases.map((disease, index) => (
                                        <View key={index} style={styles.diseaseItem}>
                                            <View style={styles.diseaseHeader}>
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
                                            <Text style={[styles.diseaseProbability, { color: secondaryTextColor }]}>
                                                Probabilidad: {(disease.probability * 100).toFixed(0)}%
                                            </Text>
                                            {disease.description && (
                                                <Text style={[styles.diseaseDescription, { color: secondaryTextColor }]}>
                                                    {disease.description}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                                <View style={styles.recommendationsSection}>
                                    <Text style={[styles.sectionTitle, { color: textColor }]}>
                                        💡 Recomendaciones:
                                    </Text>
                                    {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                                        <Text key={index} style={[styles.recommendation, { color: secondaryTextColor }]}>
                                            • {rec}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {analysisResult.analysisDate && (
                                <Text style={[styles.analysisDate, { color: secondaryTextColor }]}>
                                    Análisis: {new Date(analysisResult.analysisDate).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>

            <Modal 
                visible={showCamera} 
                animationType="slide"
                onRequestClose={closeCamera}
                statusBarTranslucent={true}
            >
                <View style={styles.cameraContainer}>
                    {permission?.granted ? (
                        <CameraView
                            style={styles.camera}
                            facing={facing}
                            ref={cameraRef}
                            onCameraReady={onCameraReady}
                            mode="picture"
                        >
                            <View style={styles.cameraOverlay}>
                                <View style={styles.cameraHeader}>
                                    <TouchableOpacity
                                        style={styles.flipButton}
                                        onPress={toggleCameraFacing}
                                        disabled={!isCameraReady}
                                    >
                                        <Text style={styles.flipButtonText}>🔄</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.statusContainer}>
                                        <Text style={styles.cameraIndicator}>
                                            {facing === 'back' ? '📱 Trasera' : '🤳 Frontal'}
                                        </Text>
                                        {!isCameraReady && (
                                            <Text style={styles.loadingIndicator}>
                                                Iniciando...
                                            </Text>
                                        )}
                                        {useRealAPI && (
                                            <Text style={styles.apiIndicator}>
                                                🌐 Plant.id IA
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.cameraControls}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={closeCamera}
                                    >
                                        <Text style={styles.cancelButtonText}>❌ Cancelar</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.captureButton,
                                            { 
                                                opacity: isCameraReady ? 1 : 0.5,
                                                backgroundColor: isCameraReady ? 'white' : '#CCCCCC'
                                            }
                                        ]}
                                        onPress={takePhoto}
                                        disabled={!isCameraReady}
                                    >
                                        <Text style={styles.captureButtonText}>📸</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </CameraView>
                    ) : (
                        <View style={styles.permissionContainer}>
                            <Text style={styles.permissionText}>
                                Se necesitan permisos de cámara para continuar
                            </Text>
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={async () => {
                                    const granted = await requestCameraPermission();
                                    if (!granted) {
                                        setShowCamera(false);
                                    }
                                }}
                            >
                                <Text style={styles.permissionButtonText}>
                                    Conceder Permisos
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.permissionButton, { backgroundColor: '#666', marginTop: 10 }]}
                                onPress={() => setShowCamera(false)}
                            >
                                <Text style={styles.permissionButtonText}>
                                    Cancelar
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
    analyzingContainer: {
        alignItems: 'center',
    },
    analyzingText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        textAlign: 'center',
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
    apiNote: {
        marginTop: 4,
        fontSize: 12,
        fontStyle: 'italic',
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
    plantInfoSection: {
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    },
    plantName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    plantProbability: {
        fontSize: 12,
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
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.1)',
    },
    diseaseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    diseaseName: {
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },
    diseaseSeverity: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    diseaseProbability: {
        fontSize: 11,
        marginBottom: 2,
    },
    diseaseDescription: {
        fontSize: 11,
        fontStyle: 'italic',
        lineHeight: 14,
    },
    recommendationsSection: {
        marginBottom: 8,
    },
    recommendation: {
        fontSize: 12,
        marginBottom: 2,
        lineHeight: 16,
    },
    analysisDate: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    statusContainer: {
        alignItems: 'flex-end',
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
    loadingIndicator: {
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        color: 'black',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    apiIndicator: {
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 64,
        marginBottom: Platform.OS === 'ios' ? 100 : 80,
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
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    captureButtonText: {
        fontSize: 30,
        color: 'black',
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
        padding: 20,
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 150,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default PlantAnalyzer;