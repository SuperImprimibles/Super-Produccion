// ============================================================
// SISTEMA DE CLICK DERECHO PARA MODO IA (TURQUESA)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================================
    // ELEMENTOS INDIVIDUALES CON .ai-enable
    // ============================================================
    const aiElements = document.querySelectorAll('.ai-enable');
    
    aiElements.forEach(element => {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            element.classList.toggle('ai-mode');
        });
    });
    
    // ============================================================
    // CAJAS COMPLETAS (Click derecho en el header H3)
    // ============================================================
    const aiBoxHeaders = document.querySelectorAll('.ai-box-header');
    
    aiBoxHeaders.forEach(header => {
        header.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const isActive = header.classList.toggle('ai-mode');
            
            // Encontrar la sección control
            const seccion = header.closest('.seccion-control');
            if (!seccion) return;
            
            if (isActive) {
                seccion.classList.add('ai-box-mode');
            } else {
                seccion.classList.remove('ai-box-mode');
            }
            
            // Aplicar a todos los controles de la sección
            const controls = seccion.querySelectorAll('.ai-enable');
            controls.forEach(control => {
                if (isActive) {
                    control.classList.add('ai-mode');
                } else {
                    control.classList.remove('ai-mode');
                }
            });
        });
    });
    
    // ============================================================
    // CONFIGURACIÓN DEL CANVAS
    // ============================================================
    const canvas = document.getElementById('canvas-editor');
    const ctx = canvas.getContext('2d');
    
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
    
    // Cargar imagen si existe en localStorage
    const imagenGuardada = localStorage.getItem('imagen-editor');
    if (imagenGuardada) {
        const img = new Image();
        img.onload = function() {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const escala = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * escala) / 2;
            const y = (canvas.height - img.height * escala) / 2;
            ctx.drawImage(img, x, y, img.width * escala, img.height * escala);
            
            guardarEnHistorial();
        };
        img.src = imagenGuardada;
        localStorage.removeItem('imagen-editor');
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
                // Scroll hacia arriba - aumentar
                if (valor < max) valor++;
            } else {
                // Scroll hacia abajo - disminuir
                if (valor > min) valor--;
            }
            
            slider.value = valor;
            
            // Disparar evento input para actualizar display
            const event = new Event('input');
            slider.dispatchEvent(event);
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
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Verde semitransparente para conservar
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (herramientaActual === 'borrador') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Rojo semitransparente para eliminar
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
        console.log('Herramienta: Lápiz - Marcar áreas a conservar');
    });
    
    btnBorrador.addEventListener('click', () => {
        activarHerramienta('borrador');
        console.log('Herramienta: Borrador - Marcar áreas a eliminar');
    });
    
    btnEliminar.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restaurar los cambios?')) {
            // Restaurar al último estado guardado en el historial
            if (historialIndex > 0) {
                historialIndex--;
                const imagenData = historial[historialIndex];
                ctx.putImageData(imagenData, 0, 0);
                console.log('Cambios restaurados');
            } else {
                console.log('No hay cambios para restaurar');
            }
        }
    });
    
    // Activar lápiz por defecto
    activarHerramienta('lapiz');
    
    // ============================================================
    // HISTORIAL (DESHACER/REHACER)
    // ============================================================
    function guardarEnHistorial() {
        const imagenData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historial = historial.slice(0, historialIndex + 1);
        historial.push(imagenData);
        historialIndex++;
        
        // Limitar historial a 50 estados
        if (historial.length > 50) {
            historial.shift();
            historialIndex--;
        }
    }
    
    // ============================================================
    // BOTÓN APLICAR
    // ============================================================
    const btnAplicar = document.getElementById('btn-aplicar-editor');
    
    btnAplicar.addEventListener('click', () => {
        console.log('Aplicando cambios del editor...');
        
        // Efecto visual
        btnAplicar.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btnAplicar.style.transform = '';
        }, 200);
        
        // Obtener configuración
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
            imagen: canvas.toDataURL()
        };
        
        console.log('Configuración aplicada:', configuracion);
        
        // Aquí se procesaría la imagen con las áreas marcadas
        alert('Imagen procesada. En la versión final aquí se aplicará la eliminación de fondo.');
    });
    
    // ============================================================
    // CARGAR IMAGEN
    // ============================================================
    const inputAbrirArchivo = document.getElementById('input-abrir-archivo');
    
    // Permitir drag & drop de imágenes
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.style.opacity = '0.5';
    });
    
    canvas.addEventListener('dragleave', () => {
        canvas.style.opacity = '1';
    });
    
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.style.opacity = '1';
        
        const archivo = e.dataTransfer.files[0];
        if (archivo && archivo.type.startsWith('image/')) {
            cargarImagen(archivo);
        }
    });
    
    function cargarImagen(archivo) {
        const reader = new FileReader();
        reader.onload = function(event) {
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
            img.src = event.target.result;
        };
        reader.readAsDataURL(archivo);
    }
    
    // ============================================================
    // ATAJOS DE TECLADO
    // ============================================================
    document.addEventListener('keydown', (e) => {
        // P: Lápiz
        if (e.key === 'p' || e.key === 'P') {
            btnLapiz.click();
        }
        
        // E: Borrador
        if (e.key === 'e' || e.key === 'E') {
            btnBorrador.click();
        }
        
        // Enter: Aplicar
        if (e.key === 'Enter') {
            e.preventDefault();
            btnAplicar.click();
        }
        
        // Esc: Cerrar ventana
        if (e.key === 'Escape') {
            e.preventDefault();
            window.close();
        }
        
        // Ctrl+Z: Restaurar
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            btnEliminar.click();
        }
    });
    
    console.log('Super Editor cargado correctamente');
});

// --- Control con rueda del mouse sobre las cajitas de valores ---
document.querySelectorAll('.valor-display').forEach(display => {
    display.addEventListener('wheel', e => {
        e.preventDefault();

        // Buscar el slider asociado
        const id = display.id.replace('valor-', 'slider-');
        const slider = document.getElementById(id);
        if (!slider) return;

        // Ajustar valor con la rueda
        const step = slider.step ? parseInt(slider.step) : 1;
        if (e.deltaY < 0) {
            slider.value = Math.min(parseInt(slider.value) + step, parseInt(slider.max));
        } else {
            slider.value = Math.max(parseInt(slider.value) - step, parseInt(slider.min));
        }

        // Actualizar texto mostrado
        display.textContent = slider.value + (id.includes('angulo') ? '°' : '');

        // Disparar evento input para que se refleje en el canvas
        slider.dispatchEvent(new Event('input'));
    });
});
