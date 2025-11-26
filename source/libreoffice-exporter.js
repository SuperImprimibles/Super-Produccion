// ============================================================
// LIBREOFFICE EXPORTER - Con búsqueda recursiva en grupos
// ============================================================

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execPromise = promisify(exec);

class LibreOfficeExporter {
    constructor() {
        this.templatePath = path.join(__dirname, '../assets/Presentacion Kit.pptx');
        this.workingPath = null;
        this.outputDir = path.join(__dirname, '../assets/temp_slides');
        this.currentSlide = 1;
        this.totalSlides = 0;
        this.isInitialized = false;
        this.libreOfficePath = this.findLibreOfficePath();
        
        // Crear carpeta temporal
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log('📁 Carpeta temporal creada:', this.outputDir);
        }
    }

    // ============================================================
    // ENCONTRAR LIBREOFFICE
    // ============================================================
    findLibreOfficePath() {
        const possiblePaths = [
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
            'C:\\LibreOffice\\program\\soffice.exe',
            '/usr/bin/libreoffice',
            '/usr/bin/soffice',
            '/Applications/LibreOffice.app/Contents/MacOS/soffice'
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                console.log('✅ LibreOffice encontrado:', p);
                return p;
            }
        }

        return 'soffice';
    }

    // ============================================================
    // VERIFICAR LIBREOFFICE INSTALADO
    // ============================================================
    async verifyLibreOffice() {
        try {
            const { stdout } = await execPromise(`"${this.libreOfficePath}" --version`);
            console.log('✅ LibreOffice version:', stdout.trim());
            return true;
        } catch (error) {
            console.error('❌ LibreOffice no encontrado');
            console.error('Por favor instala LibreOffice desde: https://www.libreoffice.org/download/');
            return false;
        }
    }

    // ============================================================
    // INICIALIZAR
    // ============================================================
    async initialize() {
        try {
            console.log('🚀 Inicializando LibreOffice Exporter...');
            
            const hasLibreOffice = await this.verifyLibreOffice();
            if (!hasLibreOffice) {
                throw new Error('LibreOffice no está instalado');
            }
            
            if (!fs.existsSync(this.templatePath)) {
                throw new Error(`Template no encontrado: ${this.templatePath}`);
            }
            
            const timestamp = Date.now();
            const dir = path.dirname(this.templatePath);
            const ext = path.extname(this.templatePath);
            const name = path.basename(this.templatePath, ext);
            this.workingPath = path.join(dir, `${name}_working_${timestamp}${ext}`);
            
            fs.copyFileSync(this.templatePath, this.workingPath);
            console.log('✅ Copia de trabajo creada:', this.workingPath);
            
            this.totalSlides = await this.countSlides();
            console.log(`📊 Total de diapositivas: ${this.totalSlides}`);
            
            await this.exportAllSlides();
            
            this.isInitialized = true;
            console.log('✅ LibreOffice Exporter listo');
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando:', error);
            return false;
        }
    }

    // ============================================================
    // CONTAR DIAPOSITIVAS
    // ============================================================
    async countSlides() {
        try {
            const pythonScript = `
import sys
from pptx import Presentation
prs = Presentation(sys.argv[1])
print(len(prs.slides))
`;
            
            const scriptPath = path.join(this.outputDir, 'count_slides.py');
            fs.writeFileSync(scriptPath, pythonScript);
            
            const { stdout } = await execPromise(`python "${scriptPath}" "${this.workingPath}"`);
            const count = parseInt(stdout.trim());
            
            fs.unlinkSync(scriptPath);
            
            return count || 10;
            
        } catch (error) {
            console.warn('⚠️ No se pudo contar slides, usando default: 10');
            return 10;
        }
    }

    // ============================================================
    // EXPORTAR DIAPOSITIVAS ESPECÍFICAS (OPTIMIZACIÓN)
    // ============================================================
    async exportSpecificSlides(slideNumbers) {
        console.log(`📸 Exportando ${slideNumbers.length} diapositivas específicas...`);
        
        try {
            // Exportar solo las diapositivas necesarias usando PowerShell
            const psScript = `
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoFalse
$pres = $ppt.Presentations.Open("${this.workingPath.replace(/\\/g, '\\\\')}")

${slideNumbers.map(num => `
$slide = $pres.Slides.Item(${num})
$slide.Export("${path.join(this.outputDir, `slide_${num}.png`).replace(/\\/g, '\\\\')}", "PNG", 1920, 1080)
`).join('\n')}

$pres.Close()
$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
[System.GC]::Collect()
`;

            const scriptPath = path.join(this.outputDir, 'export_slides.ps1');
            fs.writeFileSync(scriptPath, psScript, 'utf8');
            
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
            
            await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
            
            fs.unlinkSync(scriptPath);
            
            console.log(`✅ ${slideNumbers.length} diapositivas exportadas`);
            
        } catch (error) {
            console.warn('⚠️ Error con PowerShell, usando LibreOffice completo...');
            await this.exportAllSlides();
        }
    }
    async exportAllSlides() {
        console.log('📸 Exportando todas las diapositivas con LibreOffice...');
        
        try {
            const files = fs.readdirSync(this.outputDir);
            files.forEach(file => {
                if (file.endsWith('.png')) {
                    fs.unlinkSync(path.join(this.outputDir, file));
                }
            });
            
            const command = `"${this.libreOfficePath}" --headless --convert-to "png" --outdir "${this.outputDir}" "${this.workingPath}"`;
            
            console.log('⚙️ Ejecutando exportación...');
            
            await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
            
            await this.renameExportedSlides();
            
            console.log('✅ Todas las diapositivas exportadas');
            
        } catch (error) {
            console.error('❌ Error exportando diapositivas:', error);
            throw error;
        }
    }

    // ============================================================
    // RENOMBRAR SLIDES EXPORTADAS
    // ============================================================
    async renameExportedSlides() {
        const files = fs.readdirSync(this.outputDir);
        const pngFiles = files.filter(f => f.endsWith('.png')).sort();
        
        pngFiles.forEach((file, index) => {
            const oldPath = path.join(this.outputDir, file);
            const newPath = path.join(this.outputDir, `slide_${index + 1}.png`);
            
            if (fs.existsSync(newPath)) {
                fs.unlinkSync(newPath);
            }
            
            fs.renameSync(oldPath, newPath);
        });
        
        console.log(`✅ Renombradas ${pngFiles.length} diapositivas`);
    }

    // ============================================================
    // OBTENER RUTA DE IMAGEN DE DIAPOSITIVA
    // ============================================================
    getSlideImagePath(slideIndex) {
        return path.join(this.outputDir, `slide_${slideIndex}.png`);
    }

    // ============================================================
    // APLICAR IMAGEN A SHAPE (búsqueda recursiva)
    // ============================================================
    async applyImage(shapeName, imageDataUrl) {
        try {
            const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const tempPath = path.join(this.outputDir, `temp_${Date.now()}.png`);
            
            fs.writeFileSync(tempPath, buffer);
            
            // Script Python con búsqueda recursiva en grupos
            const pythonScript = `# -*- coding: utf-8 -*-
import sys
import os

# Configurar encoding para evitar errores
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from pptx import Presentation
from pptx.util import Inches

def find_shape_recursive(shapes, target_name):
    found_shapes = []
    
    for shape in shapes:
        if hasattr(shape, 'shapes'):
            found_shapes.extend(find_shape_recursive(shape.shapes, target_name))
        
        if hasattr(shape, 'name') and shape.name == target_name:
            found_shapes.append(shape)
    
    return found_shapes

pptx_path = sys.argv[1]
shape_name = sys.argv[2]
image_path = sys.argv[3]

prs = Presentation(pptx_path)

modified_count = 0

for slide_idx, slide in enumerate(prs.slides, 1):
    found_shapes = find_shape_recursive(slide.shapes, shape_name)
    
    for shape in found_shapes:
        try:
            left = shape.left
            top = shape.top
            width = shape.width
            height = shape.height
            
            parent = shape.element.getparent()
            parent.remove(shape.element)
            
            if hasattr(shape, '_parent') and hasattr(shape._parent, 'shapes'):
                shape._parent.shapes.add_picture(image_path, left, top, width, height)
            else:
                slide.shapes.add_picture(image_path, left, top, width, height)
            
            modified_count += 1
            print("OK_SLIDE_" + str(slide_idx))
            
        except Exception as e:
            print("ERROR_SLIDE_" + str(slide_idx) + "_" + str(e))

if modified_count > 0:
    prs.save(pptx_path)
    print("SUCCESS_" + str(modified_count))
else:
    print("ERROR_NOT_FOUND_" + shape_name)
`;

            const scriptPath = path.join(this.outputDir, 'apply_image.py');
            fs.writeFileSync(scriptPath, pythonScript, 'utf8');
            
            const command = `python "${scriptPath}" "${this.workingPath}" "${shapeName}" "${tempPath}"`;
            
            const { stdout, stderr } = await execPromise(command, { 
                maxBuffer: 10 * 1024 * 1024,
                encoding: 'utf8',
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });
            
            console.log('📋 Resultado:', stdout.trim());
            
            if (stderr) {
                console.warn('⚠️ Advertencias:', stderr);
            }
            
            fs.unlinkSync(scriptPath);
            fs.unlinkSync(tempPath);
            
            if (stdout.includes('SUCCESS_')) {
                const count = stdout.match(/SUCCESS_(\d+)/)?.[1] || '?';
                console.log(`✅ Imagen aplicada a ${count} forma(s) "${shapeName}"`);
                await this.exportAllSlides();
                return true;
            } else {
                console.warn(`⚠️ No se encontró la forma "${shapeName}"`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error aplicando imagen:', error);
            return false;
        }
    }

    // ============================================================
    // APLICAR TEXTO A SHAPE (búsqueda recursiva)
    // ============================================================
    async applyText(shapeName, text) {
        try {
            const pythonScript = `# -*- coding: utf-8 -*-
import sys
import os

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from pptx import Presentation

def find_shape_recursive(shapes, target_name):
    found_shapes = []
    
    for shape in shapes:
        if hasattr(shape, 'shapes'):
            found_shapes.extend(find_shape_recursive(shape.shapes, target_name))
        
        if hasattr(shape, 'name') and shape.name == target_name:
            found_shapes.append(shape)
    
    return found_shapes

pptx_path = sys.argv[1]
shape_name = sys.argv[2]
text_content = sys.argv[3]

prs = Presentation(pptx_path)

modified_count = 0

for slide_idx, slide in enumerate(prs.slides, 1):
    found_shapes = find_shape_recursive(slide.shapes, shape_name)
    
    for shape in found_shapes:
        if hasattr(shape, 'has_text_frame') and shape.has_text_frame:
            shape.text = text_content
            modified_count += 1
            print("OK_SLIDE_" + str(slide_idx))

if modified_count > 0:
    prs.save(pptx_path)
    print("SUCCESS_" + str(modified_count))
else:
    print("ERROR_NOT_FOUND_" + shape_name)
`;

            const scriptPath = path.join(this.outputDir, 'apply_text.py');
            fs.writeFileSync(scriptPath, pythonScript, 'utf8');
            
            const command = `python "${scriptPath}" "${this.workingPath}" "${shapeName}" "${text}"`;
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024,
                encoding: 'utf8',
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });
            
            console.log('📋 Resultado:', stdout.trim());
            
            if (stderr) {
                console.warn('⚠️ Advertencias:', stderr);
            }
            
            fs.unlinkSync(scriptPath);
            
            if (stdout.includes('SUCCESS_')) {
                const count = stdout.match(/SUCCESS_(\d+)/)?.[1] || '?';
                console.log(`✅ Texto aplicado a ${count} forma(s) "${shapeName}"`);
                await this.exportAllSlides();
                return true;
            } else {
                console.warn(`⚠️ No se encontró la forma "${shapeName}"`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error aplicando texto:', error);
            return false;
        }
    }

    // ============================================================
    // APLICAR COLOR A SHAPE (búsqueda recursiva)
    // ============================================================
    async applyColor(shapeName, hexColor) {
        try {
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            const pythonScript = `# -*- coding: utf-8 -*-
import sys
import os

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from pptx import Presentation
from pptx.dml.color import RGBColor

def find_shape_recursive(shapes, target_name):
    found_shapes = []
    
    for shape in shapes:
        if hasattr(shape, 'shapes'):
            found_shapes.extend(find_shape_recursive(shape.shapes, target_name))
        
        if hasattr(shape, 'name') and shape.name == target_name:
            found_shapes.append(shape)
    
    return found_shapes

pptx_path = sys.argv[1]
shape_name = sys.argv[2]
r = int(sys.argv[3])
g = int(sys.argv[4])
b = int(sys.argv[5])

prs = Presentation(pptx_path)

modified_count = 0

for slide_idx, slide in enumerate(prs.slides, 1):
    found_shapes = find_shape_recursive(slide.shapes, shape_name)
    
    for shape in found_shapes:
        try:
            if hasattr(shape, 'fill'):
                shape.fill.solid()
                shape.fill.fore_color.rgb = RGBColor(r, g, b)
                modified_count += 1
                print("OK_SLIDE_" + str(slide_idx))
        except Exception as e:
            print("ERROR_SLIDE_" + str(slide_idx) + "_" + str(e))

if modified_count > 0:
    prs.save(pptx_path)
    print("SUCCESS_" + str(modified_count))
else:
    print("ERROR_NOT_FOUND_" + shape_name)
`;

            const scriptPath = path.join(this.outputDir, 'apply_color.py');
            fs.writeFileSync(scriptPath, pythonScript, 'utf8');
            
            const command = `python "${scriptPath}" "${this.workingPath}" "${shapeName}" ${r} ${g} ${b}`;
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024,
                encoding: 'utf8',
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });
            
            console.log('📋 Resultado:', stdout.trim());
            
            if (stderr) {
                console.warn('⚠️ Advertencias:', stderr);
            }
            
            fs.unlinkSync(scriptPath);
            
            if (stdout.includes('SUCCESS_')) {
                const count = stdout.match(/SUCCESS_(\d+)/)?.[1] || '?';
                console.log(`✅ Color aplicado a ${count} forma(s) "${shapeName}"`);
                await this.exportAllSlides();
                return true;
            } else {
                console.warn(`⚠️ No se encontró la forma "${shapeName}"`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error aplicando color:', error);
            return false;
        }
    }

    // ============================================================
    // GUARDAR COMO
    // ============================================================
    async saveAs(outputPath) {
        if (!this.workingPath) {
            throw new Error('No hay archivo cargado');
        }
        
        try {
            fs.copyFileSync(this.workingPath, outputPath);
            console.log('✅ Guardado en:', outputPath);
            return true;
        } catch (error) {
            console.error('❌ Error guardando:', error);
            return false;
        }
    }

    // ============================================================
    // LIMPIAR
    // ============================================================
    cleanup() {
        console.log('🧹 Limpiando archivos temporales...');
        
        try {
            if (fs.existsSync(this.outputDir)) {
                const files = fs.readdirSync(this.outputDir);
                files.forEach(file => {
                    const filePath = path.join(this.outputDir, file);
                    fs.unlinkSync(filePath);
                });
                console.log('✅ Archivos temporales eliminados');
            }
            
            if (this.workingPath && fs.existsSync(this.workingPath)) {
                fs.unlinkSync(this.workingPath);
                console.log('✅ Copia de trabajo eliminada');
            }
            
            const dir = path.dirname(this.templatePath);
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (file.includes('_working_') && file.endsWith('.pptx')) {
                    const filePath = path.join(dir, file);
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Eliminado:', file);
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Error limpiando:', error);
        }
    }
}

module.exports = LibreOfficeExporter;