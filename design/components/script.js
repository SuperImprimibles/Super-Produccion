// ============================================================
// CÓDIGO COMPLETO CONSOLIDADO PARA script.js
// Incluye P1, P2, P3, P4, P5, P7, P8, P9, P10 y Módulos IA/Historial
// ============================================================

// ============================================================
// P1: VARIABLES GLOBALES PARA MÓDULOS ADICIONALES (DEBEN IR AL INICIO)
// ============================================================
let groqModule = null;
let aiModeController = null;
let validationSystem = null;
let materialHistory = null;
// Necesario para P10
const path = require('path');
const fs = require('fs');
const libreOfficeExporter = {
    getSlideImagePath: (index) => path.join(__dirname, '../temp', `slide-${index}.png`)
};


// ============================================================
// P2: CONEXIÓN LIBREOFFICE ↔ UI (AGREGAR DESPUÉS DE guardarEstado())
// ============================================================

/**
 * Función para enviar el estado actual de la UI a LibreOffice
 * para que se reflejen los cambios en el documento PPTX.
 * @since P2
 */
function aplicarCambiosALibreOffice() {
    if (!window.libreOfficeReady) return;

    const { ipcRenderer } = require('electron');

    // 1. Aplicar imágenes de personajes
    const vistaPersonajes = document.getElementById('vista-personajes');
    const cuadrosPersonajes = vistaPersonajes?.querySelectorAll('.drop-zone') || [];

    cuadrosPersonajes.forEach((cuadro, index) => {
        const img = cuadro.querySelector('img');
        if (img && img.src && index < 12) {
            ipcRenderer.send('libreoffice-apply-image', {
                shapeName: `PNG ${index + 1}`,
                imageDataUrl: img.src
            });
        }
    });

    // 2. Aplicar fondos
    const vistaFondos = document.getElementById('vista-fondos');
    const cuadrosFondos = vistaFondos?.querySelectorAll('.drop-zone') || [];

    cuadrosFondos.forEach((cuadro, index) => {
        const img = cuadro.querySelector('img');
        if (img && img.src) {
            if (index < 12) {
                // Fondos normales
                ipcRenderer.send('libreoffice-apply-image', {
                    shapeName: `FONDO ${index + 1}`,
                    imageDataUrl: img.src
                });
            } else if (index >= 12 && index <= 14) {
                // Fondos especiales A, B, C
                const letra = ['A', 'B', 'C'][index - 12];
                ipcRenderer.send('libreoffice-apply-image', {
                    shapeName: `FONDO ${letra}`,
                    imageDataUrl: img.src
                });
            }
        }
    });

    // 3. Aplicar textos
    const tematica = document.getElementById('tematica')?.value;
    const nombre = document.getElementById('nombre-input')?.value;
    const edad = document.getElementById('edad')?.value;

    if (tematica) {
        ipcRenderer.send('libreoffice-apply-text', {
            shapeName: 'TEMATICA',
            text: tematica
        });
    }

    if (nombre) {
        ipcRenderer.send('libreoffice-apply-text', {
            shapeName: 'NOMBRE',
            text: nombre
        });
    }

    if (edad) {
        ipcRenderer.send('libreoffice-apply-text', {
            shapeName: 'EDAD',
            text: edad
        });
    }

    // 4. Aplicar colores
    const colores = document.querySelectorAll('#grupo-colores .color-circulo');
    colores.forEach((color, index) => {
        const shapeName = ['COLORPRIMARIO', 'COLORSECUNDARIO', 'COLORTERCIARIO'][index];
        if (shapeName && color.value) {
            ipcRenderer.send('libreoffice-apply-color', {
                shapeName: shapeName,
                hexColor: color.value
            });
        }
    });
}

// ============================================================
// P2 (Llamar después de cada cambio) - MODIFICAR guardarEstado()
// Nota: La implementación original de guardarEstado() no se muestra,
// pero se asume que existe y debe modificarse para incluir la llamada.
// ============================================================

// *** La función original guardarEstado() DEBE SER MODIFICADA así: ***
/*
function guardarEstado() {
    // ... código existente de guardado en localStorage ...

    // AGREGAR AL FINAL: (P2)
    aplicarCambiosALibreOffice();
}
*/

// ============================================================
// P5: IMPLEMENTACIÓN DEL BOTÓN "RECOLECTAR"
// ============================================================
const btnRecolectar = document.querySelector('.btn-texto-recolectar');
if (btnRecolectar) {
    btnRecolectar.addEventListener('click', () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('open-recolector-window');
        console.log('🪟 Abriendo ventana Recolector');
    });
}


// ============================================================
// P7 y P9: LISTENERS DE SINCRONIZACIÓN ENTRE VENTANAS (AGREGAR AL FINAL)
// Se usa 'storage' para sincronizar con ventanas secundarias (Editor/Recolector)
// ============================================================
window.addEventListener('storage', (e) => {
    // P7: Recepción de imagen editada
    if (e.key === 'imagen-editada') {
        const imagenEditada = localStorage.getItem('imagen-editada');
        // const config = JSON.parse(localStorage.getItem('imagen-config')); // No se usa aún

        // NOTA: Se necesita lógica para aplicar la imagen al cuadro
        // que se estaba editando (el contexto debe guardarse antes de abrir el editor).

        console.log('✅ Imagen editada recibida desde editor');

        // Limpiar
        localStorage.removeItem('imagen-editada');
        localStorage.removeItem('imagen-config');
    }

    // P9: Recepción de cambios del Recolector
    if (e.key === 'super-imprimibles-state') {
        console.log('🔄 Estado actualizado por Recolector');
        // Asumiendo que esta función existe para recargar todo el estado de la UI
        if (typeof cargarEstado === 'function') {
            cargarEstado(); // Recargar estado desde localStorage
        } else {
            console.warn('❌ Función cargarEstado() no definida.');
        }
    }
});


// ============================================================
// P3: EVENT LISTENERS PARA ACTUALIZACIÓN DE DIAPOSITIVAS (AGREGAR AL FINAL)
// ============================================================
const { ipcRenderer } = require('electron');

// Listener para cuando LibreOffice esté listo
ipcRenderer.on('libreoffice-ready', (event, data) => {
    console.log('✅ LibreOffice listo con', data.totalSlides, 'diapositivas');
    window.libreOfficeReady = true;

    // Solicitar diapositivas al iniciar (P3)
    ipcRenderer.send('libreoffice-get-all-slides', { count: 9 });
});

// Listener para actualizar TODAS las diapositivas
ipcRenderer.on('update-all-slides', (event, data) => {
    data.slides.forEach(slide => {
        // Asumiendo que las imágenes de vista previa tienen la clase preview-slide y data-slide="[index]"
        const img = document.querySelector(`.preview-slide[data-slide="${slide.index}"]`);
        if (img) {
            // Usar timestamp para forzar recarga de la imagen en caché
            img.src = `${slide.path}?t=${Date.now()}`;
            img.classList.remove('loading');
        }
    });

    // Asumiendo que esta función existe
    if (typeof ocultarLoading === 'function') {
        ocultarLoading();
    }
});

// Listener para actualizar diapositiva individual
ipcRenderer.on('update-slide-preview', (event, data) => {
    const img = document.querySelector(`.preview-slide[data-slide="${data.slideIndex}"]`);
    if (img) {
        img.src = `${data.imagePath}?t=${Date.now()}`;
        img.classList.remove('loading');
    }
});

// Listener para errores
ipcRenderer.on('libreoffice-error', (event, data) => {
    console.error('❌ Error LibreOffice:', data.message);
    if (typeof ocultarLoading === 'function') {
        ocultarLoading();
    }
    alert(`Error: ${data.message}`);
});


// ============================================================
// P4: CONFIGURACIÓN CLICK EN DIAPOSITIVAS (FUNCIÓN IMPLEMENTADA)
// ============================================================
function configurarClickDiapositivas() {
    // Asumiendo que '.diapositiva-item' es el contenedor del elemento de la diapositiva
    const diapositivas = document.querySelectorAll('.diapositiva-item');

    diapositivas.forEach((diap, index) => {
        diap.addEventListener('click', () => {
            // Remover selección anterior
            document.querySelectorAll('.diapositiva-item').forEach(d => {
                d.classList.remove('selected');
            });

            // Seleccionar actual
            diap.classList.add('selected');

            // Notificar a LibreOffice
            const slideIndex = index + 1; // Las diapositivas de LibreOffice son 1-based
            console.log(`📄 Diapositiva ${slideIndex} seleccionada`);

            // Opcional: Ir a esa diapositiva en LibreOffice
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('libreoffice-goto-slide', slideIndex);
        });
    });

    console.log('✅ Click en diapositivas configurado');
}


// ============================================================
// P10: IMPLEMENTACIÓN COMPLETA DE PUBLICACIÓN (FUNCIÓN NUEVA)
// ============================================================
/**
 * Función principal para iniciar el proceso de validación y publicación.
 * @since P10
 */
window.iniciarPublicacion = async function() {
    // Asumiendo que estas funciones existen globalmente
    if (typeof mostrarModalProgreso !== 'function' || typeof ocultarModalProgreso !== 'function') {
        console.error('❌ Funciones de modal de progreso no definidas.');
        return;
    }

    mostrarModalProgreso('📤 Publicando en MercadoLibre', 'Preparando producto...');

    try {
        const { ipcRenderer } = require('electron');

        // 1. Validar primero
        if (!validationSystem) {
            throw new Error('Sistema de validación no inicializado. Intenta reiniciar la aplicación.');
        }

        const validacion = validationSystem.validarTodo();
        if (!validacion.valido) {
            ocultarModalProgreso();
            validationSystem.mostrarModalValidacion(validacion); // Asumiendo que esta función existe
            return;
        }

        // 2. Guardar PowerPoint final
        const projectName = document.getElementById('tematica')?.value || 'Nuevo_Kit';
        const outputPath = path.join(__dirname, '../output', `Kit_${projectName}_${Date.now()}.pptx`);
        // Esta operación es asíncrona y depende de la implementación en main.js
        ipcRenderer.send('libreoffice-save-as', outputPath);

        // 3. Exportar 9 imágenes para MercadoLibre
        mostrarModalProgreso('📸 Generando imágenes', 'Exportando diapositivas...');

        const imagenes = [];
        // NOTA: La exportación de imágenes debe ser manejada por la lógica de LibreOffice en main.js,
        // esto es una simulación de dónde deberían estar las rutas después de la exportación.
        for (let i = 1; i <= 9; i++) {
            const imgPath = libreOfficeExporter.getSlideImagePath(i);
            // Simulación: verificamos si la imagen fue exportada
            // En un flujo real, ipcRenderer debería notificar que la exportación terminó.
            if (fs.existsSync(imgPath)) {
                imagenes.push(imgPath);
            }
        }

        // 4. Preparar datos
        const datos = {
            tematica: document.getElementById('tematica').value,
            nombre: document.getElementById('nombre-input').value,
            edad: parseInt(document.getElementById('edad').value),
            publico: document.getElementById('publico').value,
            precio: 4000,
            imagenes: imagenes,
            personaje: '',
            ocasiones: []
        };

        // 5. Generar campos con IA
        if (groqModule) {
            mostrarModalProgreso('🤖 Generando descripción', 'La IA está optimizando tu publicación...');
            // Asumiendo que groqModule.generarCamposMercadoLibre existe
            const camposMeli = await groqModule.generarCamposMercadoLibre(datos.tematica, datos.ocasiones);
            datos.personaje = camposMeli.personaje || datos.personaje;
            datos.ocasiones = camposMeli.ocasiones || datos.ocasiones;
        }

        // 6. Publicar
        mostrarModalProgreso('📤 Publicando', 'Subiendo a MercadoLibre...');

        // Requiere que el archivo publisher sea accesible desde el renderer process (electron security context permitting)
        const MercadoLibrePublisher = require('../source/mercadolibre-publisher.js');
        const publisher = new MercadoLibrePublisher();

        // Asumiendo que publisher.publicarProducto existe
        const resultado = await publisher.publicarProducto(datos);

        ocultarModalProgreso();

        if (resultado.success) {
            mostrarModalExito(resultado.permalink); // Mostrar modal de éxito
        } else {
            throw new Error(resultado.message || 'Error desconocido al publicar');
        }

    } catch (error) {
        ocultarModalProgreso();
        console.error('❌ Error en publicación:', error);
        alert(`Error en Publicación: ${error.message}`);
    }
};

/**
 * Muestra el modal de éxito de la publicación.
 * @since P10
 */
function mostrarModalExito(permalink) {
    const modal = `
        <div class="modal-backdrop open" id="modal-exito">
            <div class="modal-content medium">
                <div class="modal-header">
                    <h2>✅ ¡Publicación Exitosa!</h2>
                    <button class="modal-close-btn" onclick="cerrarModalExito()">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: #00ff00; font-size: 18px; text-align: center; margin: 20px 0;">
                        Tu producto ha sido publicado en MercadoLibre
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${permalink}" target="_blank" class="btn-publicar" style="display: inline-block; text-decoration: none;">
                            Ver Publicación
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

/**
 * Cierra el modal de éxito.
 * @since P10
 */
window.cerrarModalExito = function() {
    document.getElementById('modal-exito')?.remove();
};


// ============================================================
// P8: CONFIGURAR DRAG & DROP (Implementación de Drag Historial y Drop Papelera)
// Nota: Se reemplaza la función configurarDragDrop() existente.
// ============================================================
function configurarDragDrop() {
    const dropZones = document.querySelectorAll('.drop-zone');
    const dragItems = document.querySelectorAll('.drag-item');
    const trashZone = document.getElementById('papelera'); // Asumiendo que hay un elemento con id="papelera"

    // 1. Drag de elementos de la barra lateral (dragItems)
    dragItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.imgSrc);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    // 2. Manejo de Drop en las zonas (DropZones)
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const dataUrl = e.dataTransfer.getData('text/plain');
            const files = e.dataTransfer.files;

            if (files && files.length > 0) {
                // Drop desde el explorador (P8: Drop de imágenes desde computadora)
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const newImg = document.createElement('img');
                        newImg.src = event.target.result;
                        newImg.alt = 'Material';
                        newImg.draggable = true;
                        
                        // Limpiar y añadir
                        zone.innerHTML = '';
                        zone.appendChild(newImg);
                        
                        // Guardar en historial (Si es una zona de personaje o fondo)
                        const tipo = zone.closest('#vista-personajes') ? 'Personaje' : 'Fondo';
                        const tematica = document.getElementById('tematica')?.value || 'Sin definir';
                        agregarImagenAlHistorial(event.target.result, tipo, tematica);
                        
                        guardarEstado(); // Notificar cambio y aplicar a LibreOffice (P2)
                    };
                    reader.readAsDataURL(file);
                }
            } else if (dataUrl) {
                // Drop desde la barra lateral o Historial (P8: Drag desde historial → Cuadros)
                const newImg = document.createElement('img');
                newImg.src = dataUrl;
                newImg.alt = 'Material';
                newImg.draggable = true;

                zone.innerHTML = '';
                zone.appendChild(newImg);

                guardarEstado(); // Notificar cambio y aplicar a LibreOffice (P2)
            }
        });
    });
    
    // 3. Drop en Papelera (P8: Drag a papelera)
    if (trashZone) {
        trashZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            trashZone.classList.add('drag-over-trash');
        });

        trashZone.addEventListener('dragleave', () => {
            trashZone.classList.remove('drag-over-trash');
        });

        trashZone.addEventListener('drop', (e) => {
            e.preventDefault();
            trashZone.classList.remove('drag-over-trash');
            
            // Simplemente limpia la imagen de la zona que se está arrastrando
            const draggingElement = document.querySelector('.drop-zone.dragging');
            if (draggingElement) {
                 draggingElement.innerHTML = '';
                 draggingElement.classList.remove('dragging');
                 guardarEstado(); // Notificar cambio y aplicar a LibreOffice (P2)
            }
        });
    }
    
    // 4. Drag entre cuadros (P8: Drag entre cuadros)
    document.querySelectorAll('.drop-zone img').forEach(img => {
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.src);
            e.dataTransfer.effectAllowed = 'move';
            e.target.closest('.drop-zone').classList.add('dragging'); // Marca el origen
        });
        
        img.addEventListener('dragend', (e) => {
            // Limpia el origen si el drop fue exitoso
            if (e.dataTransfer.dropEffect === 'move') {
                e.target.closest('.drop-zone').innerHTML = '';
                e.target.closest('.drop-zone').classList.remove('dragging');
                guardarEstado(); // Notificar cambio
            }
        });
    });


    console.log('✅ Drag & Drop configurado, incluyendo historial y papelera');
}
// Fin P8


// ============================================================
// Funciones del código complementario (Historial, IA, Validación)
// Se deben colocar DESPUÉS del código existente (P1.3)
// ============================================================

// A PARTIR DE AQUÍ VA EL CÓDIGO COMPLEMENTARIO PROPORCIONADO POR EL USUARIO

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
            // Asumiendo que esta función existe globalmente
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('🧹 Historial limpiado');
            }
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
        // Asumiendo que AIModeController toma groqModule como dependencia
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
        // Asumiendo que esta función existe globalmente
        if (typeof mostrarModalProgreso !== 'function' || typeof ocultarModalProgreso !== 'function') {
            console.error('❌ Funciones de modal de progreso no definidas.');
            return;
        }

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

        // Aplicar sugerencias (Asumiendo que esta función existe en groq-ai-module)
        const resultado = await groqModule.aplicarSugerenciasCompletas(config);

        ocultarModalProgreso();

        if (resultado.aplicado) {
            // Aplicar colores sugeridos
            if (resultado.colores && resultado.colores.length >= 3) {
                const selectoresColor = document.querySelectorAll('#grupo-colores .color-circulo');
                resultado.colores.forEach((color, index) => {
                    if (selectoresColor[index]) {
                        selectoresColor[index].value = color;
                        // Forzar el evento change para que guarde el estado (P2)
                        selectoresColor[index].dispatchEvent(new Event('change'));
                    }
                });
            }

            // Aplicar edad si fue sugerida
            if (resultado.edad) {
                const edadInput = document.getElementById('edad');
                if (edadInput) {
                    edadInput.value = resultado.edad;
                    // Forzar el evento change para que guarde el estado (P2)
                    edadInput.dispatchEvent(new Event('change'));
                }
            }

            // Guardar análisis de logo
            if (resultado.analisisLogo) {
                localStorage.setItem('logo-analisis', JSON.stringify(resultado.analisisLogo));
            }

            // Guardar campos de MercadoLibre
            if (resultado.mercadolibre) {
                localStorage.setItem('mercadolibre-campos', JSON.stringify(resultado.mercadolibre));
            }

            mostrarModalResultadosIA(resultado);
            // Guardar estado llama a aplicarCambiosALibreOffice() (P2)
            if (typeof guardarEstado === 'function') {
                 guardarEstado(); 
            }

        } else {
             // Asumiendo que esta función existe globalmente
            if (typeof mostrarError === 'function') {
                mostrarError('No se pudieron aplicar sugerencias IA');
            }
        }

    } catch (error) {
        ocultarModalProgreso();
        console.error('❌ Error aplicando sugerencias IA:', error);
         // Asumiendo que esta función existe globalmente
        if (typeof mostrarError === 'function') {
            mostrarError('Error en procesamiento IA: ' + error.message);
        }
    }
}

// ============================================================
// OBTENER LOGO COMO DATA URL
// ============================================================
function obtenerLogoDataUrl() {
    const vistaPersonajes = document.getElementById('vista-personajes');
    if (!vistaPersonajes) return null;

    const cuadros = vistaPersonajes.querySelectorAll('.drop-zone');
    // Índice 12 = LOGO (basado en la estructura del código)
    const cuadroLogo = cuadros[12]; 

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

    // Mostrar modal de validación (Asumiendo que esta función existe)
    validationSystem.mostrarModalValidacion(resultados);

    return resultados.valido;
}

// ============================================================
// CONFIGURAR BOTÓN DE PUBLICAR (Modificado para usar iniciarPublicacion)
// @since P1 y P10
// ============================================================
function configurarBotonPublicar() {
    const btnPublicar = document.querySelector('.btn-publicar');
    if (!btnPublicar) return;

    // Remover listener anterior si existe
    const nuevoBtn = btnPublicar.cloneNode(true);
    btnPublicar.parentNode.replaceChild(nuevoBtn, btnPublicar);

    // Agregar nuevo listener que llama al proceso completo de publicación (P10)
    nuevoBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Llama a la función implementada en P10
        await window.iniciarPublicacion(); 
    });

    console.log('✅ Botón Publicar configurado con validación y publicación (P10)');
}

// ============================================================
// P1: FUNCIÓN inicializarApp() MODIFICADA
// ============================================================

/**
 * Función principal de inicialización de la interfaz.
 * Incluye la inicialización tardía de Historial, Validación e IA.
 * @since P1 (Modificación)
 */
function inicializarApp() {
    console.log('🚀 Inicializando interfaz...');

    const btnNuevo = document.getElementById('btn-nuevo-proyecto');
    // Asumiendo que limpiarTodo existe
    if (btnNuevo) btnNuevo.addEventListener('click', limpiarTodo);

    // Configurar listeners de cambio para guardar estado y aplicar a LibreOffice (P2)
    const camposConfig = ['tematica', 'nombre-input', 'edad', 'publico'];
    camposConfig.forEach(id => {
        const campo = document.getElementById(id);
        // Asumiendo que debounce y guardarEstado existen
        if (campo) {
            campo.addEventListener('change', guardarEstado);
            campo.addEventListener('input', debounce(guardarEstado, 1000));
        }
    });

    const colores = document.querySelectorAll('#grupo-colores .color-circulo');
    colores.forEach((color) => {
        color.addEventListener('change', () => guardarEstado());
    });
    
    // Asumiendo que las funciones de configuración base existen
    configurarDragDrop(); // P8
    configurarTabs();
    configurarCampos();
    configurarVentanas();
    configurarClickDiapositivas(); // P4
    
    // P1.2 - AGREGAR AL FINAL: Inicializar historial
    setTimeout(async () => {
        await inicializarHistorial();
    }, 1000);
    
    // P1.2 - AGREGAR AL FINAL: Inicializar validación
    setTimeout(() => {
        inicializarValidacion();
        configurarBotonPublicar(); // Conecta con validación y P10

        // Actualizar estado del botón cada vez que cambie algo
        document.addEventListener('change', () => {
            if (validationSystem && typeof validationSystem.actualizarEstadoBotonPublicar === 'function') {
                validationSystem.actualizarEstadoBotonPublicar();
            }
        });

        // Primera actualización
        if (validationSystem && typeof validationSystem.actualizarEstadoBotonPublicar === 'function') {
            validationSystem.actualizarEstadoBotonPublicar();
        }
    }, 1500);

    // P1.2 - AGREGAR AL FINAL: Inicializar Modo IA
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

// ============================================================
// FUNCIONES BASE FALTANTES PARA script.js
// Agregar ANTES de inicializarApp()
// ============================================================

const STORAGE_KEY = 'super-imprimibles-state';

// ============================================================
// GUARDAR ESTADO
// ============================================================
function guardarEstado() {
    const estado = {
        personajes: obtenerEstadoCuadros('vista-personajes'),
        fondos: obtenerEstadoCuadros('vista-fondos'),
        tematica: document.getElementById('tematica')?.value || '',
        nombre: document.getElementById('nombre-input')?.value || '',
        edad: document.getElementById('edad')?.value || '',
        publico: document.getElementById('publico')?.value || 'general',
        colores: Array.from(document.querySelectorAll('#grupo-colores .color-circulo') || []).map(c => c.value),
        timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    
    // Aplicar cambios a LibreOffice (P2)
    aplicarCambiosALibreOffice();
}

// ============================================================
// CARGAR ESTADO
// ============================================================
function cargarEstado() {
    const estadoStr = localStorage.getItem(STORAGE_KEY);
    if (!estadoStr) return;
    
    try {
        const estado = JSON.parse(estadoStr);
        
        // Restaurar cuadros
        restaurarEstadoCuadros('vista-personajes', estado.personajes);
        restaurarEstadoCuadros('vista-fondos', estado.fondos);
        
        // Restaurar campos
        if (estado.tematica) document.getElementById('tematica').value = estado.tematica;
        if (estado.nombre) document.getElementById('nombre-input').value = estado.nombre;
        if (estado.edad) document.getElementById('edad').value = estado.edad;
        if (estado.publico) document.getElementById('publico').value = estado.publico;
        
        // Restaurar colores
        if (estado.colores) {
            const selectoresColor = document.querySelectorAll('#grupo-colores .color-circulo');
            estado.colores.forEach((color, index) => {
                if (selectoresColor[index]) {
                    selectoresColor[index].value = color;
                }
            });
        }
        
    } catch (error) {
        console.error('Error cargando estado:', error);
    }
}

function obtenerEstadoCuadros(vistaId) {
    const vista = document.getElementById(vistaId);
    if (!vista) return [];
    
    const cuadros = vista.querySelectorAll('.drop-zone');
    const estado = [];
    
    cuadros.forEach((cuadro, index) => {
        const img = cuadro.querySelector('img');
        estado.push({
            index: index,
            tieneImagen: !!img,
            imagenSrc: img ? img.src : null,
            contenidoOriginal: cuadro.dataset.originalContent || null
        });
    });
    
    return estado;
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

// ============================================================
// CONFIGURAR TABS
// ============================================================
function configurarTabs() {
    const buttons = document.querySelectorAll('.tabs-lateral .tab-superior');
    const views = document.querySelectorAll('.vista-tab');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            
            buttons.forEach(b => b.classList.toggle('activo', b === btn));
            
            views.forEach(view => {
                const isTarget = view.id === `vista-${target}`;
                view.classList.toggle('activo', isTarget);
            });
        });
    });
}

// ============================================================
// CONFIGURAR CAMPOS
// ============================================================
function configurarCampos() {
    // Preview de texto
    const previewTexto = document.getElementById('preview-texto');
    const nombreInput = document.getElementById('nombre-input');
    
    if (previewTexto && nombreInput) {
        nombreInput.addEventListener('change', () => {
            previewTexto.textContent = nombreInput.value || 'NOMBRE';
        });
    }
    
    // Click en preview abre diseñador
    if (previewTexto) {
        previewTexto.addEventListener('click', () => {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('open-disenador-window');
        });
    }
}

// ============================================================
// CONFIGURAR VENTANAS
// ============================================================
function configurarVentanas() {
    // Los listeners de IPC ya están en main.js
    console.log('✅ Ventanas configuradas');
}

// ============================================================
// LIMPIAR TODO
// ============================================================
function limpiarTodo() {
    if (!confirm('¿Estás seguro de que quieres limpiar todo el proyecto?')) {
        return;
    }
    
    // Limpiar cuadros de personajes
    const vistaPersonajes = document.getElementById('vista-personajes');
    if (vistaPersonajes) {
        const cuadros = vistaPersonajes.querySelectorAll('.drop-zone');
        cuadros.forEach(cuadro => {
            const contenidoOriginal = cuadro.dataset.originalContent;
            if (contenidoOriginal === 'LOGO') {
                cuadro.innerHTML = '<span class="texto-logo">LOGO</span>';
            } else if (!cuadro.classList.contains('item-basura-personajes')) {
                cuadro.innerHTML = '+';
            }
            delete cuadro.dataset.tieneImagen;
        });
    }
    
    // Limpiar cuadros de fondos
    const vistaFondos = document.getElementById('vista-fondos');
    if (vistaFondos) {
        const cuadros = vistaFondos.querySelectorAll('.drop-zone');
        cuadros.forEach(cuadro => {
            const contenidoOriginal = cuadro.dataset.originalContent;
            if (['A', 'B', 'C'].includes(contenidoOriginal)) {
                cuadro.innerHTML = `<span>${contenidoOriginal}</span>`;
            } else if (!cuadro.classList.contains('item-basura-fondos')) {
                cuadro.innerHTML = '+';
            }
            delete cuadro.dataset.tieneImagen;
        });
    }
    
    // Limpiar campos
    document.getElementById('tematica').value = '';
    document.getElementById('nombre-input').selectedIndex = 0;
    document.getElementById('edad').value = '';
    document.getElementById('publico').selectedIndex = 0;
    
    // Limpiar colores
    document.querySelectorAll('#grupo-colores .color-circulo').forEach(c => {
        c.value = '#0d0d0d';
    });
    
    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('super-imprimibles-state-texto');
    
    console.log('🧹 Proyecto limpiado');
}

// ============================================================
// DEBOUNCE
// ============================================================
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
// MODALES DE PROGRESO
// ============================================================
function mostrarModalProgreso(titulo, mensaje) {
    const modal = `
        <div class="modal-backdrop open" id="modal-progreso">
            <div class="modal-content medium">
                <div class="modal-header">
                    <h2>${titulo}</h2>
                </div>
                <div class="modal-body" style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <div class="loading-text" style="margin-top: 20px;">${mensaje}</div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function ocultarModalProgreso() {
    const modal = document.getElementById('modal-progreso');
    if (modal) modal.remove();
}

// ============================================================
// NOTIFICACIONES
// ============================================================
function mostrarNotificacion(mensaje) {
    console.log('💬', mensaje);
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00ff00;
        color: #000;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function mostrarError(mensaje) {
    console.error('❌', mensaje);
    alert(mensaje);
}

// ============================================================
// ANIMACIONES CSS (agregar a style.css)
// ============================================================
const animationsCSS = `
@keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
}
`;

// Inyectar animaciones
const styleSheet = document.createElement('style');
styleSheet.textContent = animationsCSS;
document.head.appendChild(styleSheet);