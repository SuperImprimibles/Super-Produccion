// ============================================================
// MATERIAL HISTORY - Historial de Material con modal
// ============================================================

const fs = require('fs');
const path = require('path');

class MaterialHistory {
    constructor() {
        this.historialDir = path.join(__dirname, '../assets/Historial de Material');
        this.maxItems = 50;
        this.metadataPath = path.join(this.historialDir, 'metadata.json');
        
        this.ensureDirectoryExists();
        this.loadMetadata();
    }

    // ============================================================
    // INICIALIZAR
    // ============================================================
    ensureDirectoryExists() {
        if (!fs.existsSync(this.historialDir)) {
            fs.mkdirSync(this.historialDir, { recursive: true });
            console.log('📁 Directorio de historial creado');
        }
    }

    loadMetadata() {
        if (fs.existsSync(this.metadataPath)) {
            try {
                this.metadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
            } catch (error) {
                console.warn('⚠️ Error cargando metadata, creando nuevo');
                this.metadata = { items: [] };
            }
        } else {
            this.metadata = { items: [] };
        }
    }

    saveMetadata() {
        fs.writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2));
    }

    // ============================================================
    // AGREGAR IMAGEN AL HISTORIAL
    // ============================================================
    async agregarImagen(dataUrl, info = {}) {
        const timestamp = Date.now();
        const filename = `material_${timestamp}.png`;
        const filepath = path.join(this.historialDir, filename);

        try {
            // Guardar imagen
            const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filepath, buffer);

            // Agregar metadata
            const item = {
                filename: filename,
                filepath: filepath,
                timestamp: timestamp,
                fecha: new Date(timestamp).toISOString(),
                proyecto: info.proyecto || 'Sin proyecto',
                tipo: info.tipo || 'Desconocido', // 'Personaje' o 'Fondo'
                tematica: info.tematica || '',
                ...info
            };

            this.metadata.items.unshift(item);

            // Mantener solo últimos 50
            if (this.metadata.items.length > this.maxItems) {
                const itemsAEliminar = this.metadata.items.splice(this.maxItems);
                
                // Eliminar archivos antiguos
                itemsAEliminar.forEach(item => {
                    if (fs.existsSync(item.filepath)) {
                        fs.unlinkSync(item.filepath);
                    }
                });
            }

            this.saveMetadata();
            console.log(`✅ Imagen agregada al historial: ${filename}`);
            
            return item;

        } catch (error) {
            console.error('❌ Error agregando imagen al historial:', error);
            return null;
        }
    }

    // ============================================================
    // OBTENER ÚLTIMAS IMÁGENES
    // ============================================================
    obtenerUltimas(cantidad = 50) {
        return this.metadata.items.slice(0, cantidad);
    }

    // ============================================================
    // BUSCAR POR PROYECTO
    // ============================================================
    buscarPorProyecto(nombreProyecto) {
        return this.metadata.items.filter(item => 
            item.proyecto === nombreProyecto
        );
    }

    // ============================================================
    // BUSCAR POR TIPO
    // ============================================================
    buscarPorTipo(tipo) {
        return this.metadata.items.filter(item => 
            item.tipo === tipo
        );
    }

    // ============================================================
    // BUSCAR POR TEMÁTICA
    // ============================================================
    buscarPorTematica(tematica) {
        return this.metadata.items.filter(item => 
            item.tematica && item.tematica.toLowerCase().includes(tematica.toLowerCase())
        );
    }

    // ============================================================
    // OBTENER IMAGEN COMO DATA URL
    // ============================================================
    obtenerImagenDataUrl(filename) {
        const filepath = path.join(this.historialDir, filename);
        
        if (fs.existsSync(filepath)) {
            const buffer = fs.readFileSync(filepath);
            const base64 = buffer.toString('base64');
            const ext = path.extname(filename).substring(1);
            return `data:image/${ext};base64,${base64}`;
        }
        
        return null;
    }

    // ============================================================
    // ABRIR CARPETA EN EXPLORADOR
    // ============================================================
    abrirEnExplorador() {
        const { shell } = require('electron');
        shell.openPath(this.historialDir);
        console.log('📂 Abriendo historial en explorador');
    }

    // ============================================================
    // LIMPIAR HISTORIAL
    // ============================================================
    limpiarHistorial() {
        try {
            const archivos = fs.readdirSync(this.historialDir);
            
            archivos.forEach(file => {
                if (file !== 'metadata.json') {
                    fs.unlinkSync(path.join(this.historialDir, file));
                }
            });
            
            this.metadata = { items: [] };
            this.saveMetadata();
            
            console.log('🧹 Historial limpiado');
            return true;
            
        } catch (error) {
            console.error('❌ Error limpiando historial:', error);
            return false;
        }
    }

    // ============================================================
    // GENERAR HTML DEL MODAL
    // ============================================================
    generarModalHTML() {
        const items = this.obtenerUltimas(50);
        
        const itemsHTML = items.map((item, index) => `
            <div class="history-item" draggable="true" data-index="${index}" data-filename="${item.filename}">
                <img src="${this.obtenerImagenDataUrl(item.filename)}" alt="${item.filename}">
                <div class="history-item-info">
                    <div class="history-item-tipo">${item.tipo}</div>
                    <div class="history-item-proyecto">${item.proyecto}</div>
                    <div class="history-item-fecha">${this.formatearFecha(item.fecha)}</div>
                </div>
            </div>
        `).join('');

        return `
            <div class="modal-backdrop open" id="modal-historial">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>📦 Historial de Material (${items.length}/50)</h2>
                        <button class="modal-close-btn" onclick="cerrarModalHistorial()">&times;</button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                        <div class="historial-filtros">
                            <input type="text" id="filtro-historial" placeholder="Buscar por temática o proyecto..." 
                                   style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #3a3a3a; background: #1a1a1a; color: #fff;">
                            <div style="margin-top: 10px; display: flex; gap: 10px;">
                                <button onclick="filtrarHistorial('Personaje')" class="btn-preset">Personajes</button>
                                <button onclick="filtrarHistorial('Fondo')" class="btn-preset">Fondos</button>
                                <button onclick="filtrarHistorial('todos')" class="btn-preset">Todos</button>
                                <button onclick="limpiarHistorial()" class="btn-preset" style="margin-left: auto; background: #ff6b6b;">Limpiar</button>
                            </div>
                        </div>
                        
                        <div class="historial-grid" id="historial-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                            ${itemsHTML || '<p style="text-align: center; color: #6a6a6a;">No hay imágenes en el historial</p>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .history-item {
                    background: #1a1a1a;
                    border: 2px solid #2a2a2a;
                    border-radius: 8px;
                    padding: 8px;
                    cursor: grab;
                    transition: all 0.2s ease;
                }
                
                .history-item:hover {
                    border-color: #00ff00;
                    transform: scale(1.05);
                }
                
                .history-item:active {
                    cursor: grabbing;
                }
                
                .history-item img {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .history-item-info {
                    font-size: 11px;
                    color: #9a9a9a;
                }
                
                .history-item-tipo {
                    font-weight: 700;
                    color: #00ff00;
                    margin-bottom: 4px;
                }
                
                .history-item-proyecto {
                    margin-bottom: 2px;
                }
                
                .history-item-fecha {
                    font-size: 10px;
                    color: #6a6a6a;
                }
                
                .historial-filtros {
                    position: sticky;
                    top: 0;
                    background: #0d0d0d;
                    padding-bottom: 15px;
                    z-index: 10;
                }
            </style>
        `;
    }

    // ============================================================
    // FORMATEAR FECHA
    // ============================================================
    formatearFecha(isoString) {
        const fecha = new Date(isoString);
        const ahora = new Date();
        const diff = ahora - fecha;
        
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);
        
        if (minutos < 60) return `Hace ${minutos}m`;
        if (horas < 24) return `Hace ${horas}h`;
        if (dias < 7) return `Hace ${dias}d`;
        
        return fecha.toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }
}

module.exports = MaterialHistory;