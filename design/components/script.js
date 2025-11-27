// ============================================================
// CÓDIGO COMPLETO PARA AGREGAR AL FINAL DE script.js
// ============================================================

// ============================================================
// VARIABLES GLOBALES PARA MÓDULOS ADICIONALES
// ============================================================
let groqModule = null;
let aiModeController = null;
let validationSystem = null;
let materialHistory = null;

// ============================================================
// INICIALIZAR HISTORIAL DE MATERIAL
// ============================================================
async function inicializarHistorial() {
    try {
        const MaterialHistory = require('../source/material-history.js');
        materialHistory = new MaterialHistory();
        console.log('✅ Historial de material inicializado');
        
        // Configurar botón de historial
        const btnHistorial = document.querySelector('button[title="Historial de material"]');
        if (btnHistorial) {
            btnHistorial.addEventListener('click', () => {
                mostrarModalHistorial();
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error inicializando historial:', error);
        return false;
    }
}

// ============================================================
// MOSTRAR MODAL DE HISTORIAL
// ============================================================
function mostrarModalHistorial() {
    if (!materialHistory) {
        console.error('❌ Historial no inicializado');
        return;
    }
    
    const modalHTML = materialHistory.generarModalHTML();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar drag & drop del historial
    configurarDragDropHistorial();
    
    // Configurar filtros
    configurarFiltrosHistorial();
}

window.cerrarModalHistorial = function() {
    const modal = document.getElementById('modal-historial');
    if (modal) modal.remove();
};

window.limpiarHistorial = function() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
        if (materialHistory) {
            materialHistory.limpiarHistorial();
            cerrarModalHistorial();
            mostrarNotificacion('🧹 Historial limpiado');
        }
    }
};

window.filtrarHistorial = function(tipo) {
    const items = document.querySelectorAll('.history-item');
    
    items.forEach(item => {
        const tipoItem = item.querySelector('.history-item-tipo').textContent;
        
        if (tipo === 'todos') {
            item.style.display = 'block';
        } else if (tipoItem === tipo) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
};

// ============================================================
// CONFIGURAR DRAG & DROP DEL HISTORIAL
// ============================================================
function configurarDragDropHistorial() {
    const items = document.querySelectorAll('.history-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const filename = item.dataset.filename;
            const dataUrl = materialHistory.obtenerImagenDataUrl(filename);
            
            e.dataTransfer.setData('text/plain', dataUrl);
            e.dataTransfer.effectAllowed = 'copy';
            
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
    });
}

// ============================================================
// CONFIGURAR FILTROS DEL HISTORIAL
// ============================================================
function configurarFiltrosHistorial() {
    const inputFiltro = document.getElementById('filtro-historial');
    
    if (inputFiltro) {
        inputFiltro.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.history-item');
            
            items.forEach(item => {
                const proyecto = item.querySelector('.history-item-proyecto').textContent.toLowerCase();
                
                if (proyecto.includes(busqueda) || busqueda === '') {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

// ============================================================
// AGREGAR IMAGEN AL HISTORIAL
// ============================================================
async function agregarImagenAlHistorial(dataUrl, tipo, tematica) {
    if (materialHistory) {
        const info = {
            tipo: tipo,
            tematica: tematica || document.getElementById('tematica')?.value || '',
            proyecto: tematica || 'Sin nombre',
            timestamp: Date.now()
        };
        
        await materialHistory.agregarImagen(dataUrl, info);
    }
}

// ============================================================
// INICIALIZAR MODO IA
// ============================================================
async function inicializarModoIA() {
    console.log('🤖 Inicializando Modo IA...');
    
    try {
        // Cargar módulo Groq
        const GroqAIModule = require('../source/groq-ai-module.js');
        groqModule = new GroqAIModule();
        
        console.log('✅ Módulo Groq cargado');
        
        // Cargar controlador de Modo IA
        const AIModeController = require('../source/ai-mode-controller.js');
        aiModeController = new AIModeController(groqModule);
        
        // Inicializar listeners
        aiModeController.inicializar();
        
        console.log('✅ Modo IA inicializado correctamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando Modo IA:', error);
        return false;
    }
}

// ============================================================
// APLICAR SUGERENCIAS IA AUTOMÁTICAS
// ============================================================
async function aplicarSugerenciasIA() {
    if (!groqModule || !aiModeController) {
        console.warn('⚠️ Modo IA no inicializado');
        return;
    }
    
    try {
        mostrarModalProgreso('🤖 Analizando con IA', 'La IA está procesando tu proyecto...');
        
        // Obtener configuración actual
        const config = {
            tematica: document.getElementById('tematica')?.value || '',
            nombre: document.getElementById('nombre-input')?.value || '',
            edad: parseInt(document.getElementById('edad')?.value) || null,
            publico: document.getElementById('publico')?.value || 'general',
            colores: Array.from(document.querySelectorAll('#grupo-colores .color-circulo') || []).map(c => c.value),
            logoDataUrl: obtenerLogoDataUrl(),
            personajes: []
        };
        
        // Aplicar sugerencias
        const resultado = await groqModule.aplicarSugerenciasCompletas(config);
        
        ocultarModalProgreso();
        
        if (resultado.aplicado) {
            // Aplicar colores sugeridos
            if (config.colores && config.colores.length >= 3) {
                const selectoresColor = document.querySelectorAll('#grupo-colores .color-circulo');
                config.colores.forEach((color, index) => {
                    if (selectoresColor[index]) {
                        selectoresColor[index].value = color;
                        selectoresColor[index].dispatchEvent(new Event('change'));
                    }
                });
            }
            
            // Aplicar edad si fue sugerida
            if (config.edad) {
                const edadInput = document.getElementById('edad');
                if (edadInput) {
                    edadInput.value = config.edad;
                    edadInput.dispatchEvent(new Event('change'));
                }
            }
            
            // Guardar análisis de logo
            if (config.analisisLogo) {
                localStorage.setItem('logo-analisis', JSON.stringify(config.analisisLogo));
            }
            
            // Guardar campos de MercadoLibre
            if (config.mercadolibre) {
                localStorage.setItem('mercadolibre-campos', JSON.stringify(config.mercadolibre));
            }
            
            mostrarModalResultadosIA(resultado);
            guardarEstado();
            
        } else {
            mostrarError('No se pudieron aplicar sugerencias IA');
        }
        
    } catch (error) {
        ocultarModalProgreso();
        console.error('❌ Error aplicando sugerencias IA:', error);
        mostrarError('Error en procesamiento IA: ' + error.message);
    }
}

// ============================================================
// OBTENER LOGO COMO DATA URL
// ============================================================
function obtenerLogoDataUrl() {
    const vistaPersonajes = document.getElementById('vista-personajes');
    if (!vistaPersonajes) return null;
    
    const cuadros = vistaPersonajes.querySelectorAll('.drop-zone');
    const cuadroLogo = cuadros[12]; // Índice 12 = LOGO
    
    if (cuadroLogo) {
        const img = cuadroLogo.querySelector('img');
        if (img && img.src) {
            return img.src;
        }
    }
    
    return null;
}

// ============================================================
// MOSTRAR MODAL CON RESULTADOS IA
// ============================================================
function mostrarModalResultadosIA(resultado) {
    const cambiosHTML = resultado.cambios.map(c => `<li>${c}</li>`).join('');
    
    const modal = `
        <div class="modal-backdrop open" id="modal-resultados-ia">
            <div class="modal-content medium">
                <div class="modal-header">
                    <h2>✨ Sugerencias IA Aplicadas</h2>
                    <button class="modal-close-btn" onclick="cerrarModalResultadosIA()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: #00ff00; margin-bottom: 15px;">
                        La IA ha analizado tu proyecto y aplicado las siguientes mejoras:
                    </p>
                    
                    <ul style="margin: 10px 0; padding-left: 20px; color: #ffffff;">
                        ${cambiosHTML}
                    </ul>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #2a2a2a;">
                        <strong style="color: #00d9d9;">💡 Tip:</strong>
                        <p style="margin: 5px 0; color: #9a9a9a; font-size: 13px;">
                            Puedes activar el Modo IA en elementos individuales haciendo 
                            <strong>click derecho</strong> sobre ellos. Los elementos en Modo IA 
                            se verán de color <span style="color: #00d9d9;">turquesa</span>.
                        </p>
                    </div>
                    
                    <button onclick="cerrarModalResultadosIA()" class="btn-publicar" 
                            style="margin-top: 20px; width: 100%;">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

window.cerrarModalResultadosIA = function() {
    const modal = document.getElementById('modal-resultados-ia');
    if (modal) modal.remove();
};

// ============================================================
// BOTÓN PARA APLICAR SUGERENCIAS IA
// ============================================================
function agregarBotonSugerenciasIA() {
    const barraControles = document.querySelector('.controles-centro');
    if (!barraControles) return;
    
    const btnIA = document.createElement('button');
    btnIA.className = 'btn-icono';
    btnIA.title = 'Aplicar Sugerencias IA';
    btnIA.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
    `;
    btnIA.style.color = '#00d9d9';
    
    btnIA.addEventListener('click', () => {
        aplicarSugerenciasIA();
    });
    
    barraControles.appendChild(btnIA);
    console.log('✅ Botón Sugerencias IA agregado');
}

// ============================================================
// INICIALIZAR SISTEMA DE VALIDACIÓN
// ============================================================
function inicializarValidacion() {
    try {
        const ValidationSystem = require('../source/validation-system.js');
        validationSystem = new ValidationSystem();
        console.log('✅ Sistema de validación inicializado');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando validación:', error);
        return false;
    }
}

// ============================================================
// VALIDAR ANTES DE PUBLICAR
// ============================================================
async function validarYPublicar() {
    if (!validationSystem) {
        console.warn('⚠️ Sistema de validación no inicializado');
        inicializarValidacion();
    }
    
    console.log('🔍 Validando proyecto...');
    
    // Ejecutar validación
    const resultados = validationSystem.validarTodo();
    
    // Mostrar modal de validación
    validationSystem.mostrarModalValidacion(resultados);
    
    return resultados.valido;
}

// ============================================================
// CONFIGURAR BOTÓN DE PUBLICAR
// ============================================================
function configurarBotonPublicar() {
    const btnPublicar = document.querySelector('.btn-publicar');
    if (!btnPublicar) return;
    
    // Remover listener anterior si existe
    const nuevoBtn = btnPublicar.cloneNode(true);
    btnPublicar.parentNode.replaceChild(nuevoBtn, btnPublicar);
    
    // Agregar nuevo listener
    nuevoBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await validarYPublicar();
    });
    
    console.log('✅ Botón Publicar configurado con validación');
}

// ============================================================
// MODIFICAR FUNCIÓN inicializarApp() EXISTENTE
// ============================================================
// REEMPLAZAR la función inicializarApp() con esta versión actualizada:

function inicializarApp() {
    console.log('🚀 Inicializando interfaz...');
    
    const btnNuevo = document.getElementById('btn-nuevo-proyecto');
    if (btnNuevo) btnNuevo.addEventListener('click', limpiarTodo);
    
    const camposConfig = ['tematica', 'nombre-input', 'edad', 'publico'];
    camposConfig.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('change', guardarEstado);
            campo.addEventListener('input', debounce(guardarEstado, 1000));
        }
    });
    
    const colores = document.querySelectorAll('#grupo-colores .color-circulo');
    colores.forEach((color) => {
        color.addEventListener('change', () => guardarEstado());
    });
    
    configurarDragDrop();
    configurarTabs();
    configurarCampos();
    configurarVentanas();
    configurarClickDiapositivas();
    
    // Inicializar historial de material
    setTimeout(async () => {
        await inicializarHistorial();
    }, 1000);
    
    // Inicializar sistema de validación
    setTimeout(() => {
        inicializarValidacion();
        configurarBotonPublicar();
        
        // Actualizar estado del botón cada vez que cambie algo
        document.addEventListener('change', () => {
            if (validationSystem) {
                validationSystem.actualizarEstadoBotonPublicar();
            }
        });
        
        // Primera actualización
        if (validationSystem) {
            validationSystem.actualizarEstadoBotonPublicar();
        }
    }, 1500);
    
    // Inicializar Modo IA
    setTimeout(async () => {
        const iaListo = await inicializarModoIA();
        
        if (iaListo) {
            agregarBotonSugerenciasIA();
            
            // Si hay logo, analizarlo automáticamente
            const logoDataUrl = obtenerLogoDataUrl();
            if (logoDataUrl) {
                console.log('🔍 Logo detectado, análisis automático disponible');
            }
        }
    }, 2000);
    
    console.log('✅ Interfaz lista');
}

console.log('✅ Script completo cargado con todas las integraciones');