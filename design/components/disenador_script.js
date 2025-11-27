// ============================================================
// SISTEMA DE CLICK DERECHO PARA MODO IA (TURQUESA)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================================
    // ELEMENTOS INDIVIDUALES CON .ai-enable
    // ============================================================
    const aiElements = document.querySelectorAll('.ai-enable:not(.ai-box-header)');
    
    aiElements.forEach(element => {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            element.classList.toggle('ai-mode');
        });
    });
    
    // ============================================================
    // GRUPOS EXCLUSIVOS (OPCIÃ“N B)
    // ============================================================
    const aiGroups = document.querySelectorAll('.ai-group');
    
    aiGroups.forEach(group => {
        group.addEventListener('contextmenu', (e) => {
            // Solo si el click es en el contenedor, no en los botones
            if (e.target === group || e.target.closest('.grupo-herramientas') === group) {
                e.preventDefault();
                
                const buttons = group.querySelectorAll('.btn-tool.ai-enable, input[type="radio"].ai-enable');
                const isActive = !group.classList.contains('ai-group-mode');
                
                group.classList.toggle('ai-group-mode');
                
                buttons.forEach(btn => {
                    if (isActive) {
                        btn.classList.add('ai-mode');
                    } else {
                        btn.classList.remove('ai-mode');
                    }
                });
            }
        });
    });
    
    // ============================================================
    // CAJAS COMPLETAS (Click derecho en el header H3)
    // ============================================================
    const aiBoxHeaders = document.querySelectorAll('.ai-box-header');
    
    aiBoxHeaders.forEach(header => {
        header.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const box = header.closest('.ai-box');
            if (!box) return;
            
            const isActive = header.classList.toggle('ai-mode');
            
            if (isActive) {
                box.classList.add('ai-box-mode');
            } else {
                box.classList.remove('ai-box-mode');
            }
            
            // Aplicar a todos los controles de la caja
            const controls = box.querySelectorAll('.ai-enable');
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
    // CARGAR FUENTES DEL SISTEMA
    // ============================================================
    async function cargarFuentesSistema() {
        const selectFuente = document.getElementById('select-fuente');
        
        try {
            if ('queryLocalFonts' in window) {
                const fuentes = await window.queryLocalFonts();
                const nombresFuentes = [...new Set(fuentes.map(f => f.family))].sort();
                
                selectFuente.innerHTML = '';
                
                nombresFuentes.forEach(fuente => {
                    const option = document.createElement('option');
                    option.value = fuente;
                    option.textContent = fuente;
                    selectFuente.appendChild(option);
                });
            } else {
                console.log('API de fuentes locales no disponible, usando fuentes comunes');
                const fuentesComunes = [
                    'Aptos', 'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
                    'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
                    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Inter', 'Roboto'
                ].sort();
                
                selectFuente.innerHTML = '';
                fuentesComunes.forEach(fuente => {
                    const option = document.createElement('option');
                    option.value = fuente;
                    option.textContent = fuente;
                    selectFuente.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar fuentes:', error);
        }
    }
    
    cargarFuentesSistema();
    
    // ============================================================
    // FUNCIONALIDAD DE RUEDA DEL MOUSE PARA FUENTES
    // ============================================================
    const selectFuente = document.getElementById('select-fuente');
    if (selectFuente) {
        selectFuente.addEventListener('wheel', (e) => {
            e.preventDefault();
            const currentIndex = selectFuente.selectedIndex;
            const options = selectFuente.options;
            
            if (e.deltaY < 0) {
                // Scroll hacia arriba
                if (currentIndex > 0) {
                    selectFuente.selectedIndex = currentIndex - 1;
                }
            } else {
                // Scroll hacia abajo
                if (currentIndex < options.length - 1) {
                    selectFuente.selectedIndex = currentIndex + 1;
                }
            }
        });
    }
    
    // ============================================================
    // FUNCIONALIDAD DE RUEDA DEL MOUSE PARA TODOS LOS CONTROLES
    // ============================================================
    function agregarFuncionalidadRueda() {
        // Para el campo de tamaÃ±o de fuente (ahora es input number)
        const selectTamano = document.getElementById('select-tamano');
        if (selectTamano) {
            selectTamano.addEventListener('wheel', (e) => {
                e.preventDefault();
                let valor = parseInt(selectTamano.value) || 12;
                
                if (e.deltaY < 0) {
                    // Scroll hacia arriba - aumentar
                    if (valor < 500) valor++;
                } else {
                    // Scroll hacia abajo - disminuir
                    if (valor > 1) valor--;
                }
                
                selectTamano.value = valor;
            });
        }
        
        // Para todos los campos numÃ©ricos
        document.querySelectorAll('.control-row input[type="number"], .control-inputs input[type="number"], .valor-numerico').forEach(input => {
            input.addEventListener('wheel', (e) => {
                e.preventDefault();
                let valor = parseInt(input.value) || 0;
                const min = parseInt(input.min) || 0;
                const max = parseInt(input.max) || 100;
                
                if (e.deltaY < 0) {
                    // Scroll hacia arriba - aumentar
                    if (valor < max) valor++;
                } else {
                    // Scroll hacia abajo - disminuir
                    if (valor > min) valor--;
                }
                
                input.value = valor;
                
                // Sincronizar con el slider correspondiente
                const controlRow = input.closest('.control-row');
                if (controlRow) {
                    const slider = controlRow.querySelector('input[type="range"]');
                    if (slider) {
                        slider.value = valor;
                    }
                }
            });
        });
        
        // Para todos los sliders
        document.querySelectorAll('.control-row input[type="range"], .control-inputs input[type="range"]').forEach(slider => {
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
                
                // Sincronizar con el input numÃ©rico correspondiente
                const controlRow = slider.closest('.control-row');
                if (controlRow) {
                    const numInput = controlRow.querySelector('input[type="number"], .valor-numerico');
                    if (numInput) {
                        numInput.value = valor;
                    }
                }
            });
        });
    }
    
    agregarFuncionalidadRueda();
    
    // ============================================================
    // BOTONES A+ Y A- CON MANTENER PRESIONADO
    // ============================================================
    const btnAumentar = document.getElementById('btn-aumentar-tamano');
    const btnDisminuir = document.getElementById('btn-disminuir-tamano');
    const selectTamano = document.getElementById('select-tamano');
    
    let intervaloAumentar = null;
    let intervaloDisminuir = null;
    
    function aumentarTamano() {
        let valor = parseInt(selectTamano.value) || 12;
        if (valor < 500) {
            selectTamano.value = valor + 1;
        }
    }
    
    function disminuirTamano() {
        let valor = parseInt(selectTamano.value) || 12;
        if (valor > 1) {
            selectTamano.value = valor - 1;
        }
    }
    
    if (btnAumentar) {
        btnAumentar.addEventListener('mousedown', () => {
            aumentarTamano();
            intervaloAumentar = setInterval(aumentarTamano, 100);
        });
        
        btnAumentar.addEventListener('mouseup', () => {
            if (intervaloAumentar) {
                clearInterval(intervaloAumentar);
                intervaloAumentar = null;
            }
        });
        
        btnAumentar.addEventListener('mouseleave', () => {
            if (intervaloAumentar) {
                clearInterval(intervaloAumentar);
                intervaloAumentar = null;
            }
        });
    }
    
    if (btnDisminuir) {
        btnDisminuir.addEventListener('mousedown', () => {
            disminuirTamano();
            intervaloDisminuir = setInterval(disminuirTamano, 100);
        });
        
        btnDisminuir.addEventListener('mouseup', () => {
            if (intervaloDisminuir) {
                clearInterval(intervaloDisminuir);
                intervaloDisminuir = null;
            }
        });
        
        btnDisminuir.addEventListener('mouseleave', () => {
            if (intervaloDisminuir) {
                clearInterval(intervaloDisminuir);
                intervaloDisminuir = null;
            }
        });
    }
    
    // ============================================================
    // GRUPOS INDEPENDIENTES (B, I, S)
    // ============================================================
    document.querySelectorAll('.grupo-independiente .btn-tool').forEach(boton => {
        boton.addEventListener('click', () => {
            boton.classList.toggle('activo');
        });
    });
    
    // ============================================================
    // GRUPOS EXCLUSIVOS (solo uno activo por grupo) - CORREGIDO
    // ============================================================
    document.querySelectorAll('.grupo-exclusivo').forEach(grupo => {
        const botones = grupo.querySelectorAll('.btn-tool');
        
        botones.forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se propague al contenedor
                
                // Remover activo de todos los botones del grupo
                botones.forEach(b => b.classList.remove('activo'));
                
                // Activar el botÃ³n clickeado
                boton.classList.add('activo');
            });
        });
    });
    
    // ============================================================
    // MOSTRAR/OCULTAR CONTENIDO SEGÃšN OPCIÃ“N DE RELLENO
    // ============================================================
    const radioRellenos = document.querySelectorAll('input[name="relleno"]');
    const contenidoSolido = document.getElementById('contenido-solido');
    const contenidoDegrades = document.getElementById('contenido-degrades');
    const contenidoImagen = document.getElementById('contenido-imagen');
    
    radioRellenos.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const valor = e.target.value;
            
            contenidoSolido.style.display = 'none';
            contenidoDegrades.style.display = 'none';
            contenidoImagen.style.display = 'none';
            
            if (valor === 'solido') {
                contenidoSolido.style.display = 'flex';
            } else if (valor === 'degrades') {
                contenidoDegrades.style.display = 'flex';
            } else if (valor === 'imagen') {
                contenidoImagen.style.display = 'flex';
            }
        });
    });
    
    if (contenidoSolido) contenidoSolido.style.display = 'flex';
    
    // ============================================================
    // ACTUALIZAR COLOR DE FONDO DE LOS CÃRCULOS
    // ============================================================
    document.querySelectorAll('.color-circulo-estilo input[type="color"]').forEach(input => {
        input.parentElement.style.backgroundColor = input.value;
        
        input.addEventListener('input', (e) => {
            e.target.parentElement.style.backgroundColor = e.target.value;
        });
    });
    
    // ============================================================
    // SINCRONIZAR SLIDERS CON CAMPOS NUMÃ‰RICOS
    // ============================================================
    document.querySelectorAll('.control-row, .control-inputs').forEach(row => {
        const slider = row.querySelector('input[type="range"]');
        const numInput = row.querySelector('input[type="number"], .valor-numerico');
        
        if (slider && numInput) {
            slider.addEventListener('input', (e) => {
                numInput.value = e.target.value;
            });
            
            numInput.addEventListener('input', (e) => {
                const valor = parseInt(e.target.value) || 0;
                const min = parseInt(numInput.min) || 0;
                const max = parseInt(numInput.max) || 100;
                
                if (valor >= min && valor <= max) {
                    slider.value = valor;
                }
            });
        }
    });
    
    // ============================================================
    // SELECTOR DE IMAGEN
    // ============================================================
    const inputImagen = document.getElementById('input-imagen-relleno');
    if (inputImagen) {
        inputImagen.addEventListener('change', (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                console.log('Imagen seleccionada:', archivo.name);
            }
        });
    }
    
    // ============================================================
    // BOTÃ“N APLICAR
    // ============================================================
    const btnAplicar = document.querySelector('.btn-aplicar');
    
    if (btnAplicar) {
        btnAplicar.addEventListener('click', () => {
            console.log('Aplicando estilos...');
            
            btnAplicar.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btnAplicar.style.transform = '';
            }, 200);
        });
    }
    
    console.log('Super DiseÃ±ador de Textos cargado correctamente');
});

// =====================================================================
// SISTEMA DE PERSISTENCIA Y PREVIEW PARA EL DISEÑADOR DE TEXTO
// =====================================================================

// Elemento de previsualización:
function obtenerPreview() {
    return document.querySelector(".caja-texto");
}

// Lee estado global guardado por la app (de script.js)
function cargarEstadoCompleto() {
    try {
        const data = localStorage.getItem("super-imprimibles-state-texto");
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Error al leer estado guardado:", e);
        return {};
    }
}

// Guarda estado actualizado
function guardarEstadoCompleto(estilos) {
    localStorage.setItem("super-imprimibles-state-texto", JSON.stringify(estilos));
}

// ---------------------------------------------------------------------
// 1️⃣ CARGAR estilos guardados y restaurarlos en controles
// ---------------------------------------------------------------------
function cargarEstilosGuardados() {
    const estado = cargarEstadoCompleto();
    if (!estado || !estado.estilosTexto) return;

    console.log("🎨 Cargando estilos guardados en controles...");
    establecerEstilosEnControles(estado.estilosTexto);
}


// ---------------------------------------------------------------------
// 2️⃣ APLICAR estilos del panel a la PREVIEW
// ---------------------------------------------------------------------
function aplicarEstilosAPreview() {
    const preview = obtenerPreview();
    if (!preview) return;

    // Obtener valores de controles
    const fuente = document.getElementById("select-fuente")?.value || "Aptos";
    const tamano = document.getElementById("select-tamano")?.value || "12";

    // Negrita, cursiva, sombra (toggle)
    const negrita = document.querySelector('[data-formato="negrita"]')?.classList.contains("activo");
    const cursiva = document.querySelector('[data-formato="cursiva"]')?.classList.contains("activo");
    const sombraActiva = document.querySelector('[data-formato="sombra"]')?.classList.contains("activo");

    // Alineación
    const btnAlineado = document.querySelector('[data-alineacion].activo');
    const alineacion = btnAlineado ? btnAlineado.dataset.alineacion : "centro";

    // Capitalización
    const btnCaps = document.querySelector('[data-caps].activo');
    const caps = btnCaps ? btnCaps.dataset.caps : null;

    // Espaciado
    const btnEsp = document.querySelector('[data-espaciado].activo');
    const espaciado = btnEsp ? Number(btnEsp.dataset.espaciado) : 0;

    // Sombra completa
    const sombraColor = document.querySelector('[data-box="sombra"] input[type="color"]')?.value || "#000000";
    const sombraTrans = Number(document.querySelector('[data-box="sombra"] .control-row:nth-child(2) input[type="number"]')?.value || 0);
    const sombraTam = Number(document.querySelector('[data-box="sombra"] .control-row:nth-child(3) input[type="number"]')?.value || 0);
    const sombraBlur = Number(document.querySelector('[data-box="sombra"] .control-row:nth-child(4) input[type="number"]')?.value || 0);
    const sombraAng = Number(document.querySelector('[data-box="sombra"] .valor-angulo')?.value || 0);
    const sombraDist = Number(document.querySelector('[data-box="sombra"] .control-row:nth-child(6) input[type="number"]')?.value || 0);

    let sombraCSS = "none";
    if (sombraActiva) {
        const rad = sombraAng * Math.PI / 180;
        const dx = Math.cos(rad) * sombraDist;
        const dy = Math.sin(rad) * sombraDist;
        const rgba = `rgba(${parseInt(sombraColor.substr(1,2),16)}, ${parseInt(sombraColor.substr(3,2),16)}, ${parseInt(sombraColor.substr(5,2),16)}, ${sombraTrans/100})`;
        sombraCSS = `${dx}px ${dy}px ${sombraBlur}px ${sombraTam}px ${rgba}`;
    }

    // Giro 3D
    const giroX = Number(document.querySelector('[data-box="giro3d"] .control-row:nth-child(1) input[type="number"]')?.value || 0);
    const giroY = Number(document.querySelector('[data-box="giro3d"] .control-row:nth-child(2) input[type="number"]')?.value || 0);
    const giroZ = Number(document.querySelector('[data-box="giro3d"] .control-row:nth-child(3) input[type="number"]')?.value || 0);

    // Aplicar estilos finales
    preview.style.fontFamily = fuente;
    preview.style.fontSize = tamano + "px";
    preview.style.fontWeight = negrita ? "bold" : "normal";
    preview.style.fontStyle = cursiva ? "italic" : "normal";
    preview.style.letterSpacing = (espaciado * 2) + "px";
    preview.style.textAlign = alineacion;
    preview.style.textShadow = sombraCSS;
    preview.style.transform = `rotate3d(${giroX/100}, ${giroY/100}, ${giroZ/100}, 20deg)`;

    // Capitalización
    if (caps === "mayusculas") preview.style.textTransform = "uppercase";
    else if (caps === "minusculas") preview.style.textTransform = "lowercase";
    else if (caps === "capitalizar") preview.style.textTransform = "capitalize";
    else preview.style.textTransform = "none";

    // Guardar
    guardarEstadoCompleto({
        estilosTexto: obtenerEstilosDesdeControles()
    });
}


// ---------------------------------------------------------------------
// Obtiene todos los valores de controles como JSON
// ---------------------------------------------------------------------
function obtenerEstilosDesdeControles() {
    const estilos = {};

    estilos.fuente = document.getElementById("select-fuente")?.value;
    estilos.tamano = document.getElementById("select-tamano")?.value;

    estilos.negrita = document.querySelector('[data-formato="negrita"]')?.classList.contains("activo");
    estilos.cursiva = document.querySelector('[data-formato="cursiva"]')?.classList.contains("activo");
    estilos.sombraActiva = document.querySelector('[data-formato="sombra"]')?.classList.contains("activo");

    const alineado = document.querySelector('[data-alineacion].activo');
    estilos.alineacion = alineado ? alineado.dataset.alineacion : "centro";

    const caps = document.querySelector('[data-caps].activo');
    estilos.caps = caps ? caps.dataset.caps : null;

    const esp = document.querySelector('[data-espaciado].activo');
    estilos.espaciado = esp ? esp.dataset.espaciado : 0;

    estilos.sombra = {
        color: document.querySelector('[data-box="sombra"] input[type="color"]')?.value,
        transparencia: document.querySelector('[data-box="sombra"] .control-row:nth-child(2) input[type="number"]')?.value,
        tamano: document.querySelector('[data-box="sombra"] .control-row:nth-child(3) input[type="number"]')?.value,
        blur: document.querySelector('[data-box="sombra"] .control-row:nth-child(4) input[type="number"]')?.value,
        angulo: document.querySelector('[data-box="sombra"] .valor-angulo')?.value,
        distancia: document.querySelector('[data-box="sombra"] .control-row:nth-child(6) input[type="number"]')?.value
    };

    estilos.giro3d = {
        x: document.querySelector('[data-box="giro3d"] .control-row:nth-child(1) input[type="number"]')?.value,
        y: document.querySelector('[data-box="giro3d"] .control-row:nth-child(2) input[type="number"]')?.value,
        z: document.querySelector('[data-box="giro3d"] .control-row:nth-child(3) input[type="number"]')?.value
    };

    return estilos;
}


// ---------------------------------------------------------------------
// 3️⃣ Establece los valores de controles desde JSON
// ---------------------------------------------------------------------
function establecerEstilosEnControles(estilosFinales) {
    if (!estilosFinales) return;

    document.getElementById("select-fuente").value = estilosFinales.fuente || "Aptos";
    document.getElementById("select-tamano").value = estilosFinales.tamano || 12;

    activarBoton("[data-formato='negrita']", estilosFinales.negrita);
    activarBoton("[data-formato='cursiva']", estilosFinales.cursiva);
    activarBoton("[data-formato='sombra']", estilosFinales.sombraActiva);

    activarExclusivo("alineacion", estilosFinales.alineacion);
    activarExclusivo("capitalizacion", estilosFinales.caps);
    activarExclusivo("espaciado", estilosFinales.espaciado);

    if (estilosFinales.sombra) {
        const box = estilosFinales.sombra;
        document.querySelector('[data-box="sombra"] input[type="color"]').value = box.color;
        document.querySelector('[data-box="sombra"] .control-row:nth-child(2) input[type="number"]').value = box.transparencia;
        document.querySelector('[data-box="sombra"] .control-row:nth-child(3) input[type="number"]').value = box.tamano;
        document.querySelector('[data-box="sombra"] .control-row:nth-child(4) input[type="number"]').value = box.blur;
        document.querySelector('[data-box="sombra"] .valor-angulo').value = box.angulo;
        document.querySelector('[data-box="sombra"] .control-row:nth-child(6) input[type="number"]').value = box.distancia;
    }

    if (estilosFinales.giro3d) {
        const g = estilosFinales.giro3d;
        document.querySelector('[data-box="giro3d"] .control-row:nth-child(1) input[type="number"]').value = g.x;
        document.querySelector('[data-box="giro3d"] .control-row:nth-child(2) input[type="number"]').value = g.y;
        document.querySelector('[data-box="giro3d"] .control-row:nth-child(3) input[type="number"]').value = g.z;
    }

    aplicarEstilosAPreview();
}

// Activar botón independiente
function activarBoton(selector, activo) {
    const b = document.querySelector(selector);
    if (!b) return;
    if (activo) b.classList.add("activo");
    else b.classList.remove("activo");
}

// Activar grupo exclusivo
function activarExclusivo(grupo, valor) {
    const group = document.querySelector(`[data-grupo="${grupo}"]`);
    if (!group) return;
    const botones = group.querySelectorAll("[data-" + grupo + "]");
    botones.forEach(b => b.classList.remove("activo"));
    const target = group.querySelector(`[data-${grupo}="${valor}"]`);
    if (target) target.classList.add("activo");
}


// ---------------------------------------------------------------------
// 4️⃣ LISTENERS — se agregan sin romper nada existente
// ---------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Cargar estilos guardados
    cargarEstilosGuardados();

    // Listeners de actualización automática
    const controles = document.querySelectorAll(`
        #select-fuente,
        #select-tamano,
        .grupo-independiente .btn-tool,
        .grupo-exclusivo .btn-tool,
        input[type="color"],
        input[type="number"],
        input[type="range"]
    `);

    controles.forEach(ctrl => {
        ctrl.addEventListener("input", aplicarEstilosAPreview);
        ctrl.addEventListener("change", aplicarEstilosAPreview);
    });
});

// ============================================================
// BOTÓN APLICAR - Con integración a PowerPoint
// ============================================================
const btnAplicar = document.querySelector('.btn-aplicar');

if (btnAplicar) {
    btnAplicar.addEventListener('click', async () => {
        console.log('Aplicando estilos...');
        
        btnAplicar.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btnAplicar.style.transform = '';
        }, 200);
        
        // Obtener estilos configurados
        const estilosFinales = obtenerEstilosDesdeControles();
        
        // Guardar en localStorage para persistencia
        guardarEstadoCompleto({ estilosTexto: estilosFinales });
        
        // Enviar a proceso principal para aplicar a PowerPoint
        try {
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.send('aplicar-estilos-texto', {
                estilos: estilosFinales
            });
            
            // Esperar confirmación
            ipcRenderer.once('estilos-aplicados', (event, resultado) => {
                if (resultado.success) {
                    console.log('✅ Estilos aplicados al PowerPoint');
                    
                    // Mostrar notificación
                    mostrarNotificacion('✅ Estilos aplicados correctamente');
                    
                    // Cerrar ventana después de 1 segundo
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    console.error('❌ Error aplicando estilos:', resultado.error);
                    mostrarError('Error al aplicar estilos');
                }
            });
            
        } catch (error) {
            console.error('Error aplicando estilos:', error);
        }
    });
}

function mostrarNotificacion(mensaje) {
    console.log('💬', mensaje);
    // TODO: Implementar notificación visual
}

function mostrarError(mensaje) {
    console.error('❌', mensaje);
    alert(mensaje);
}
