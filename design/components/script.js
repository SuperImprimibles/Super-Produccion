// ============================================================
// SCRIPT PRINCIPAL CON GRID 3x3 Y TEMÁTICA
// ============================================================

const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const STORAGE_KEY = 'super-imprimibles-state';

let libreOfficeReady = false;
let isUpdating = false;

let estadoPrevio = null;
let colaActualizaciones = [];
let procesandoCola = false;

// ============================================================
// MAPEO DE CUADROS A FORMAS
// ============================================================
const MAPEO_PERSONAJES = {
    0: 'PNG 1', 1: 'PNG 2', 2: 'PNG 3', 3: 'PNG 4',
    4: 'PNG 5', 5: 'PNG 6', 6: 'PNG 7', 7: 'PNG 8',
    8: 'PNG 9', 9: 'PNG 10', 10: 'PNG 11', 11: 'PNG 12',
    12: 'LOGO'
};

const MAPEO_FONDOS = {
    0: 'FONDO 1', 1: 'FONDO 2', 2: 'FONDO 3', 3: 'FONDO 4',
    4: 'FONDO 5', 5: 'FONDO 6', 6: 'FONDO 7', 7: 'FONDO 8',
    8: 'FONDO 9', 9: 'FONDO 10', 10: 'FONDO 11', 11: 'FONDO 12',
    12: 'FONDO A', 13: 'FONDO B', 14: 'FONDO C'
};

const MAPEO_COLORES = {
    0: 'COLORPRIMARIO',
    1: 'COLORSECUNDARIO',
    2: 'COLORTERCIARIO'
};

// ============================================================
// INICIALIZAR APP
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Iniciando aplicación...');
    setupLibreOfficeListeners();
    setTimeout(() => inicializarApp(), 1000);
});

// ============================================================
// LISTENERS DE LIBREOFFICE
// ============================================================
function setupLibreOfficeListeners() {
    ipcRenderer.on('libreoffice-ready', (event, data) => {
        if (data.success) {
            libreOfficeReady = true;
            console.log('✅ LibreOffice listo');
            hideLoading();
            cargarEstado();
            // Cargar las 9 diapositivas
            cargarTodasLasDiapositivas();
        } else {
            console.error('❌ Error al inicializar LibreOffice');
            showError('Error al inicializar LibreOffice');
        }
    });
    
    ipcRenderer.on('libreoffice-error', (event, data) => {
        console.error('❌ LibreOffice error:', data.message);
        showError(data.message);
    });
    
    ipcRenderer.on('update-slide-preview', (event, data) => {
        console.log(`🖼️ Actualizando vista de diapositiva ${data.slideIndex}`);
        updateSlideImage(data.slideIndex, data.imagePath);
        hideLoading();
    });
    
    ipcRenderer.on('update-all-slides', (event, data) => {
        console.log('🖼️ Actualizando todas las diapositivas');
        data.slides.forEach(slide => {
            updateSlideImage(slide.index, slide.path);
        });
        hideLoading();
    });
    
    ipcRenderer.on('libreoffice-changes-applied', (event, data) => {
        if (data.success) {
            console.log('✅ Cambios aplicados exitosamente');
            // Recargar todas las diapositivas después de aplicar cambios
            cargarTodasLasDiapositivas();
        } else {
            console.error('❌ Error aplicando cambios:', data.error);
        }
        isUpdating = false;
        procesarSiguienteCambio();
    });
}

// ============================================================
// CARGAR TODAS LAS DIAPOSITIVAS (1-9)
// ============================================================
function cargarTodasLasDiapositivas() {
    ipcRenderer.send('libreoffice-get-all-slides', { count: 9 });
}

// ============================================================
// ACTUALIZAR IMAGEN DE DIAPOSITIVA ESPECÍFICA
// ============================================================
function updateSlideImage(slideIndex, imagePath) {
    const img = document.querySelector(`.preview-slide[data-slide="${slideIndex}"]`);
    
    if (img && imagePath && fs.existsSync(imagePath)) {
        const timestamp = Date.now();
        img.src = `${imagePath}?t=${timestamp}`;
        img.style.display = 'block';
        img.classList.remove('loading');
        console.log(`✅ Diapositiva ${slideIndex} actualizada`);
    } else {
        console.warn(`⚠️ No se pudo cargar diapositiva ${slideIndex}:`, imagePath);
    }
}

// ============================================================
// DETECTAR CAMBIOS ESPECÍFICOS
// ============================================================
function detectarCambios(estadoNuevo) {
    const cambios = [];
    
    if (!estadoPrevio) {
        return generarCambiosCompletos(estadoNuevo);
    }
    
    // Comparar PERSONAJES
    if (estadoNuevo.personajes && estadoPrevio.personajes) {
        estadoNuevo.personajes.forEach((cuadro, index) => {
            const cuadroPrevio = estadoPrevio.personajes[index];
            if (cuadro.tieneImagen && cuadro.imagenSrc !== cuadroPrevio?.imagenSrc) {
                cambios.push({
                    tipo: 'imagen',
                    shapeName: cuadro.nombreForma,
                    valor: cuadro.imagenSrc,
                    origen: 'personajes',
                    index: index
                });
            }
        });
    }
    
    // Comparar FONDOS
    if (estadoNuevo.fondos && estadoPrevio.fondos) {
        estadoNuevo.fondos.forEach((cuadro, index) => {
            const cuadroPrevio = estadoPrevio.fondos[index];
            if (cuadro.tieneImagen && cuadro.imagenSrc !== cuadroPrevio?.imagenSrc) {
                cambios.push({
                    tipo: 'imagen',
                    shapeName: cuadro.nombreForma,
                    valor: cuadro.imagenSrc,
                    origen: 'fondos',
                    index: index
                });
            }
        });
    }
    
    // Comparar NOMBRE
    if (estadoNuevo.config?.nombre !== estadoPrevio.config?.nombre) {
        if (estadoNuevo.config?.nombre) {
            cambios.push({
                tipo: 'texto',
                shapeName: 'NOMBRE',
                valor: estadoNuevo.config.nombre
            });
        }
    }
    
    // ✅ NUEVO: Comparar TEMÁTICA
    if (estadoNuevo.config?.tematica !== estadoPrevio.config?.tematica) {
        if (estadoNuevo.config?.tematica) {
            cambios.push({
                tipo: 'texto',
                shapeName: 'TEMATICA',
                valor: estadoNuevo.config.tematica
            });
        }
    }
    
    // Comparar COLORES
    if (estadoNuevo.config?.colores && estadoPrevio.config?.colores) {
        estadoNuevo.config.colores.forEach((color, index) => {
            const colorPrevio = estadoPrevio.config.colores[index];
            if (color !== colorPrevio && color !== '#0d0d0d') {
                const nombreForma = MAPEO_COLORES[index];
                if (nombreForma) {
                    cambios.push({
                        tipo: 'color',
                        shapeName: nombreForma,
                        valor: color
                    });
                }
            }
        });
    }
    
    return cambios;
}

// ============================================================
// GENERAR CAMBIOS COMPLETOS (PRIMERA CARGA)
// ============================================================
function generarCambiosCompletos(estado) {
    const cambios = [];
    
    // Imágenes de PERSONAJES
    if (estado.personajes) {
        estado.personajes.forEach((cuadro) => {
            if (cuadro.tieneImagen && cuadro.imagenSrc && cuadro.nombreForma) {
                cambios.push({
                    tipo: 'imagen',
                    shapeName: cuadro.nombreForma,
                    valor: cuadro.imagenSrc,
                    origen: 'personajes'
                });
            }
        });
    }
    
    // Imágenes de FONDOS
    if (estado.fondos) {
        estado.fondos.forEach((cuadro) => {
            if (cuadro.tieneImagen && cuadro.imagenSrc && cuadro.nombreForma) {
                cambios.push({
                    tipo: 'imagen',
                    shapeName: cuadro.nombreForma,
                    valor: cuadro.imagenSrc,
                    origen: 'fondos'
                });
            }
        });
    }
    
    // Texto NOMBRE
    if (estado.config?.nombre) {
        cambios.push({
            tipo: 'texto',
            shapeName: 'NOMBRE',
            valor: estado.config.nombre
        });
    }
    
    // ✅ NUEVO: Texto TEMÁTICA
    if (estado.config?.tematica) {
        cambios.push({
            tipo: 'texto',
            shapeName: 'TEMATICA',
            valor: estado.config.tematica
        });
    }
    
    // Colores
    if (estado.config?.colores) {
        estado.config.colores.forEach((color, index) => {
            const nombreForma = MAPEO_COLORES[index];
            if (nombreForma && color && color !== '#0d0d0d') {
                cambios.push({
                    tipo: 'color',
                    shapeName: nombreForma,
                    valor: color
                });
            }
        });
    }
    
    return cambios;
}

// ============================================================
// APLICAR CAMBIOS EN COLA
// ============================================================
function procesarSiguienteCambio() {
    if (procesandoCola || !libreOfficeReady) return;
    
    if (colaActualizaciones.length === 0) {
        console.log('✅ Todos los cambios aplicados');
        procesandoCola = false;
        return;
    }
    
    procesandoCola = true;
    const cambio = colaActualizaciones.shift();
    
    console.log(`🔄 Aplicando cambio: ${cambio.tipo} en ${cambio.shapeName}`);
    
    switch (cambio.tipo) {
        case 'imagen':
            aplicarImagenALibreOffice(cambio.shapeName, cambio.valor);
            break;
        case 'texto':
            aplicarTextoALibreOffice(cambio.shapeName, cambio.valor);
            break;
        case 'color':
            aplicarColorALibreOffice(cambio.shapeName, cambio.valor);
            break;
    }
}

// ============================================================
// SISTEMA DE PERSISTENCIA
// ============================================================
function guardarEstado() {
    const estado = {
        personajes: obtenerEstadoCuadros('vista-personajes'),
        fondos: obtenerEstadoCuadros('vista-fondos'),
        config: {
            tematica: document.getElementById('tematica')?.value || '',
            nombre: document.getElementById('nombre-input')?.value || '',
            edad: document.getElementById('edad')?.value || '',
            publico: document.getElementById('publico')?.value || '',
            colores: Array.from(document.querySelectorAll('#grupo-colores .color-circulo')).map(c => c.value)
        },
        timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    console.log('💾 Estado guardado');
    
    if (libreOfficeReady) {
        const cambios = detectarCambios(estado);
        
        if (cambios.length > 0) {
            console.log(`📋 ${cambios.length} cambio(s) detectado(s)`);
            colaActualizaciones.push(...cambios);
            
            if (!procesandoCola) {
                procesarSiguienteCambio();
            }
        } else {
            console.log('ℹ️ No hay cambios que aplicar');
        }
    }
    
    estadoPrevio = JSON.parse(JSON.stringify(estado));
    window.dispatchEvent(new Event('estado-actualizado'));
}

function obtenerEstadoCuadros(vistaId) {
    const vista = document.getElementById(vistaId);
    if (!vista) return [];
    
    const cuadros = vista.querySelectorAll('.drop-zone');
    const estado = [];
    
    cuadros.forEach((cuadro, index) => {
        const img = cuadro.querySelector('img');
        const nombreForma = obtenerNombreForma(vistaId, index);
        
        estado.push({
            index: index,
            nombreForma: nombreForma,
            tieneImagen: !!img,
            imagenSrc: img ? img.src : null,
            contenidoOriginal: cuadro.dataset.originalContent || null
        });
    });
    
    return estado;
}

function cargarEstado() {
    const estadoStr = localStorage.getItem(STORAGE_KEY);
    if (!estadoStr) return;
    
    try {
        const estado = JSON.parse(estadoStr);
        
        restaurarEstadoCuadros('vista-personajes', estado.personajes);
        restaurarEstadoCuadros('vista-fondos', estado.fondos);
        
        if (estado.config) {
            const tematica = document.getElementById('tematica');
            if (tematica && estado.config.tematica) tematica.value = estado.config.tematica;
            
            const nombre = document.getElementById('nombre-input');
            if (nombre && estado.config.nombre) nombre.value = estado.config.nombre;
            
            const edad = document.getElementById('edad');
            if (edad && estado.config.edad) edad.value = estado.config.edad;
            
            const publico = document.getElementById('publico');
            if (publico && estado.config.publico) publico.value = estado.config.publico;
            
            if (estado.config.colores) {
                const colores = document.querySelectorAll('#grupo-colores .color-circulo');
                estado.config.colores.forEach((color, index) => {
                    if (colores[index]) colores[index].value = color;
                });
            }
        }
        
        estadoPrevio = JSON.parse(JSON.stringify(estado));
        
        if (libreOfficeReady) {
            setTimeout(() => {
                const cambios = generarCambiosCompletos(estado);
                if (cambios.length > 0) {
                    console.log(`📋 Cargando ${cambios.length} cambios iniciales`);
                    colaActualizaciones.push(...cambios);
                    procesarSiguienteCambio();
                }
            }, 1000);
        }
        
        console.log('✅ Estado restaurado');
    } catch (error) {
        console.error('❌ Error al cargar estado:', error);
    }
}

function restaurarEstadoCuadros(vistaId, estadoCuadros) {
    if (!estadoCuadros) return;
    
    const vista = document.getElementById(vistaId);
    if (!vista) return;
    
    const cuadros = vista.querySelectorAll('.drop-zone');
    
    estadoCuadros.forEach((estado, index) => {
        if (index >= cuadros.length) return;
        const cuadro = cuadros[index];
        
        if (estado.tieneImagen && estado.imagenSrc) {
            cuadro.innerHTML = '';
            const img = document.createElement('img');
            img.src = estado.imagenSrc;
            cuadro.appendChild(img);
            cuadro.dataset.tieneImagen = 'true';
        }
    });
}

function limpiarTodo() {
    if (confirm('¿Estás seguro de que quieres comenzar un nuevo proyecto?')) {
        localStorage.removeItem(STORAGE_KEY);
        estadoPrevio = null;
        colaActualizaciones = [];
        location.reload();
    }
}

// ============================================================
// FUNCIONES DE APLICACIÓN A LIBREOFFICE
// ============================================================
function aplicarImagenALibreOffice(shapeName, imageDataUrl) {
    if (!libreOfficeReady || isUpdating) return;
    if (!shapeName) return;
    
    isUpdating = true;
    showLoading();
    
    ipcRenderer.send('libreoffice-apply-image', {
        shapeName: shapeName,
        imageDataUrl: imageDataUrl
    });
}

function aplicarTextoALibreOffice(shapeName, text) {
    if (!libreOfficeReady || isUpdating) return;
    if (!shapeName) return;
    
    isUpdating = true;
    showLoading();
    
    ipcRenderer.send('libreoffice-apply-text', {
        shapeName: shapeName,
        text: text
    });
    
    console.log(`📝 Texto enviado a forma: "${shapeName}" = "${text}"`);
}

function aplicarColorALibreOffice(shapeName, hexColor) {
    if (!libreOfficeReady || isUpdating) return;
    if (!shapeName) return;
    
    isUpdating = true;
    showLoading();
    
    ipcRenderer.send('libreoffice-apply-color', {
        shapeName: shapeName,
        hexColor: hexColor
    });
}

// ============================================================
// UTILIDADES
// ============================================================
function obtenerNombreForma(vistaId, cuadroIndex) {
    if (vistaId === 'vista-personajes') {
        return MAPEO_PERSONAJES[cuadroIndex] || null;
    } else if (vistaId === 'vista-fondos') {
        return MAPEO_FONDOS[cuadroIndex] || null;
    }
    return null;
}

function showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}

function showError(message) {
    console.error('Error:', message);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================
// INICIALIZACIÓN DE LA APP
// ============================================================
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
    
    console.log('✅ Interfaz lista');
}

// ============================================================
// CLICK EN DIAPOSITIVAS
// ============================================================
function configurarClickDiapositivas() {
    const items = document.querySelectorAll('.diapositiva-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const slideNum = item.dataset.slide;
            console.log(`📄 Diapositiva ${slideNum} seleccionada`);
            
            // Quitar selección anterior
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Aquí podrías abrir un modal con la diapositiva ampliada
        });
    });
}

// ============================================================
// TABS, DRAG & DROP, CAMPOS
// ============================================================
function configurarTabs() {
    const buttons = document.querySelectorAll(".tabs-lateral .tab-superior");
    const views = document.querySelectorAll(".vista-tab");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");
            buttons.forEach(b => b.classList.toggle("activo", b === btn));
            views.forEach(view => {
                const isTarget = view.id === `vista-${target}`;
                view.classList.toggle("activo", isTarget);
            });
        });
    });
}

function configurarDragDrop() {
    let elementoArrastrado = null;
    
    const cuadros = document.querySelectorAll('.drop-zone');
    const papeleras = document.querySelectorAll('.item-basura-personajes, .item-basura-fondos');
    
    cuadros.forEach(cuadro => {
        cuadro.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        cuadro.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const archivo = e.dataTransfer.files[0];
                if (archivo.type.startsWith('image/')) {
                    cargarImagenEnCuadro(cuadro, archivo);
                }
                return;
            }
            
            if (elementoArrastrado && elementoArrastrado !== cuadro) {
                intercambiarContenido(elementoArrastrado, cuadro);
            }
        });
        
        cuadro.addEventListener('dragstart', (e) => {
            elementoArrastrado = cuadro;
            cuadro.classList.add('dragging');
        });
        
        cuadro.addEventListener('dragend', (e) => {
            cuadro.classList.remove('dragging');
            elementoArrastrado = null;
        });
        
        cuadro.addEventListener('click', (e) => {
            const img = cuadro.querySelector('img');
            if (img && !cuadro.classList.contains('dragging')) {
                abrirEditor(img.src);
            }
        });
    });
    
    papeleras.forEach(papelera => {
        papelera.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (elementoArrastrado) papelera.classList.add('drag-over');
        });
        
        papelera.addEventListener('dragleave', () => {
            papelera.classList.remove('drag-over');
        });
        
        papelera.addEventListener('drop', (e) => {
            e.preventDefault();
            papelera.classList.remove('drag-over');
            if (elementoArrastrado) restaurarCuadro(elementoArrastrado);
        });
    });
    
    function cargarImagenEnCuadro(cuadro, archivo) {
        const reader = new FileReader();
        reader.onload = (event) => {
            cuadro.innerHTML = '';
            const img = document.createElement('img');
            img.src = event.target.result;
            cuadro.appendChild(img);
            cuadro.dataset.tieneImagen = 'true';
            guardarEstado();
        };
        reader.readAsDataURL(archivo);
    }
    
    function intercambiarContenido(origen, destino) {
        const imgOrigen = origen.querySelector('img');
        const imgDestino = destino.querySelector('img');
        
        if (imgOrigen && imgDestino) {
            const tempSrc = imgOrigen.src;
            imgOrigen.src = imgDestino.src;
            imgDestino.src = tempSrc;
        } else if (imgOrigen && !imgDestino) {
            destino.innerHTML = '';
            const imgNueva = document.createElement('img');
            imgNueva.src = imgOrigen.src;
            destino.appendChild(imgNueva);
            destino.dataset.tieneImagen = 'true';
            restaurarCuadro(origen);
        } else if (!imgOrigen && imgDestino) {
            origen.innerHTML = '';
            const imgNueva = document.createElement('img');
            imgNueva.src = imgDestino.src;
            origen.appendChild(imgNueva);
            origen.dataset.tieneImagen = 'true';
            restaurarCuadro(destino);
        }
        
        guardarEstado();
    }
    
    function restaurarCuadro(cuadro) {
        const contenidoOriginal = cuadro.dataset.originalContent;
        
        if (contenidoOriginal === 'LOGO') {
            cuadro.innerHTML = '<span class="texto-logo">LOGO</span>';
        } else if (contenidoOriginal === 'A' || contenidoOriginal === 'B' || contenidoOriginal === 'C') {
            cuadro.innerHTML = `<span>${contenidoOriginal}</span>`;
        } else {
            cuadro.innerHTML = '+';
        }
        
        delete cuadro.dataset.tieneImagen;
        guardarEstado();
    }
    
    function abrirEditor(imagenSrc) {
        localStorage.setItem('imagen-editor', imagenSrc);
        ipcRenderer.send('open-editor-window');
    }
}

function configurarCampos() {
    const tematica = document.getElementById('tematica');
    if (tematica) {
        tematica.addEventListener('input', (e) => {
            const valor = e.target.value;
            if (valor.length > 0) {
                e.target.value = valor.charAt(0).toUpperCase() + valor.slice(1);
            }
        });
    }
    
    const selectNombre = document.getElementById("nombre-input");
    const preview = document.getElementById("preview-texto");
    
    if (selectNombre && preview) {
        function updatePreview() {
            const selectedValue = selectNombre.options[selectNombre.selectedIndex].text;
            preview.textContent = selectedValue === 'Nombre:' ? 'NOMBRE' : selectedValue.replace('Nombre: ', '').toUpperCase();
        }
        
        selectNombre.addEventListener('change', () => {
            updatePreview();
            guardarEstado();
        });
        
        updatePreview();
    }
    
    const edadInput = document.getElementById("edad");
    if (edadInput) {
        edadInput.addEventListener('wheel', (e) => {
            e.preventDefault();
            let valor = parseInt(edadInput.value) || 1;
            
            if (e.deltaY < 0) {
                if (valor < 50) valor++;
            } else {
                if (valor > 1) valor--;
            }
            
            edadInput.value = valor;
            guardarEstado();
        });
    }
}

function configurarVentanas() {
    const preview = document.getElementById("preview-texto");
    if (preview) {
        preview.addEventListener("click", () => {
            ipcRenderer.send('open-disenador-window');
        });
    }
    
    const btnRecolectar = document.querySelector('.btn-texto-recolectar');
    if (btnRecolectar) {
        btnRecolectar.addEventListener('click', () => {
            ipcRenderer.send('open-recolector-window');
        });
    }
}

console.log('✅ Script cargado');