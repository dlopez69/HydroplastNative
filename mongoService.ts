const https = require('https');

const url = 'https://servidorhydroplas.onrender.com/api/last-reading';

https.get(url, (res) => {
    let data = '';

    // Recibe los datos en fragmentos
    res.on('data', (chunk) => {
        data += chunk;
    });

    // Cuando se haya recibido toda la respuesta
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Respuesta del servidor:");
            console.log(JSON.stringify(json, null, 4)); // Mostrar con formato
        } catch (error) {
            console.error("Error al analizar el JSON:", error.message);
        }
    });

}).on('error', (err) => {
    console.error("Error en la solicitud HTTPS:", err.message);
});
