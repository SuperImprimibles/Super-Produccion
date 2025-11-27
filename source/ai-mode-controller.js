// ============================================================
// AI MODE CONTROLLER - Controlador del Modo IA
// ============================================================

class AIModeController {
    constructor(groqModule) {
        this.groq = groqModule;
        this.elementosIA = new Map();
        this.procesando = false;
        this.configuracionActual = {};
    }

    // ============================================================
    // INICIALIZAR LISTENERS
    // ============================================================
    inicializar() {
        console.log('🤖 Inicializando Modo IA...');

        // Detectar todos los elementos con .ai-enable
        document.querySelectorAll('.ai-enable').forEach(elemento => {
            this.registrarElemento(elemento);
        });

        // Detectar cajas completas con .ai-box-header
        document.querySelectorAll('.ai-box-header').forEach(header => {
            this.registrarCajaCompleta(header);
        });

        // Detectar grupos exclusivos
        document.querySelectorAll('.ai-group').forEach(grupo => {
            this.registrarGrupo(grupo);
        });

        console.log(`✅ ${this.elementosIA.size} elementos IA registrados`);

        // Listener global para cambios de estado IA
        this.iniciarMonitoreo();
    }

    // ============================================================
    // REGISTRAR ELEMENTOS
    // ============================================================
    registrarElemento(elemento) {
        const tipo = this.detectarTipoElemento(elemento);
        const config = {
            elemento: elemento,
            tipo: tipo,
            activo: false,
            valorOriginal: null,
            callback: null
        };

        this.elementosIA.set(elemento, config);

        // Click derecho para activar/desactivar
        elemento.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleModoIA(elemento);
        });

        // Listener para cambios
        this.agregarListenerCambios(elemento, tipo);
    }

    registrarCajaCompleta(header) {
        header.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const isActive = header.classList.toggle('ai-mode');
            
            const box = header.closest('.ai-box, .seccion-control, .estilo-caja');
            if (!box) return;
            
            box.classList.toggle('ai-box-mode', isActive);
            
            // Aplicar a todos los controles de la caja
            const controls = box.querySelectorAll('.ai-enable');
            controls.forEach(control => {
                if (isActive) {
                    control.classList.add('ai-mode');
                    const config = this.elementosIA.get(control);
                    if (config) config.activo = true;
                } else {
                    control.classList.remove('ai-mode');
                    const config = this.elementosIA.get(control);
                    if (config) config.activo = false;
                }
            });

            if (isActive) {
                this.procesarCaja(box);
            }
        });
    }

    registrarGrupo(grupo) {
        grupo.addEventListener('contextmenu', (e) => {
            if (e.target === grupo || e.target.closest('.grupo-herramientas') === grupo) {
                e.preventDefault();
                
                const isActive = !grupo.classList.contains('ai-group-mode');
                grupo.classList.toggle('ai-group-mode', isActive);
                
                const buttons = grupo.querySelectorAll('.btn-tool.ai-enable, input[type="radio"].ai-enable');
                buttons.forEach(btn => {
                    btn.classList.toggle('ai-mode', isActive);
                    const config = this.elementosIA.get(btn);
                    if (config) config.activo = isActive;
                });

                if (isActive) {
                    this.procesarGrupo(grupo);
                }
            }
        });
    }

    // ============================================================
    // TOGGLE MODO IA
    // ============================================================
    toggleModoIA(elemento) {
        const config = this.elementosIA.get(elemento);
        if (!config) return;

        config.activo = !config.activo;
        elemento.classList.toggle('ai-mode', config.activo);

        if (config.activo) {
            // Guardar valor original
            config.valorOriginal = this.obtenerValor(elemento, config.tipo);
            
            // Procesar con IA
            this.procesarElemento(elemento, config);
        } else {
            // Restaurar valor original si existe
            if (config.valorOriginal !== null) {
                this.aplicarValor(elemento, config.tipo, config.valorOriginal);
            }
        }
    }

    // ============================================================
    // PROCESAR CON IA
    // ============================================================
    async procesarElemento(elemento, config) {
        if (this.procesando) return;

        console.log(`🤖 Procesando elemento: ${config.tipo}`);
        
        try {
            // Obtener contexto actual
            const contexto = this.obtenerContexto();

            let sugerencia = null;

            switch (config.tipo) {
                case 'color':
                    sugerencia = await this.procesarColor(elemento, contexto);
                    break;
                
                case 'fuente':
                    sugerencia = await this.procesarFuente(elemento, contexto);
                    break;
                
                case 'numero':
                    sugerencia = await this.procesarNumero(elemento, contexto);
                    break;
                
                case 'texto':
                    sugerencia = await this.procesarTexto(elemento, contexto);
                    break;
                
                case 'select':
                    sugerencia = await this.procesarSelect(elemento, contexto);
                    break;
            }

            if (sugerencia !== null) {
                this.aplicarValor(elemento, config.tipo, sugerencia);
                this.mostrarNotificacion(`✨ IA: ${this.obtenerNombreElemento(elemento)} actualizado`);
            }

        } catch (error) {
            console.error('❌ Error procesando con IA:', error);
        }
    }

    async procesarCaja(box) {
        console.log('🤖 Procesando caja completa con IA...');
        
        const controles = box.querySelectorAll('.ai-enable.ai-mode');
        
        for (const control of controles) {
            const config = this.elementosIA.get(control);
            if (config && config.activo) {
                await this.procesarElemento(control, config);
            }
        }
    }

    async procesarGrupo(grupo) {
        console.log('🤖 Procesando grupo con IA...');
        
        const controles = grupo.querySelectorAll('.ai-enable.ai-mode');
        
        for (const control of controles) {
            const config = this.elementosIA.get(control);
            if (config && config.activo) {
                await this.procesarElemento(control, config);
            }
        }
    }

    // ============================================================
    // PROCESADORES ESPECÍFICOS
    // ============================================================
    async procesarColor(elemento, contexto) {
        // Si hay logo, analizar y sugerir desde logo
        if (contexto.logo) {
            const analisis = await this.groq.analizarLogo(contexto.logo, contexto.tematica);
            
            // Determinar qué color es (primario, secundario, terciario)
            const index = this.obtenerIndiceColor(elemento);
            
            if (analisis.colores_sugeridos && analisis.colores_sugeridos[index]) {
                return analisis.colores_sugeridos[index];
            }
        }
        
        // Si no hay logo, sugerir basado en temática
        if (contexto.tematica) {
            const colores = await this.groq.sugerirColoresParaTematica(contexto.tematica, contexto.publico);
            const index = this.obtenerIndiceColor(elemento);
            return colores[index] || colores[0];
        }

        return null;
    }

    async procesarFuente(elemento, contexto) {
        if (!contexto.tematica) return null;

        const fuente = await this.groq.sugerirFuente(contexto.tematica, contexto.estilo);
        return fuente;
    }

    async procesarNumero(elemento, contexto) {
        const id = elemento.id;

        // Edad
        if (id === 'edad' && contexto.tematica) {
            const edad = await this.groq.sugerirEdad(contexto.tematica);
            return edad;
        }

        return null;
    }

    async procesarTexto(elemento, contexto) {
        const id = elemento.id;

        // No procesar temática con IA (lo ingresa el usuario)
        return null;
    }

    async procesarSelect(elemento, contexto) {
        const id = elemento.id;

        // Nombre
        if (id === 'nombre-input' && contexto.tematica) {
            const nombres = await this.groq.sugerirNombre(
                contexto.tematica, 
                contexto.edad || 5, 
                contexto.publico
            );
            
            // Agregar nombres al select si no existen
            const select = elemento;
            nombres.forEach(nombre => {
                const existe = Array.from(select.options).some(opt => opt.value === nombre);
                if (!existe) {
                    const option = document.createElement('option');
                    option.value = nombre;
                    option.textContent = `Nombre: ${nombre}`;
                    select.appendChild(option);
                }
            });

            return nombres[0]; // Retornar primer nombre
        }

        return null;
    }

    // ============================================================
    // OBTENER CONTEXTO ACTUAL
    // ============================================================
    obtenerContexto() {
        const contexto = {
            tematica: document.getElementById('tematica')?.value || '',
            nombre: document.getElementById('nombre-input')?.value || '',
            edad: parseInt(document.getElementById('edad')?.value) || null,
            publico: document.getElementById('publico')?.value || 'general',
            colores: Array.from(document.querySelectorAll('#grupo-colores .color-circulo') || []).map(c => c.value),
            logo: null,
            estilo: 'moderno'
        };

        // Obtener logo si existe
        const vistaPersonajes = document.getElementById('vista-personajes');
        if (vistaPersonajes) {
            const cuadroLogo = vistaPersonajes.querySelectorAll('.drop-zone')[12];
            const imgLogo = cuadroLogo?.querySelector('img');
            if (imgLogo) {
                contexto.logo = imgLogo.src;
            }
        }

        return contexto;
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    detectarTipoElemento(elemento) {
        if (elemento.type === 'color') return 'color';
        if (elemento.type === 'number') return 'numero';
        if (elemento.type === 'text') return 'texto';
        if (elemento.tagName === 'SELECT') return 'select';
        if (elemento.id === 'select-fuente') return 'fuente';
        if (elemento.classList.contains('btn-tool')) return 'boton';
        if (elemento.type === 'range') return 'slider';
        return 'desconocido';
    }

    obtenerValor(elemento, tipo) {
        switch (tipo) {
            case 'color':
            case 'texto':
            case 'numero':
            case 'fuente':
                return elemento.value;
            case 'select':
                return elemento.value;
            case 'boton':
                return elemento.classList.contains('activo');
            case 'slider':
                return elemento.value;
            default:
                return null;
        }
    }

    aplicarValor(elemento, tipo, valor) {
        switch (tipo) {
            case 'color':
            case 'texto':
            case 'numero':
            case 'fuente':
                elemento.value = valor;
                elemento.dispatchEvent(new Event('input', { bubbles: true }));
                elemento.dispatchEvent(new Event('change', { bubbles: true }));
                break;
            
            case 'select':
                elemento.value = valor;
                elemento.dispatchEvent(new Event('change', { bubbles: true }));
                break;
            
            case 'boton':
                if (valor) {
                    elemento.classList.add('activo');
                } else {
                    elemento.classList.remove('activo');
                }
                break;
            
            case 'slider':
                elemento.value = valor;
                elemento.dispatchEvent(new Event('input', { bubbles: true }));
                break;
        }
    }

    obtenerIndiceColor(elemento) {
        const colores = Array.from(document.querySelectorAll('#grupo-colores .color-circulo'));
        return colores.indexOf(elemento);
    }

    obtenerNombreElemento(elemento) {
        if (elemento.id) {
            const nombres = {
                'tematica': 'Temática',
                'nombre-input': 'Nombre',
                'edad': 'Edad',
                'publico': 'Público',
                'select-fuente': 'Fuente'
            };
            return nombres[elemento.id] || elemento.id;
        }

        if (elemento.classList.contains('color-circulo')) {
            const index = this.obtenerIndiceColor(elemento);
            return `Color ${index + 1}`;
        }

        return 'Elemento';
    }

    agregarListenerCambios(elemento, tipo) {
        // Los listeners ya están agregados en script.js para guardar estado
        // Aquí solo monitoreamos para IA
    }

    iniciarMonitoreo() {
        // Monitoreo periódico de elementos activos
        setInterval(() => {
            this.elementosIA.forEach((config, elemento) => {
                if (config.activo && !this.procesando) {
                    // Verificar si el contexto cambió significativamente
                    // Si cambió, re-procesar
                }
            });
        }, 5000); // Cada 5 segundos
    }

    mostrarNotificacion(mensaje) {
        console.log('💬', mensaje);
        // TODO: Implementar notificación visual en UI
    }

    // ============================================================
    // PROCESAMIENTO MASIVO
    // ============================================================
    async procesarTodoConIA() {
        if (this.procesando) {
            console.warn('⚠️ Ya hay un procesamiento en curso');
            return;
        }

        console.log('🤖 Procesando todo con IA...');
        this.procesando = true;

        try {
            const contexto = this.obtenerContexto();
            
            // Aplicar sugerencias completas
            const resultado = await this.groq.aplicarSugerenciasCompletas(contexto);
            
            if (resultado.aplicado) {
                console.log('✅ Sugerencias aplicadas:');
                resultado.cambios.forEach(c => console.log('  ', c));
                
                // Aplicar cambios a la UI
                if (contexto.colores) {
                    const selectoresColor = document.querySelectorAll('#grupo-colores .color-circulo');
                    contexto.colores.forEach((color, index) => {
                        if (selectoresColor[index]) {
                            selectoresColor[index].value = color;
                            selectoresColor[index].dispatchEvent(new Event('change'));
                        }
                    });
                }

                if (contexto.edad) {
                    const edadInput = document.getElementById('edad');
                    if (edadInput) {
                        edadInput.value = contexto.edad;
                        edadInput.dispatchEvent(new Event('change'));
                    }
                }

                this.mostrarNotificacion('✨ Sugerencias IA aplicadas correctamente');
            }

        } catch (error) {
            console.error('❌ Error en procesamiento masivo:', error);
        } finally {
            this.procesando = false;
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIModeController;
}