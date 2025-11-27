// ============================================================
// SUPER EDITOR - Con integración de rembg
// ============================================================

const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let rembgProcessor = null;
let imagenOriginal = null;
let imagenProcesada = null;
let canvas = null;
let ctx = null;

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================================
    // INICIALIZAR REMBG PROCESSOR
    // ============================================================
    try {
        const RembgProcessor = require('../../source/rembg-processor.js');
        rembgProcessor = new RembgProcessor();
        console.log('✅ Rembg Processor inicializado');
    } catch (error) {
        console.error('❌ Error inicializando rembg:', error);
    }
    
    // ============================================================
    // CONFIGURACIÓN DEL CANVAS
    // ============================================================
    canvas = document.getElementById('canvas-editor');
    ctx = canvas.getContext('2d');
    
    // Variables de estado
    let dibujando = false;
    let herramientaActual = 'lapiz';
    let grosorActual = 5;
    
    // Historial para deshacer/rehacer
    let historial = [];
    let historialIndex = -1;
    
    // Inicializar canvas con fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    guardarEnHistorial();
    
    // ============================================================
    // CARGAR IMAGEN Y PROCESAR CON REMBG
    // ============================================================
    const imagenGuardada = localStorage.getItem('imagen-editor');
    if (imagenGuardada) {
        cargarYProcesarImagen(imagenGuardada);
        localStorage.removeItem('imagen-editor');
    }
    
    async function cargarYProcesarImagen(dataUrl) {
        mostrarLoading('Procesando imagen con rembg...');
        
        try {
            // Guardar imagen original
            imagenOriginal = dataUrl;
            
            if (!rembgProcessor) {
                throw new Error('rembg no está disponible');
            }
            
            // Convertir dataUrl a archivo temporal
            const tempPath = rembgProcessor.dataUrlToFile(dataUrl);
            
            // Procesar con rembg
            const result = await rembgProcessor.processImage(tempPath, null, {
                model: 'u2net',
                alphaMatting: true,
                alphaMattingForegroundThreshold: 240,
                alphaMattingBackgroundThreshold: 10,
                postProcessMask: true
            });
            
            if (result.success) {
                // Convertir resultado a dataUrl
                imagenProcesada = rembgProcessor.fileToDataUrl(result.outputPath);
                
                // Mostrar en canvas
                cargarImagenEnCanvas(imagenProcesada);
                
                ocultarLoading();
                mostrarNotificacion(`✅ Imagen procesada en ${result.duration}s`);
                
                // Limpiar archivos temporales
                fs.unlinkSync(tempPath);
                fs.unlinkSync(result.outputPath);
            }
            
        } catch (error) {
            console.error('Error procesando imagen:', error);
            ocultarLoading();
            mostrarError('No se pudo procesar la imagen con rembg. ¿Está instalado?');
            
            // Cargar imagen original sin procesar
            cargarImagenEnCanvas(imagenOriginal);
        }
    }
    
    function cargarImagenEnCanvas(dataUrl) {
        const img = new Image();
        img.onload = function() {
            // Limpiar canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar imagen centrada y escalada
            const escala = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * escala) / 2;
            const y = (canvas.height - img.height * escala) / 2;
            ctx.drawImage(img, x, y, img.width * escala, img.height * escala);
            
            guardarEnHistorial();
        };
        img.src = dataUrl;
    }
    
    // ============================================================
    // SLIDERS - POSICIÓN
    // ============================================================
    const sliderAncho = document.getElementById('slider-ancho');
    const valorAncho = document.getElementById('valor-ancho');
    const sliderAlto = document.getElementById('slider-alto');
    const valorAlto = document.getElementById('valor-alto');
    const sliderDispX = document.getElementById('slider-disp-x');
    const valorDispX = document.getElementById('valor-disp-x');
    const sliderDispY = document.getElementById('slider-disp-y');
    const valorDispY = document.getElementById('valor-disp-y');
    
    sliderAncho.addEventListener('input', (e) => {
        valorAncho.textContent = e.target.value;
    });
    
    sliderAlto.addEventListener('input', (e) => {
        valorAlto.textContent = e.target.value;
    });
    
    sliderDispX.addEventListener('input', (e) => {
        valorDispX.textContent = e.target.value;
    });
    
    sliderDispY.addEventListener('input', (e) => {
        valorDispY.textContent = e.target.value;
    });
    
    // ============================================================
    // SLIDERS - SOMBRAS
    // ============================================================
    const sombraColor = document.getElementById('sombra-color');
    const sliderSombraTamano = document.getElementById('slider-sombra-tamano');
    const valorSombraTamano = document.getElementById('valor-sombra-tamano');
    const sliderSombraTransparencia = document.getElementById('slider-sombra-transparencia');
    const valorSombraTransparencia = document.getElementById('valor-sombra-transparencia');
    const sliderSombraDesenfoque = document.getElementById('slider-sombra-desenfoque');
    const valorSombraDesenfoque = document.getElementById('valor-sombra-desenfoque');
    const sliderSombraAngulo = document.getElementById('slider-sombra-angulo');
    const valorSombraAngulo = document.getElementById('valor-sombra-angulo');
    const sliderSombraDistancia = document.getElementById('slider-sombra-distancia');
    const valorSombraDistancia = document.getElementById('valor-sombra-distancia');
    
    sliderSombraTamano.addEventListener('input', (e) => {
        valorSombraTamano.textContent = e.target.value;
    });
    
    sliderSombraTransparencia.addEventListener('input', (e) => {
        valorSombraTransparencia.textContent = e.target.value;
    });
    
    sliderSombraDesenfoque.addEventListener('input', (e) => {
        valorSombraDesenfoque.textContent = e.target.value;
    });
    
    sliderSombraAngulo.addEventListener('input', (e) => {
        valorSombraAngulo.textContent = e.target.value + '°';
    });
    
    sliderSombraDistancia.addEventListener('input', (e) => {
        valorSombraDistancia.textContent = e.target.value;
    });
    
    // ============================================================
    // SLIDERS - ILUMINACIÓN
    // ============================================================
    const iluminacionColor = document.getElementById('iluminacion-color');
    const sliderIluminacionTamano = document.getElementById('slider-iluminacion-tamano');
    const valorIluminacionTamano = document.getElementById('valor-iluminacion-tamano');
    const sliderIluminacionTransparencia = document.getElementById('slider-iluminacion-transparencia');
    const valorIluminacionTransparencia = document.getElementById('valor-iluminacion-transparencia');
    const sliderIluminacionDesenfoque = document.getElementById('slider-iluminacion-desenfoque');
    const valorIluminacionDesenfoque = document.getElementById('valor-iluminacion-desenfoque');
    
    sliderIluminacionTamano.addEventListener('input', (e) => {
        valorIluminacionTamano.textContent = e.target.value;
    });
    
    sliderIluminacionTransparencia.addEventListener('input', (e) => {
        valorIluminacionTransparencia.textContent = e.target.value;
    });
    
    sliderIluminacionDesenfoque.addEventListener('input', (e) => {
        valorIluminacionDesenfoque.textContent = e.target.value;
    });
    
    // ============================================================
    // BOTONES DE BORDES
    // ============================================================
    const botonesBorde = document.querySelectorAll('.btn-borde');
    
    botonesBorde.forEach(btn => {
        btn.addEventListener('click', function() {
            botonesBorde.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
            console.log('Borde seleccionado:', this.getAttribute('data-borde'));
        });
    });
    
    // ============================================================
    // FUNCIONALIDAD RUEDA DEL MOUSE PARA SLIDERS
    // ============================================================
    document.querySelectorAll('.slider-control').forEach(slider => {
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            let valor = parseInt(slider.value) || 0;
            const min = parseInt(slider.min) || 0;
            const max = parseInt(slider.max) || 100;
            
            if (e.deltaY < 0) {
                if (valor < max) valor++;
            } else {
                if (valor > min) valor--;
            }
            
            slider.value = valor;
            slider.dispatchEvent(new Event('input'));
        });
    });
    
    // Control con rueda sobre valores numéricos
    document.querySelectorAll('.valor-display').forEach(display => {
        display.addEventListener('wheel', e => {
            e.preventDefault();
            const id = display.id.replace('valor-', 'slider-');
            const slider = document.getElementById(id);
            if (!slider) return;
            
            const step = slider.step ? parseInt(slider.step) : 1;
            if (e.deltaY < 0) {
                slider.value = Math.min(parseInt(slider.value) + step, parseInt(slider.max));
            } else {
                slider.value = Math.max(parseInt(slider.value) - step, parseInt(slider.min));
            }
            
            display.textContent = slider.value + (id.includes('angulo') ? '°' : '');
            slider.dispatchEvent(new Event('input'));
        });
    });
    
    // ============================================================
    // FUNCIONES DE DIBUJO
    // ============================================================
    function iniciarDibujo(e) {
        dibujando = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function dibujar(e) {
        if (!dibujando) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineWidth = grosorActual;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (herramientaActual === 'lapiz') {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (herramientaActual === 'borrador') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }
    
    function detenerDibujo() {
        if (dibujando) {
            guardarEnHistorial();
        }
        dibujando = false;
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
    }
    
    // ============================================================
    // EVENTOS DEL CANVAS
    // ============================================================
    canvas.addEventListener('mousedown', iniciarDibujo);
    canvas.addEventListener('mousemove', dibujar);
    canvas.addEventListener('mouseup', detenerDibujo);
    canvas.addEventListener('mouseout', detenerDibujo);
    
    // ============================================================
    // BOTONES DE ACCIÓN
    // ============================================================
    const btnLapiz = document.getElementById('btn-lapiz');
    const btnBorrador = document.getElementById('btn-borrador');
    const btnEliminar = document.getElementById('btn-eliminar');
    
    function activarHerramienta(herramienta) {
        herramientaActual = herramienta;
        btnLapiz.classList.toggle('activo', herramienta === 'lapiz');
        btnBorrador.classList.toggle('activo', herramienta === 'borrador');
        
        if (herramienta === 'lapiz') {
            grosorActual = 5;
            canvas.style.cursor = 'crosshair';
        } else if (herramienta === 'borrador') {
            grosorActual = 20;
            canvas.style.cursor = 'crosshair';
        }
    }
    
    btnLapiz.addEventListener('click', () => {
        activarHerramienta('lapiz');
    });
    
    btnBorrador.addEventListener('click', () => {
        activarHerramienta('borrador');
    });
    
    btnEliminar.addEventListener('click', () => {
        if (confirm('¿Restaurar imagen original?')) {
            if (imagenProcesada) {
                cargarImagenEnCanvas(imagenProcesada);
            }
        }
    });
    
    activarHerramienta('lapiz');
    
    // ============================================================
    // HISTORIAL
    // ============================================================
    function guardarEnHistorial() {
        const imagenData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historial = historial.slice(0, historialIndex + 1);
        historial.push(imagenData);
        historialIndex++;
        
        if (historial.length > 50) {
            historial.shift();
            historialIndex--;
        }
    }
    
    // ============================================================
    // BOTÓN APLICAR
    // ============================================================
    const btnAplicar = document.getElementById('btn-aplicar-editor');
    
    btnAplicar.addEventListener('click', async () => {
        mostrarLoading('Aplicando cambios...');
        
        try {
            // Obtener imagen editada del canvas
            const editedDataUrl = canvas.toDataURL('image/png');
            
            // Guardar configuración de efectos
            const configuracion = {
                posicion: {
                    ancho: sliderAncho.value,
                    alto: sliderAlto.value,
                    dispX: sliderDispX.value,
                    dispY: sliderDispY.value
                },
                sombras: {
                    color: sombraColor.value,
                    tamano: sliderSombraTamano.value,
                    transparencia: sliderSombraTransparencia.value,
                    desenfoque: sliderSombraDesenfoque.value,
                    angulo: sliderSombraAngulo.value,
                    distancia: sliderSombraDistancia.value
                },
                iluminacion: {
                    color: iluminacionColor.value,
                    tamano: sliderIluminacionTamano.value,
                    transparencia: sliderIluminacionTransparencia.value,
                    desenfoque: sliderIluminacionDesenfoque.value
                },
                borde: document.querySelector('.btn-borde.activo')?.dataset.borde || '0'
            };
            
            // Guardar en localStorage para la ventana principal
            localStorage.setItem('imagen-editada', editedDataUrl);
            localStorage.setItem('imagen-config', JSON.stringify(configuracion));
            
            ocultarLoading();
            mostrarNotificacion('✅ Cambios aplicados');
            
            // Cerrar ventana después de 1 segundo
            setTimeout(() => {
                window.close();
            }, 1000);
            
        } catch (error) {
            console.error('Error aplicando cambios:', error);
            ocultarLoading();
            mostrarError('Error al aplicar cambios');
        }
    });
    
    // ============================================================
    // FUNCIONES DE UI
    // ============================================================
    function mostrarLoading(mensaje) {
        // Implementar modal de loading
        console.log('⏳', mensaje);
    }
    
    function ocultarLoading() {
        console.log('✅ Loading ocultado');
    }
    
    function mostrarNotificacion(mensaje) {
        console.log('💬', mensaje);
    }
    
    function mostrarError(mensaje) {
        console.error('❌', mensaje);
        alert(mensaje);
    }
    
    // ============================================================
    // ATAJOS DE TECLADO
    // ============================================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') btnLapiz.click();
        if (e.key === 'e' || e.key === 'E') btnBorrador.click();
        if (e.key === 'Enter') { e.preventDefault(); btnAplicar.click(); }
        if (e.key === 'Escape') { e.preventDefault(); window.close(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            btnEliminar.click();
        }
    });
    
    console.log('✅ Super Editor cargado correctamente');
});