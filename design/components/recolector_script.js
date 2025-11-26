// ============================================================
// RECOLECTOR - SINCRONIZADO CON PANTALLA PRINCIPAL
// ============================================================

const STORAGE_KEY = 'super-imprimibles-state';

// ============================================================
// CARGAR Y SINCRONIZAR ESTADO
// ============================================================
function cargarEstado() {
  const estadoStr = localStorage.getItem(STORAGE_KEY);
  if (!estadoStr) return;
  
  try {
    const estado = JSON.parse(estadoStr);
    restaurarEstadoCuadros('vista-personajes', estado.personajes);
    restaurarEstadoCuadros('vista-fondos', estado.fondos);
  } catch (error) {
    console.error('Error al cargar estado:', error);
  }
}

function restaurarEstadoCuadros(vistaId, estadoCuadros) {
  if (!estadoCuadros) return;
  
  const vista = document.getElementById(vistaId);
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

function guardarEstado() {
  const estado = {
    personajes: obtenerEstadoCuadros('vista-personajes'),
    fondos: obtenerEstadoCuadros('vista-fondos'),
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function obtenerEstadoCuadros(vistaId) {
  const vista = document.getElementById(vistaId);
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

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // Cargar estado inicial
    cargarEstado();
    
    // Escuchar cambios de la ventana principal
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        cargarEstado();
      }
    });
    
    // ============================================================
    // TABS PERSONAJES/FONDOS
    // ============================================================
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
    
    // ============================================================
    // SISTEMA DE DRAG & DROP
    // ============================================================
    let elementoArrastrado = null;
    
    const cuadros = document.querySelectorAll('.drop-zone');
    const papeleras = document.querySelectorAll('.item-basura-personajes, .item-basura-fondos');
    
    cuadros.forEach(cuadro => {
      
      // Drag desde computadora
      cuadro.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!elementoArrastrado) {
          cuadro.classList.add('drag-over');
        }
      });
      
      cuadro.addEventListener('dragleave', (e) => {
        e.preventDefault();
        cuadro.classList.remove('drag-over');
      });
      
      cuadro.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cuadro.classList.remove('drag-over');
        
        // Drop desde computadora
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const archivo = e.dataTransfer.files[0];
          if (archivo.type.startsWith('image/')) {
            cargarImagenEnCuadro(cuadro, archivo);
          }
          return;
        }
        
        // Drop desde otro cuadro
        if (elementoArrastrado && elementoArrastrado !== cuadro) {
          intercambiarContenido(elementoArrastrado, cuadro);
        }
      });
      
      // Drag desde cuadro
      cuadro.addEventListener('dragstart', (e) => {
        elementoArrastrado = cuadro;
        cuadro.classList.add('dragging');
      });
      
      cuadro.addEventListener('dragend', (e) => {
        cuadro.classList.remove('dragging');
        elementoArrastrado = null;
        
        document.querySelectorAll('.drag-over').forEach(el => {
          el.classList.remove('drag-over');
        });
      });
      
      // Click para abrir editor
      cuadro.addEventListener('click', (e) => {
        const img = cuadro.querySelector('img');
        if (img && !cuadro.classList.contains('dragging')) {
          abrirEditor(img.src);
        }
      });
    });
    
    // Configurar papeleras
    papeleras.forEach(papelera => {
      papelera.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (elementoArrastrado) {
          papelera.classList.add('drag-over');
        }
      });
      
      papelera.addEventListener('dragleave', () => {
        papelera.classList.remove('drag-over');
      });
      
      papelera.addEventListener('drop', (e) => {
        e.preventDefault();
        papelera.classList.remove('drag-over');
        
        if (elementoArrastrado) {
          restaurarCuadro(elementoArrastrado);
        }
      });
    });
    
    // ============================================================
    // FUNCIONES AUXILIARES
    // ============================================================
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
      
      const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
      
      if (isElectron) {
        try {
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('open-editor-window');
        } catch (err) {
          console.error('Error al abrir editor:', err);
        }
      } else {
        window.open("super_editor.html", "SuperEditor", "width=1200,height=800,menubar=no,toolbar=no");
      }
    }
    
    console.log('Recolector cargado y sincronizado');
});