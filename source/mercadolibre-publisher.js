// ============================================================
// MERCADOLIBRE PUBLISHER - OAuth y Publicación Automática
// ============================================================

const { shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

class MercadoLibrePublisher {
    constructor() {
        this.clientId = '4278208035681349';
        this.clientSecret = 'XzzHgqo9PPfO16wJZcDK0FZlJv95ShOu';
        this.redirectUri = 'https://super-imprimible.vercel.app/api/auth-redirect';
        
        this.authServer = null;
        this.authPort = 3000;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        
        this.tokenPath = path.join(__dirname, '../assets/meli_tokens.json');
        
        // Cargar tokens guardados si existen
        this.loadTokens();
    }

    // ============================================================
    // FLUJO OAUTH COMPLETO
    // ============================================================
    async authenticate() {
        console.log('🔐 Iniciando autenticación con MercadoLibre...');
        
        // Si ya tenemos un token válido, usarlo
        if (this.hasValidToken()) {
            console.log('✅ Token válido encontrado');
            return true;
        }
        
        // Si tenemos refresh token, intentar renovar
        if (this.refreshToken) {
            console.log('🔄 Renovando token...');
            const renewed = await this.renewToken();
            if (renewed) {
                console.log('✅ Token renovado');
                return true;
            }
        }
        
        // Iniciar flujo OAuth desde cero
        return await this.startOAuthFlow();
    }

    // ============================================================
    // INICIAR FLUJO OAUTH
    // ============================================================
    async startOAuthFlow() {
        return new Promise((resolve, reject) => {
            // Crear servidor local para recibir el código
            this.authServer = http.createServer(async (req, res) => {
                const url = new URL(req.url, `http://localhost:${this.authPort}`);
                
                if (url.pathname === '/callback') {
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');
                    
                    if (error) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>❌ Error en autorización</h1><p>Puedes cerrar esta ventana.</p>');
                        this.authServer.close();
                        reject(new Error(error));
                        return;
                    }
                    
                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>✅ Autorización exitosa</h1><p>Puedes cerrar esta ventana.</p>');
                        
                        // Intercambiar código por token
                        try {
                            await this.exchangeCodeForToken(code);
                            this.authServer.close();
                            resolve(true);
                        } catch (error) {
                            this.authServer.close();
                            reject(error);
                        }
                    }
                }
            });
            
            this.authServer.listen(this.authPort, () => {
                console.log(`✅ Servidor OAuth escuchando en puerto ${this.authPort}`);
                
                // Abrir navegador con URL de autorización
                const authUrl = `https://auth.mercadolibre.com.ar/authorization?` +
                    `response_type=code&client_id=${this.clientId}` +
                    `&redirect_uri=http://localhost:${this.authPort}/callback`;
                
                shell.openExternal(authUrl);
                console.log('🌐 Abriendo navegador para autorización...');
            });
            
            // Timeout de 5 minutos
            setTimeout(() => {
                if (this.authServer) {
                    this.authServer.close();
                    reject(new Error('Timeout de autorización'));
                }
            }, 300000);
        });
    }

    // ============================================================
    // INTERCAMBIAR CÓDIGO POR TOKEN
    // ============================================================
    async exchangeCodeForToken(code) {
        console.log('🔄 Intercambiando código por token...');
        
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        try {
            const response = await fetch('https://api.mercadolibre.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    code: code,
                    redirect_uri: `http://localhost:${this.authPort}/callback`
                })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                
                this.saveTokens();
                console.log('✅ Token obtenido y guardado');
                return true;
            } else {
                throw new Error(data.error || 'No se pudo obtener token');
            }
            
        } catch (error) {
            console.error('❌ Error intercambiando código:', error);
            throw error;
        }
    }

    // ============================================================
    // RENOVAR TOKEN
    // ============================================================
    async renewToken() {
        if (!this.refreshToken) {
            return false;
        }
        
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        try {
            const response = await fetch('https://api.mercadolibre.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken
                })
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000);
                
                this.saveTokens();
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error renovando token:', error);
            return false;
        }
    }

    // ============================================================
    // PUBLICAR PRODUCTO
    // ============================================================
    async publicarProducto(datos) {
        console.log('📤 Publicando producto en MercadoLibre...');
        
        // Asegurarse de tener token válido
        const autenticado = await this.authenticate();
        if (!autenticado) {
            throw new Error('No se pudo autenticar con MercadoLibre');
        }
        
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        // Construir payload
        const payload = {
            title: this.generarTitulo(datos),
            category_id: 'MLA402849', // Kit Imprimible para Fiestas
            price: datos.precio || 2999,
            currency_id: 'ARS',
            available_quantity: 999999,
            buying_mode: 'buy_it_now',
            listing_type_id: 'gold_special',
            condition: 'new',
            description: {
                plain_text: this.generarDescripcion(datos)
            },
            pictures: await this.subirImagenes(datos.imagenes),
            attributes: this.generarAtributos(datos),
            tags: this.generarTags(datos)
        };
        
        try {
            const response = await fetch('https://api.mercadolibre.com/items', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.id) {
                console.log(`✅ Producto publicado: ${result.id}`);
                console.log(`🔗 Link: ${result.permalink}`);
                
                return {
                    success: true,
                    id: result.id,
                    permalink: result.permalink,
                    data: result
                };
            } else {
                throw new Error(result.message || 'Error al publicar');
            }
            
        } catch (error) {
            console.error('❌ Error publicando:', error);
            throw error;
        }
    }

    // ============================================================
    // SUBIR IMÁGENES
    // ============================================================
    async subirImagenes(imagenes) {
        console.log(`📸 Subiendo ${imagenes.length} imágenes...`);
        
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const FormData = require('form-data');
        
        const imagenesSubidas = [];
        
        for (const imagen of imagenes) {
            try {
                const form = new FormData();
                const buffer = fs.readFileSync(imagen);
                form.append('file', buffer, { filename: path.basename(imagen) });
                
                const response = await fetch('https://api.mercadolibre.com/pictures', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: form
                });
                
                const data = await response.json();
                
                if (data.id) {
                    imagenesSubidas.push({ id: data.id });
                    console.log(`  ✅ Imagen subida: ${data.id}`);
                }
                
            } catch (error) {
                console.error(`  ❌ Error subiendo imagen:`, error);
            }
        }
        
        return imagenesSubidas;
    }

    // ============================================================
    // GENERAR CONTENIDO
    // ============================================================
    generarTitulo(datos) {
        return `Kit Imprimible ${datos.tematica} Candy Bar Cumpleaños Cotillón`;
    }

    generarDescripcion(datos) {
        return `🎉 KIT IMPRIMIBLE ${datos.tematica.toUpperCase()} PARA FIESTAS

⭐ CONTENIDO COMPLETO:
• 12 Diseños de personajes
• 12 Fondos temáticos
• 3 Fondos especiales
• Invitaciones personalizables
• Etiquetas para golosinas
• Banderines decorativos
• Tarjetas de agradecimiento
• Y mucho más!

📝 PERSONALIZACIÓN:
Nombre: ${datos.nombre}
Edad: ${datos.edad} años

✅ RECIBIRÁS:
• Archivo PowerPoint editable
• Instrucciones de uso
• Soporte por WhatsApp

🖨️ IMPRESIÓN:
• Formato A4
• Alta resolución
• Lista para imprimir

💌 ENTREGA INMEDIATA por email`;
    }

    generarAtributos(datos) {
        return [
            { id: 'BRAND', value_name: 'Super Imprimibles' },
            { id: 'MODEL', value_name: datos.tematica },
            { id: 'AGES', value_name: `${datos.edad} años` }
        ];
    }

    generarTags(datos) {
        return [
            'kit_imprimible',
            'candy_bar',
            'cumpleaños',
            'fiesta',
            datos.personaje?.toLowerCase().replace(/\s+/g, '_'),
            ...datos.ocasiones?.map(o => o.toLowerCase().replace(/\s+/g, '_')) || []
        ].filter(Boolean);
    }

    // ============================================================
    // GESTIÓN DE TOKENS
    // ============================================================
    saveTokens() {
        const tokens = {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry
        };
        
        try {
            fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));
            console.log('💾 Tokens guardados');
        } catch (error) {
            console.error('❌ Error guardando tokens:', error);
        }
    }

    loadTokens() {
        try {
            if (fs.existsSync(this.tokenPath)) {
                const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
                this.accessToken = tokens.accessToken;
                this.refreshToken = tokens.refreshToken;
                this.tokenExpiry = tokens.tokenExpiry;
                console.log('✅ Tokens cargados desde archivo');
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar tokens:', error.message);
        }
    }

    hasValidToken() {
        return this.accessToken && 
               this.tokenExpiry && 
               Date.now() < this.tokenExpiry - 300000; // 5 min de margen
    }
}

module.exports = MercadoLibrePublisher;