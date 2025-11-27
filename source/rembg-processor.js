// ============================================================
// REMBG PROCESSOR - Eliminación de fondo con Python
// ============================================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

class RembgProcessor {
    constructor() {
        this.tempDir = path.join(__dirname, '../assets/temp_rembg');
        this.processing = false;
        this.queue = [];
        this.maxParallel = 2; // Procesar 2 imágenes simultáneamente
        this.currentProcessing = 0;
        
        // Crear directorio temporal
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // ============================================================
    // VERIFICAR REMBG INSTALADO
    // ============================================================
    async verifyRembg() {
        try {
            const testScript = `
import sys
try:
    from rembg import remove
    print("OK")
    sys.exit(0)
except ImportError:
    print("NOT_INSTALLED")
    sys.exit(1)
`;
            
            const { stdout } = await execPromise(`python -c "${testScript}"`);
            return stdout.trim() === 'OK';
            
        } catch (error) {
            return false;
        }
    }

    // ============================================================
    // PROCESAR IMAGEN (Con cola)
    // ============================================================
    async processImage(inputPath, outputPath = null, options = {}) {
        return new Promise((resolve, reject) => {
            const task = {
                inputPath,
                outputPath: outputPath || this.generateOutputPath(inputPath),
                options,
                resolve,
                reject
            };
            
            this.queue.push(task);
            this.processQueue();
        });
    }

    // ============================================================
    // PROCESAR COLA
    // ============================================================
    async processQueue() {
        if (this.currentProcessing >= this.maxParallel || this.queue.length === 0) {
            return;
        }
        
        const task = this.queue.shift();
        this.currentProcessing++;
        
        try {
            const result = await this.processImageDirect(
                task.inputPath, 
                task.outputPath, 
                task.options
            );
            task.resolve(result);
        } catch (error) {
            task.reject(error);
        } finally {
            this.currentProcessing--;
            this.processQueue(); // Procesar siguiente
        }
    }

    // ============================================================
    // PROCESAR IMAGEN DIRECTAMENTE
    // ============================================================
    async processImageDirect(inputPath, outputPath, options = {}) {
        console.log(`🎨 Procesando imagen con rembg: ${path.basename(inputPath)}`);
        
        const startTime = Date.now();
        
        // Opciones por defecto
        const {
            model = 'u2net',           // Modelo rembg
            alphaMatting = false,      // Mejora bordes
            alphaMattingForegroundThreshold = 240,
            alphaMattingBackgroundThreshold = 10,
            alphaMattingErodeSize = 10,
            postProcessMask = false,   // Post-procesamiento
            bgColor = null,            // Color de fondo (null = transparente)
            mask = null                // Máscara personalizada (desde editor)
        } = options;

        // Script Python para rembg
        const pythonScript = `
import sys
import os
from PIL import Image
from rembg import remove

try:
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else 'u2net'
    
    # Abrir imagen
    input_image = Image.open(input_path)
    
    # Opciones de rembg
    options = {
        'model': model,
        'alpha_matting': ${alphaMatting},
        'alpha_matting_foreground_threshold': ${alphaMattingForegroundThreshold},
        'alpha_matting_background_threshold': ${alphaMattingBackgroundThreshold},
        'alpha_matting_erode_size': ${alphaMattingErodeSize},
        'post_process_mask': ${postProcessMask}
    }
    
    # Procesar con rembg
    output_image = remove(input_image, **options)
    
    ${bgColor ? `
    # Aplicar color de fondo
    bg = Image.new('RGBA', output_image.size, ${JSON.stringify(bgColor)})
    bg.paste(output_image, (0, 0), output_image)
    output_image = bg
    ` : ''}
    
    # Guardar resultado
    output_image.save(output_path, 'PNG')
    
    print(f"SUCCESS:{output_path}")
    sys.exit(0)
    
except Exception as e:
    print(f"ERROR:{str(e)}", file=sys.stderr)
    sys.exit(1)
`;

        const scriptPath = path.join(this.tempDir, `rembg_${Date.now()}.py`);
        fs.writeFileSync(scriptPath, pythonScript, 'utf8');

        try {
            const { stdout, stderr } = await execPromise(
                `python "${scriptPath}" "${inputPath}" "${outputPath}" "${model}"`,
                { 
                    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
                    timeout: 60000 // 60 segundos timeout
                }
            );
            
            // Limpiar script
            fs.unlinkSync(scriptPath);
            
            if (stdout.includes('SUCCESS:')) {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✅ Imagen procesada en ${duration}s: ${path.basename(outputPath)}`);
                
                return {
                    success: true,
                    outputPath: outputPath,
                    duration: duration,
                    inputSize: fs.statSync(inputPath).size,
                    outputSize: fs.statSync(outputPath).size
                };
            } else {
                throw new Error(stderr || 'Proceso falló');
            }
            
        } catch (error) {
            // Limpiar script en caso de error
            if (fs.existsSync(scriptPath)) {
                fs.unlinkSync(scriptPath);
            }
            
            console.error('❌ Error procesando imagen:', error.message);
            throw error;
        }
    }

    // ============================================================
    // PROCESAR CON MÁSCARA PERSONALIZADA (Desde editor)
    // ============================================================
    async processWithMask(inputPath, maskPath, outputPath = null) {
        console.log(`🎨 Procesando con máscara personalizada...`);
        
        const output = outputPath || this.generateOutputPath(inputPath);
        
        const pythonScript = `
import sys
from PIL import Image
import numpy as np

try:
    input_path = sys.argv[1]
    mask_path = sys.argv[2]
    output_path = sys.argv[3]
    
    # Cargar imagen y máscara
    input_img = Image.open(input_path).convert('RGBA')
    mask_img = Image.open(mask_path).convert('L')
    
    # Convertir a numpy
    input_array = np.array(input_img)
    mask_array = np.array(mask_img)
    
    # Aplicar máscara al canal alpha
    input_array[:, :, 3] = mask_array
    
    # Convertir de vuelta a imagen
    output_img = Image.fromarray(input_array)
    output_img.save(output_path, 'PNG')
    
    print(f"SUCCESS:{output_path}")
    sys.exit(0)
    
except Exception as e:
    print(f"ERROR:{str(e)}", file=sys.stderr)
    sys.exit(1)
`;

        const scriptPath = path.join(this.tempDir, `mask_${Date.now()}.py`);
        fs.writeFileSync(scriptPath, pythonScript, 'utf8');

        try {
            const { stdout, stderr } = await execPromise(
                `python "${scriptPath}" "${inputPath}" "${maskPath}" "${output}"`,
                { maxBuffer: 50 * 1024 * 1024 }
            );
            
            fs.unlinkSync(scriptPath);
            
            if (stdout.includes('SUCCESS:')) {
                console.log(`✅ Máscara aplicada: ${path.basename(output)}`);
                return { success: true, outputPath: output };
            } else {
                throw new Error(stderr || 'Proceso falló');
            }
            
        } catch (error) {
            if (fs.existsSync(scriptPath)) {
                fs.unlinkSync(scriptPath);
            }
            throw error;
        }
    }

    // ============================================================
    // PROCESAR LOTE (Múltiples imágenes)
    // ============================================================
    async processBatch(imagePaths, onProgress = null) {
        console.log(`📦 Procesando lote de ${imagePaths.length} imágenes...`);
        
        const results = [];
        let completed = 0;
        
        for (const imagePath of imagePaths) {
            try {
                const result = await this.processImage(imagePath);
                results.push({ path: imagePath, success: true, result });
                
                completed++;
                if (onProgress) {
                    onProgress(completed, imagePaths.length);
                }
                
            } catch (error) {
                results.push({ path: imagePath, success: false, error: error.message });
                completed++;
                if (onProgress) {
                    onProgress(completed, imagePaths.length);
                }
            }
        }
        
        console.log(`✅ Lote completado: ${results.filter(r => r.success).length}/${imagePaths.length} exitosas`);
        
        return results;
    }

    // ============================================================
    // GENERAR RUTA DE SALIDA
    // ============================================================
    generateOutputPath(inputPath) {
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const name = path.basename(inputPath, ext);
        return path.join(dir, `${name}_nobg.png`);
    }

    // ============================================================
    // CONVERTIR DATA URL A ARCHIVO
    // ============================================================
    dataUrlToFile(dataUrl, filename = null) {
        const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            throw new Error('DataURL inválido');
        }
        
        const ext = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const outputPath = filename || path.join(
            this.tempDir, 
            `temp_${Date.now()}.${ext}`
        );
        
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    }

    // ============================================================
    // ARCHIVO A DATA URL
    // ============================================================
    fileToDataUrl(filePath) {
        const buffer = fs.readFileSync(filePath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(filePath).substring(1);
        return `data:image/${ext};base64,${base64}`;
    }

    // ============================================================
    // LIMPIAR ARCHIVOS TEMPORALES
    // ============================================================
    cleanup() {
        try {
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                const filePath = path.join(this.tempDir, file);
                fs.unlinkSync(filePath);
            });
            console.log('🧹 Archivos temporales de rembg limpiados');
        } catch (error) {
            console.warn('⚠️ Error limpiando archivos temporales:', error.message);
        }
    }

    // ============================================================
    // OBTENER ESTADÍSTICAS
    // ============================================================
    getStats() {
        return {
            queueLength: this.queue.length,
            currentProcessing: this.currentProcessing,
            maxParallel: this.maxParallel
        };
    }
}

module.exports = RembgProcessor;