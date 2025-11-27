// ============================================================
// GROQ AI MODULE - Inteligencia Artificial con Groq
// ============================================================

const fs = require('fs');
const path = require('path');

class GroqAIModule {
    constructor() {
        this.apiKey = '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';
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        
        // Modelos según complejidad
        this.models = {
            simple: 'llama-3.1-8b-instant',      // Tareas simples
            complex: 'llama-3.3-70b-versatile',   // Tareas complejas
            balanced: 'mixtral-8x7b-32768'        // Balanceado
        };
        
        this.conversationHistory = [];
    }

    // ============================================================
    // LLAMADA GENÉRICA A GROQ
    // ============================================================
    async callGroq(prompt, model = 'balanced', options = {}) {
        const {
            temperature = 0.7,
            maxTokens = 2048,
            systemPrompt = 'Eres un asistente experto en diseño gráfico y kits imprimibles para fiestas infantiles.',
            jsonMode = false
        } = options;

        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ];

            const payload = {
                model: this.models[model] || this.models.balanced,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            };

            if (jsonMode) {
                payload.response_format = { type: 'json_object' };
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.choices && data.choices[0]) {
                const content = data.choices[0].message.content;
                return jsonMode ? JSON.parse(content) : content;
            } else {
                throw new Error(data.error?.message || 'No response from Groq');
            }

        } catch (error) {
            console.error('❌ Error llamando a Groq:', error);
            throw error;
        }
    }

    // ============================================================
    // ANALIZAR LOGO
    // ============================================================
    async analizarLogo(logoDataUrl, tematica = '') {
        console.log('🔍 Analizando logo con IA...');

        // Extraer colores dominantes primero (sin IA)
        const coloresDominantes = await this.extraerColoresDominantes(logoDataUrl);

        // Analizar con IA
        const prompt = `Analiza este logo para un kit imprimible de temática "${tematica}".

COLORES DETECTADOS: ${coloresDominantes.map(c => c.hex).join(', ')}

Por favor, responde ÚNICAMENTE con un JSON válido (sin markdown) con esta estructura:
{
  "colores_sugeridos": ["#hex1", "#hex2", "#hex3"],
  "fuente_sugerida": "nombre de fuente similar",
  "estilo": "cartoon/realista/minimalista/moderno/vintage",
  "tiene_sombra": true/false,
  "tiene_degradado": true/false,
  "tiene_bordes": true/false,
  "descripcion": "breve descripción del estilo"
}

Elige los 3 mejores colores que tengan buen contraste y combinen con la temática "${tematica}".`;

        try {
            const resultado = await this.callGroq(prompt, 'complex', {
                temperature: 0.3,
                jsonMode: true,
                systemPrompt: 'Eres un experto en diseño gráfico y teoría del color. Respondes ÚNICAMENTE en formato JSON válido.'
            });

            return {
                ...resultado,
                colores_detectados: coloresDominantes
            };

        } catch (error) {
            console.error('❌ Error analizando logo:', error);
            // Fallback: devolver solo colores detectados
            return {
                colores_sugeridos: coloresDominantes.slice(0, 3).map(c => c.hex),
                fuente_sugerida: 'Arial Black',
                estilo: 'moderno',
                tiene_sombra: false,
                tiene_degradado: false,
                tiene_bordes: false,
                descripcion: 'Análisis básico sin IA',
                colores_detectados: coloresDominantes
            };
        }
    }

    // ============================================================
    // EXTRAER COLORES DOMINANTES (Sin IA)
    // ============================================================
    async extraerColoresDominantes(dataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                const colorMap = {};
                
                // Contar colores
                for (let i = 0; i < pixels.length; i += 16) { // Cada 4 píxeles
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const a = pixels[i + 3];
                    
                    // Ignorar transparentes y muy claros/oscuros
                    if (a < 50 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
                        continue;
                    }
                    
                    // Redondear para agrupar colores similares
                    const rKey = Math.round(r / 10) * 10;
                    const gKey = Math.round(g / 10) * 10;
                    const bKey = Math.round(b / 10) * 10;
                    const key = `${rKey},${gKey},${bKey}`;
                    
                    colorMap[key] = (colorMap[key] || 0) + 1;
                }
                
                // Ordenar por frecuencia
                const colores = Object.entries(colorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([key, count]) => {
                        const [r, g, b] = key.split(',').map(Number);
                        return {
                            hex: this.rgbToHex(r, g, b),
                            rgb: { r, g, b },
                            count: count
                        };
                    });
                
                resolve(colores);
            };
            img.src = dataUrl;
        });
    }

    // ============================================================
    // GENERAR CAMPOS MERCADOLIBRE
    // ============================================================
    async generarCamposMercadoLibre(tematica, personajes = []) {
        console.log('🏷️ Generando campos para MercadoLibre...');

        const prompt = `Para un kit imprimible de temática "${tematica}", genera:

PERSONAJES en las imágenes: ${personajes.length > 0 ? personajes.join(', ') : 'No especificados'}

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "personaje": "nombre del personaje principal",
  "ocasiones": ["Cumpleaños", "Baby Shower", "etc"],
  "palabras_clave": ["palabra1", "palabra2", "palabra3"]
}

Las ocasiones deben ser eventos donde se usaría este kit.`;

        try {
            const resultado = await this.callGroq(prompt, 'simple', {
                temperature: 0.5,
                jsonMode: true,
                systemPrompt: 'Eres un experto en marketing de productos para fiestas. Respondes ÚNICAMENTE en formato JSON válido.'
            });

            return resultado;

        } catch (error) {
            console.error('❌ Error generando campos:', error);
            // Fallback
            return {
                personaje: tematica,
                ocasiones: ['Cumpleaños', 'Fiesta Temática'],
                palabras_clave: [tematica.toLowerCase(), 'kit', 'imprimible']
            };
        }
    }

    // ============================================================
    // SUGERIR NOMBRE BASADO EN EDAD Y TEMÁTICA
    // ============================================================
    async sugerirNombre(tematica, edad, publico = 'general') {
        console.log('👤 Sugiriendo nombres...');

        const prompt = `Sugiere 5 nombres populares para niños de ${edad} años, temática "${tematica}", público ${publico}.

Responde ÚNICAMENTE con JSON válido:
{
  "nombres": ["Nombre1", "Nombre2", "Nombre3", "Nombre4", "Nombre5"]
}`;

        try {
            const resultado = await this.callGroq(prompt, 'simple', {
                temperature: 0.8,
                jsonMode: true
            });

            return resultado.nombres || [];

        } catch (error) {
            console.error('❌ Error sugiriendo nombres:', error);
            return ['Sofía', 'Lucas', 'Emma', 'Mateo', 'Valentina'];
        }
    }

    // ============================================================
    // SUGERIR EDAD BASADO EN TEMÁTICA
    // ============================================================
    async sugerirEdad(tematica) {
        console.log('🎂 Sugiriendo edad...');

        const prompt = `Para un kit imprimible de temática "${tematica}", ¿qué edad es más común?

Responde ÚNICAMENTE con JSON válido:
{
  "edad": 5,
  "rango": "3-7 años"
}`;

        try {
            const resultado = await this.callGroq(prompt, 'simple', {
                temperature: 0.3,
                jsonMode: true
            });

            return resultado.edad || 5;

        } catch (error) {
            console.error('❌ Error sugiriendo edad:', error);
            return 5;
        }
    }

    // ============================================================
    // SUGERIR COLORES PARA TEMÁTICA (Sin logo)
    // ============================================================
    async sugerirColoresParaTematica(tematica, publico = 'general') {
        console.log('🎨 Sugiriendo colores para temática...');

        const prompt = `Para un kit imprimible de temática "${tematica}" dirigido a público ${publico}, sugiere los 3 mejores colores.

Responde ÚNICAMENTE con JSON válido:
{
  "colores": ["#hex1", "#hex2", "#hex3"],
  "razon": "breve explicación"
}

Los colores deben tener buen contraste y ser apropiados para la temática.`;

        try {
            const resultado = await this.callGroq(prompt, 'simple', {
                temperature: 0.5,
                jsonMode: true,
                systemPrompt: 'Eres un experto en teoría del color y diseño. Respondes ÚNICAMENTE en formato JSON válido.'
            });

            return resultado.colores || ['#FF69B4', '#9370DB', '#87CEEB'];

        } catch (error) {
            console.error('❌ Error sugiriendo colores:', error);
            return ['#FF69B4', '#9370DB', '#87CEEB'];
        }
    }

    // ============================================================
    // SUGERIR FUENTE PARA TEMÁTICA
    // ============================================================
    async sugerirFuente(tematica, estilo = 'moderno') {
        console.log('🔤 Sugiriendo fuente...');

        const prompt = `Para un kit imprimible de temática "${tematica}" con estilo ${estilo}, sugiere una fuente.

Fuentes disponibles en el sistema:
Aptos, Arial, Arial Black, Calibri, Comic Sans MS, Courier New, Georgia, Impact, Times New Roman, Trebuchet MS, Verdana

Responde ÚNICAMENTE con JSON válido:
{
  "fuente": "nombre exacto de la fuente",
  "alternativa": "otra opción"
}`;

        try {
            const resultado = await this.callGroq(prompt, 'simple', {
                temperature: 0.3,
                jsonMode: true
            });

            return resultado.fuente || 'Arial Black';

        } catch (error) {
            console.error('❌ Error sugiriendo fuente:', error);
            return 'Arial Black';
        }
    }

    // ============================================================
    // APLICAR SUGERENCIAS AUTOMÁTICAMENTE
    // ============================================================
    async aplicarSugerenciasCompletas(config) {
        console.log('🤖 Aplicando sugerencias completas con IA...');

        const resultados = {
            aplicado: false,
            cambios: []
        };

        try {
            // 1. Si hay logo, analizarlo
            if (config.logoDataUrl) {
                const analisisLogo = await this.analizarLogo(config.logoDataUrl, config.tematica);
                
                // Aplicar colores sugeridos
                if (analisisLogo.colores_sugeridos && analisisLogo.colores_sugeridos.length >= 3) {
                    config.colores = analisisLogo.colores_sugeridos.slice(0, 3);
                    resultados.cambios.push('✅ Colores aplicados desde logo');
                }

                // Aplicar fuente sugerida
                if (analisisLogo.fuente_sugerida) {
                    config.fuente = analisisLogo.fuente_sugerida;
                    resultados.cambios.push('✅ Fuente sugerida aplicada');
                }

                // Guardar análisis para referencia
                config.analisisLogo = analisisLogo;
            } else if (config.tematica) {
                // 2. Si no hay logo pero hay temática, sugerir colores
                const colores = await this.sugerirColoresParaTematica(config.tematica, config.publico);
                config.colores = colores;
                resultados.cambios.push('✅ Colores sugeridos aplicados');
            }

            // 3. Sugerir edad si no está configurada
            if (!config.edad && config.tematica) {
                const edad = await this.sugerirEdad(config.tematica);
                config.edad = edad;
                resultados.cambios.push(`✅ Edad sugerida: ${edad} años`);
            }

            // 4. Generar campos para MercadoLibre
            if (config.tematica) {
                const camposMeli = await this.generarCamposMercadoLibre(config.tematica, config.personajes);
                config.mercadolibre = camposMeli;
                resultados.cambios.push('✅ Campos MercadoLibre generados');
            }

            resultados.aplicado = true;
            return resultados;

        } catch (error) {
            console.error('❌ Error aplicando sugerencias:', error);
            return resultados;
        }
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    calcularContraste(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const luminance1 = (0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b) / 255;
        const luminance2 = (0.299 * rgb2.r + 0.587 * rgb2.g + 0.114 * rgb2.b) / 255;
        
        const contrast = Math.abs(luminance1 - luminance2);
        return contrast;
    }
}

module.exports = GroqAIModule;