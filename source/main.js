const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let ventanaDisenador = null;
let ventanaEditor = null;
let ventanaRecolector = null;
let splashWindow = null;
let mainWindow = null;
let libreOfficeExporter = null;

const iconPath = path.join(__dirname, '../assets/Icono.png');

app.disableHardwareAcceleration();

function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const splashImagePath = path.join(__dirname, '../assets/pantalla-de-inicio.png');
  let base64Image = '';

  try {
    const fileData = fs.readFileSync(splashImagePath);
    base64Image = `data:image/png;base64,${fileData.toString('base64')}`;
  } catch (error) {
    console.error('Error al cargar splash:', error);
    base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          overflow: hidden;
        }
        .splash-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .splash-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .loading-bar {
          position: absolute;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        .loading-progress {
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #00cc00);
          width: 0%;
          animation: loading 4s ease-in-out forwards;
        }
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="splash-container">
        <img class="splash-image" src="${base64Image}" alt="Cargando...">
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splashWindow.setMenu(null);

  return splashWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, '../design/components/index.html'));

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.maximize();
      mainWindow.show();
      
      initLibreOffice();
    }, 4000);
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    if (libreOfficeExporter) {
      libreOfficeExporter.cleanup();
    }
  });
}

// ============================================================
// INICIALIZAR LIBREOFFICE EXPORTER
// ============================================================
async function initLibreOffice() {
  try {
    console.log('🚀 Inicializando LibreOffice Exporter...');
    
    const LibreOfficeExporter = require('./libreoffice-exporter.js');
    libreOfficeExporter = new LibreOfficeExporter();
    
    const success = await libreOfficeExporter.initialize();
    
    if (success) {
      console.log('✅ LibreOffice Exporter listo');
      
      mainWindow.webContents.send('libreoffice-ready', {
        success: true,
        totalSlides: libreOfficeExporter.totalSlides
      });
      
      // Enviar las 9 primeras diapositivas
      enviarTodasLasDiapositivas(9);
      
    } else {
      console.error('❌ Error inicializando LibreOffice');
      mainWindow.webContents.send('libreoffice-error', {
        message: 'No se pudo inicializar LibreOffice. ¿Está instalado?'
      });
    }
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    mainWindow.webContents.send('libreoffice-error', {
      message: error.message
    });
  }
}

// ============================================================
// ENVIAR TODAS LAS DIAPOSITIVAS
// ============================================================
function enviarTodasLasDiapositivas(count) {
  const slides = [];
  
  for (let i = 1; i <= count; i++) {
    const slidePath = libreOfficeExporter.getSlideImagePath(i);
    if (fs.existsSync(slidePath)) {
      slides.push({ index: i, path: slidePath });
      
      // También enviar individualmente para compatibilidad
      mainWindow.webContents.send('update-slide-preview', {
        slideIndex: i,
        imagePath: slidePath
      });
    }
  }
  
  mainWindow.webContents.send('update-all-slides', { slides });
}

// ============================================================
// IPC HANDLERS PARA LIBREOFFICE
// ============================================================
ipcMain.on('libreoffice-get-all-slides', (event, data) => {
  if (!libreOfficeExporter) return;
  
  const count = data.count || 9;
  enviarTodasLasDiapositivas(count);
});

ipcMain.on('libreoffice-apply-image', async (event, data) => {
  if (!libreOfficeExporter) return;
  
  try {
    const success = await libreOfficeExporter.applyImage(data.shapeName, data.imageDataUrl);
    
    if (success) {
      // Enviar todas las diapositivas actualizadas
      enviarTodasLasDiapositivas(9);
    }
    
    event.reply('libreoffice-changes-applied', { success });
  } catch (error) {
    console.error('Error aplicando imagen:', error);
    event.reply('libreoffice-changes-applied', { success: false, error: error.message });
  }
});

ipcMain.on('libreoffice-apply-text', async (event, data) => {
  if (!libreOfficeExporter) return;
  
  try {
    const success = await libreOfficeExporter.applyText(data.shapeName, data.text);
    
    if (success) {
      enviarTodasLasDiapositivas(9);
    }
    
    event.reply('libreoffice-changes-applied', { success });
  } catch (error) {
    console.error('Error aplicando texto:', error);
    event.reply('libreoffice-changes-applied', { success: false, error: error.message });
  }
});

ipcMain.on('libreoffice-apply-color', async (event, data) => {
  if (!libreOfficeExporter) return;
  
  try {
    const success = await libreOfficeExporter.applyColor(data.shapeName, data.hexColor);
    
    if (success) {
      enviarTodasLasDiapositivas(9);
    }
    
    event.reply('libreoffice-changes-applied', { success });
  } catch (error) {
    console.error('Error aplicando color:', error);
    event.reply('libreoffice-changes-applied', { success: false, error: error.message });
  }
});

ipcMain.on('libreoffice-save-as', async (event, outputPath) => {
  if (!libreOfficeExporter) return;
  
  try {
    const success = await libreOfficeExporter.saveAs(outputPath);
    event.reply('libreoffice-saved', { success, path: outputPath });
  } catch (error) {
    console.error('Error guardando:', error);
    event.reply('libreoffice-saved', { success: false, error: error.message });
  }
});

ipcMain.on('libreoffice-goto-slide', (event, slideIndex) => {
  if (!libreOfficeExporter) return;
  
  libreOfficeExporter.currentSlide = slideIndex;
  const slidePath = libreOfficeExporter.getSlideImagePath(slideIndex);
  
  if (fs.existsSync(slidePath)) {
    mainWindow.webContents.send('update-slide-preview', {
      slideIndex: slideIndex,
      imagePath: slidePath
    });
  }
});

// ============================================================
// OTRAS VENTANAS
// ============================================================
function createDesignerWindow() {
  if (ventanaDisenador) {
    ventanaDisenador.focus();
    return;
  }

  ventanaDisenador = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ventanaDisenador.setMenu(null);
  ventanaDisenador.loadFile(path.join(__dirname, '../design/components/super_disenador.html'));

  ventanaDisenador.once('ready-to-show', () => {
    ventanaDisenador.maximize();
    ventanaDisenador.show();
  });

  ventanaDisenador.on('closed', () => {
    ventanaDisenador = null;
  });
}

function createEditorWindow() {
  if (ventanaEditor) {
    ventanaEditor.focus();
    return;
  }

  ventanaEditor = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ventanaEditor.setMenu(null);
  ventanaEditor.loadFile(path.join(__dirname, '../design/components/super_editor.html'));

  ventanaEditor.once('ready-to-show', () => {
    ventanaEditor.maximize();
    ventanaEditor.show();
  });

  ventanaEditor.on('closed', () => {
    ventanaEditor = null;
  });
}

function createRecolectorWindow() {
  if (ventanaRecolector) {
    ventanaRecolector.focus();
    return;
  }

  ventanaRecolector = new BrowserWindow({
    width: 220,
    height: 520,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    resizable: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ventanaRecolector.setMenu(null);
  ventanaRecolector.loadFile(path.join(__dirname, '../design/components/recolector.html'));

  ventanaRecolector.once('ready-to-show', () => {
    ventanaRecolector.show();
  });

  ventanaRecolector.on('closed', () => {
    ventanaRecolector = null;
  });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
app.whenReady().then(() => {
  createSplashScreen();
  createMainWindow();
});

ipcMain.on('open-disenador-window', createDesignerWindow);
ipcMain.on('abrir-disenador', createDesignerWindow);
ipcMain.on('open-editor-window', createEditorWindow);
ipcMain.on('open-recolector-window', createRecolectorWindow);

ipcMain.on('maximizar-ventana', () => {
  if (ventanaDisenador && !ventanaDisenador.isMaximized()) {
    ventanaDisenador.maximize();
  }
  
  if (ventanaEditor && !ventanaEditor.isMaximized()) {
    ventanaEditor.maximize();
  }
});

app.on('window-all-closed', () => {
  if (libreOfficeExporter) {
    libreOfficeExporter.cleanup();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashScreen();
    createMainWindow();
  }
});