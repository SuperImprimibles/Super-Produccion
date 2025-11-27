// ============================================================
// SISTEMA DE VALIDACIONES - Antes de publicar
// ============================================================

class ValidationSystem {
    constructor() {
        this.requisitosObligatorios = {
            personajes: {
                required: 12,
                nombre: 'Personajes',
                tipo: 'imagen'
            },
            fondos: {
                required: 12,
                nombre: 'Fondos',
                tipo: 'imagen'
            },
            fondosEspeciales: {
                required: 3,
                nombre: 'Fondos Especiales (A, B, C)',
                tipo: 'imagen',
                indices: [12, 13, 14] // Índices en vista-fondos
            },
            tematica: {
                required: true,
                nombre: 'Temática',
                tipo: 'texto'
            },
            nombre: {
                required: true,
                nombre: 'Nombre',
                tipo: 'texto'
            },
            edad: {
                required: true,
                nombre: 'Edad',
                tipo: 'numero'
            },
            colores: {
                required: 3,
                nombre: 'Colores',
                tipo: 'color'
            },
            disenoTexto: {
                required: true,
                nombre: 'Diseño de Texto',
                tipo: 'diseno'
            }
        };
    }

    // ============================================================
    // VALIDAR TODO
    // ============================================================
    validarTodo() {
        const resultados = {
            valido: true,
            errores: [],
            advertencias: [],
            detalles: {}
        };

        // Validar Personajes
        const personajes = this.validarPersonajes();
        resultados.detalles.personajes = personajes;
        if (!personajes.valido) {
            resultados.valido = false;
            resultados.errores.push(personajes.mensaje);
        }

        // Validar Fondos
        const fondos = this.validarFondos();
        resultados.detalles.fondos = fondos;
        if (!fondos.valido) {
            resultados.valido = false;
            resultados.errores.push(fondos.mensaje);
        }

        // Validar Fondos Especiales
        const fondosEsp = this.validarFondosEspeciales();
        resultados.detalles.fondosEspeciales = fondosEsp;
        if (!fondosEsp.valido) {
            resultados.valido = false;
            resultados.errores.push(fondosEsp.mensaje);
        }

        // Validar Temática
        const tematica = this.validarTematica();
        resultados.detalles.tematica = tematica;
        if (!tematica.valido) {
            resultados.valido = false;
            resultados.errores.push(tematica.mensaje);
        }

        // Validar Nombre
        const nombre = this.validarNombre();
        resultados.detalles.nombre = nombre;
        if (!nombre.valido) {
            resultados.valido = false;
            resultados.errores.push(nombre.mensaje);
        }

        // Validar Edad
        const edad = this.validarEdad();
        resultados.detalles.edad = edad;
        if (!edad.valido) {
            resultados.valido = false;
            resultados.errores.push(edad.mensaje);
        }

        // Validar Colores
        const colores = this.validarColores();
        resultados.detalles.colores = colores;
        if (!colores.valido) {
            resultados.valido = false;
            resultados.errores.push(colores.mensaje);
        }

        // Validar Diseño de Texto
        const diseno = this.validarDisenoTexto();
        resultados.detalles.disenoTexto = diseno;
        if (!diseno.valido) {
            resultados.valido = false;
            resultados.errores.push(diseno.mensaje);
        }

        // Advertencias opcionales
        const logo = this.validarLogo();
        if (!logo.valido) {
            resultados.advertencias.push('⚠️ Logo no configurado (opcional)');
        }

        return resultados;
    }

    // ============================================================
    // VALIDACIONES INDIVIDUALES
    // ============================================================
    validarPersonajes() {
        const vista = document.getElementById('vista-personajes');
        if (!vista) {
            return { valido: false, mensaje: '❌ Vista de personajes no encontrada', cantidad: 0 };
        }

        const cuadros = vista.querySelectorAll('.drop-zone');
        const cuadrosConImagen = Array.from(cuadros)
            .slice(0, 12) // Solo los primeros 12 (excluir LOGO)
            .filter(c => c.querySelector('img'));

        const cantidad = cuadrosConImagen.length;
        const requerido = this.requisitosObligatorios.personajes.required;

        return {
            valido: cantidad >= requerido,
            mensaje: cantidad < requerido 
                ? `❌ Faltan ${requerido - cantidad} personaje(s) (${cantidad}/${requerido})` 
                : `✅ Personajes completos (${cantidad}/${requerido})`,
            cantidad: cantidad,
            requerido: requerido
        };
    }

    validarFondos() {
        const vista = document.getElementById('vista-fondos');
        if (!vista) {
            return { valido: false, mensaje: '❌ Vista de fondos no encontrada', cantidad: 0 };
        }

        const cuadros = vista.querySelectorAll('.drop-zone');
        const cuadrosConImagen = Array.from(cuadros)
            .slice(0, 12) // Solo los primeros 12 (excluir A, B, C)
            .filter(c => c.querySelector('img'));

        const cantidad = cuadrosConImagen.length;
        const requerido = this.requisitosObligatorios.fondos.required;

        return {
            valido: cantidad >= requerido,
            mensaje: cantidad < requerido 
                ? `❌ Faltan ${requerido - cantidad} fondo(s) (${cantidad}/${requerido})` 
                : `✅ Fondos completos (${cantidad}/${requerido})`,
            cantidad: cantidad,
            requerido: requerido
        };
    }

    validarFondosEspeciales() {
        const vista = document.getElementById('vista-fondos');
        if (!vista) {
            return { valido: false, mensaje: '❌ Vista de fondos no encontrada', cantidad: 0 };
        }

        const cuadros = vista.querySelectorAll('.drop-zone');
        const indices = this.requisitosObligatorios.fondosEspeciales.indices;
        
        const cuadrosConImagen = indices.filter(index => {
            const cuadro = cuadros[index];
            return cuadro && cuadro.querySelector('img');
        });

        const cantidad = cuadrosConImagen.length;
        const requerido = this.requisitosObligatorios.fondosEspeciales.required;

        return {
            valido: cantidad >= requerido,
            mensaje: cantidad < requerido 
                ? `❌ Faltan ${requerido - cantidad} fondo(s) especial(es) A/B/C (${cantidad}/${requerido})` 
                : `✅ Fondos especiales completos (${cantidad}/${requerido})`,
            cantidad: cantidad,
            requerido: requerido
        };
    }

    validarTematica() {
        const input = document.getElementById('tematica');
        if (!input) {
            return { valido: false, mensaje: '❌ Campo temática no encontrado', valor: null };
        }

        const valor = input.value.trim();
        const valido = valor.length > 0;

        return {
            valido: valido,
            mensaje: valido ? '✅ Temática configurada' : '❌ Falta temática',
            valor: valor
        };
    }

    validarNombre() {
        const select = document.getElementById('nombre-input');
        if (!select) {
            return { valido: false, mensaje: '❌ Campo nombre no encontrado', valor: null };
        }

        const valor = select.value;
        const valido = valor && valor !== '';

        return {
            valido: valido,
            mensaje: valido ? '✅ Nombre configurado' : '❌ Falta nombre',
            valor: valor
        };
    }

    validarEdad() {
        const input = document.getElementById('edad');
        if (!input) {
            return { valido: false, mensaje: '❌ Campo edad no encontrado', valor: null };
        }

        const valor = parseInt(input.value);
        const valido = !isNaN(valor) && valor > 0 && valor <= 50;

        return {
            valido: valido,
            mensaje: valido ? '✅ Edad configurada' : '❌ Falta edad válida (1-50)',
            valor: valor
        };
    }

    validarColores() {
        const colores = document.querySelectorAll('#grupo-colores .color-circulo');
        if (!colores || colores.length < 3) {
            return { valido: false, mensaje: '❌ Selectores de color no encontrados', cantidad: 0 };
        }

        const coloresValidos = Array.from(colores)
            .map(c => c.value)
            .filter(c => c && c !== '#0d0d0d' && c !== '#000000');

        const cantidad = coloresValidos.length;
        const requerido = this.requisitosObligatorios.colores.required;

        return {
            valido: cantidad >= requerido,
            mensaje: cantidad < requerido 
                ? `❌ Faltan ${requerido - cantidad} color(es) (${cantidad}/${requerido})` 
                : `✅ Colores configurados (${cantidad}/${requerido})`,
            cantidad: cantidad,
            requerido: requerido,
            valores: coloresValidos
        };
    }

    validarDisenoTexto() {
        // Verificar si hay estilos guardados
        const estadoStr = localStorage.getItem('super-imprimibles-state-texto');
        
        if (!estadoStr) {
            return {
                valido: false,
                mensaje: '❌ Falta configurar diseño de texto',
                configurado: false
            };
        }

        try {
            const estado = JSON.parse(estadoStr);
            const tieneEstilos = estado && estado.estilosTexto;

            return {
                valido: tieneEstilos,
                mensaje: tieneEstilos ? '✅ Diseño de texto configurado' : '❌ Falta configurar diseño de texto',
                configurado: tieneEstilos
            };
        } catch (error) {
            return {
                valido: false,
                mensaje: '❌ Error al verificar diseño de texto',
                configurado: false
            };
        }
    }

    validarLogo() {
        const vista = document.getElementById('vista-personajes');
        if (!vista) return { valido: false, mensaje: 'Vista no encontrada' };

        const cuadros = vista.querySelectorAll('.drop-zone');
        const cuadroLogo = cuadros[12]; // Índice 12 = LOGO

        const tieneImagen = cuadroLogo && cuadroLogo.querySelector('img');

        return {
            valido: !!tieneImagen,
            mensaje: tieneImagen ? '✅ Logo configurado' : '⚠️ Logo no configurado (opcional)',
            opcional: true
        };
    }

    // ============================================================
    // MOSTRAR MODAL DE VALIDACIÓN
    // ============================================================
    mostrarModalValidacion(resultados) {
        const erroresHTML = resultados.errores.map(e => `<li>${e}</li>`).join('');
        const advertenciasHTML = resultados.advertencias.length > 0 
            ? `<div style="margin-top: 15px; color: #ff9800;">
                <strong>Advertencias:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    ${resultados.advertencias.map(a => `<li>${a}</li>`).join('')}
                </ul>
               </div>`
            : '';

        const modal = `
            <div class="modal-backdrop open" id="modal-validacion">
                <div class="modal-content medium">
                    <div class="modal-header">
                        <h2>${resultados.valido ? '✅ Todo listo para publicar' : '❌ Faltan elementos obligatorios'}</h2>
                        <button class="modal-close-btn" onclick="cerrarModalValidacion()">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${resultados.valido 
                            ? '<p style="color: #00ff00;">Todos los requisitos están completos.</p>' 
                            : `<p style="color: #ff6b6b;">Por favor completa lo siguiente:</p>
                               <ul style="margin: 10px 0; padding-left: 20px;">
                                   ${erroresHTML}
                               </ul>`
                        }
                        ${advertenciasHTML}
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            ${resultados.valido 
                                ? '<button onclick="confirmarPublicacion()" class="btn-publicar">Publicar Ahora</button>'
                                : '<button onclick="cerrarModalValidacion()" class="btn-preset">Entendido</button>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);
    }

    // ============================================================
    // HABILITAR/DESHABILITAR BOTÓN DE PUBLICAR
    // ============================================================
    actualizarEstadoBotonPublicar() {
        const btnPublicar = document.querySelector('.btn-publicar');
        if (!btnPublicar) return;

        const resultados = this.validarTodo();

        if (resultados.valido) {
            btnPublicar.disabled = false;
            btnPublicar.style.opacity = '1';
            btnPublicar.style.cursor = 'pointer';
            btnPublicar.title = 'Todo listo para publicar';
        } else {
            btnPublicar.disabled = true;
            btnPublicar.style.opacity = '0.5';
            btnPublicar.style.cursor = 'not-allowed';
            btnPublicar.title = 'Completa todos los requisitos obligatorios';
        }

        return resultados.valido;
    }
}

// ============================================================
// FUNCIONES GLOBALES
// ============================================================
window.cerrarModalValidacion = function() {
    const modal = document.getElementById('modal-validacion');
    if (modal) modal.remove();
};

window.confirmarPublicacion = function() {
    cerrarModalValidacion();
    // Aquí se ejecuta el proceso de publicación
    console.log('🚀 Iniciando publicación...');
    window.iniciarPublicacion && window.iniciarPublicacion();
};

// ============================================================
// EXPORTAR
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationSystem;
}