// ============================================================
// TEXT STYLE APPLIER - Aplicar estilos de texto a PowerPoint
// ============================================================

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const path = require('path');
const fs = require('fs');

class TextStyleApplier {
    constructor() {
        this.tempDir = path.join(__dirname, '../assets/temp_styles');
        
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // ============================================================
    // APLICAR ESTILOS A POWERPOINT
    // ============================================================
    async aplicarEstilos(pptxPath, estilos) {
        console.log('📝 Aplicando estilos de texto a PowerPoint...');
        
        try {
            // Script Python para aplicar estilos
            const pythonScript = this.generarScriptPython(estilos);
            const scriptPath = path.join(this.tempDir, `apply_styles_${Date.now()}.py`);
            
            fs.writeFileSync(scriptPath, pythonScript, 'utf8');
            
            const command = `python "${scriptPath}" "${pptxPath}"`;
            
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
            
            if (stdout.includes('SUCCESS')) {
                console.log('✅ Estilos aplicados correctamente');
                return { success: true };
            } else {
                throw new Error('No se pudieron aplicar los estilos');
            }
            
        } catch (error) {
            console.error('❌ Error aplicando estilos:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================================
    // GENERAR SCRIPT PYTHON
    // ============================================================
    generarScriptPython(estilos) {
        const {
            fuente = 'Arial',
            tamano = 72,
            negrita = false,
            cursiva = false,
            alineacion = 'centro',
            caps = null,
            espaciado = 0,
            sombraActiva = false,
            sombra = {},
            giro3d = {},
            relleno = {}
        } = estilos;

        return `# -*- coding: utf-8 -*-
import sys
from pptx import Presentation
from pptx.util import Pt, Inches
from pptx.enum.text import PP_ALIGN, MSO_AUTO_SIZE
from pptx.dml.color import RGBColor

def find_shapes_recursive(shapes, target_name):
    found = []
    for shape in shapes:
        if hasattr(shape, 'shapes'):
            found.extend(find_shapes_recursive(shape.shapes, target_name))
        if hasattr(shape, 'name') and shape.name == target_name:
            found.append(shape)
    return found

def apply_text_style(shape):
    if not hasattr(shape, 'text_frame'):
        return False
    
    text_frame = shape.text_frame
    
    for paragraph in text_frame.paragraphs:
        # Alineación
        ${this.generarCodigoAlineacion(alineacion)}
        
        for run in paragraph.runs:
            # Fuente
            run.font.name = '${fuente}'
            run.font.size = Pt(${tamano})
            
            # Negrita y Cursiva
            run.font.bold = ${negrita}
            run.font.italic = ${cursiva}
            
            # Espaciado entre letras
            ${espaciado > 0 ? `run.font.character_spacing = Pt(${espaciado * 2})` : ''}
            
            # Capitalización
            ${this.generarCodigoCapitalizacion(caps)}
            
            # Color de relleno
            ${this.generarCodigoRelleno(relleno)}
    
    # Sombra
    ${sombraActiva ? this.generarCodigoSombra(sombra) : ''}
    
    return True

try:
    pptx_path = sys.argv[1]
    prs = Presentation(pptx_path)
    
    modified_count = 0
    
    for slide in prs.slides:
        shapes = find_shapes_recursive(slide.shapes, 'NOMBRE')
        for shape in shapes:
            if apply_text_style(shape):
                modified_count += 1
    
    if modified_count > 0:
        prs.save(pptx_path)
        print(f"SUCCESS: {modified_count} formas modificadas")
    else:
        print("WARNING: No se encontraron formas NOMBRE")
    
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
    }

    // ============================================================
    // GENERADORES DE CÓDIGO
    // ============================================================
    generarCodigoAlineacion(alineacion) {
        const alineaciones = {
            'izquierda': 'PP_ALIGN.LEFT',
            'centro': 'PP_ALIGN.CENTER',
            'derecha': 'PP_ALIGN.RIGHT'
        };
        
        const align = alineaciones[alineacion] || 'PP_ALIGN.CENTER';
        return `paragraph.alignment = ${align}`;
    }

    generarCodigoCapitalizacion(caps) {
        if (!caps) return '';
        
        const capitalizaciones = {
            'mayusculas': "run.text = run.text.upper()",
            'minusculas': "run.text = run.text.lower()",
            'capitalizar': "run.text = run.text.title()"
        };
        
        return capitalizaciones[caps] || '';
    }

    generarCodigoRelleno(relleno) {
        if (!relleno || !relleno.tipo) {
            return "run.font.color.rgb = RGBColor(0, 0, 0)";
        }

        if (relleno.tipo === 'solido' && relleno.color) {
            const rgb = this.hexToRgb(relleno.color);
            return `run.font.color.rgb = RGBColor(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }

        // Degradados e imágenes no soportados directamente en python-pptx
        return "run.font.color.rgb = RGBColor(0, 0, 0)";
    }

    generarCodigoSombra(sombra) {
        if (!sombra || !sombra.color) return '';

        const rgb = this.hexToRgb(sombra.color);
        const transparencia = sombra.transparencia || 0;
        const angulo = sombra.angulo || 0;
        const distancia = sombra.distancia || 0;

        // Convertir ángulo a radianes y calcular offset
        const rad = (angulo * Math.PI) / 180;
        const offsetX = Math.cos(rad) * distancia * 12700; // EMU
        const offsetY = Math.sin(rad) * distancia * 12700;

        return `
    # Aplicar sombra
    try:
        shadow = shape.shadow
        shadow.inherit = False
        shadow.color = RGBColor(${rgb.r}, ${rgb.g}, ${rgb.b})
        shadow.transparency = ${transparencia / 100}
        shadow.distance = ${Math.abs(distancia) * 12700}
        shadow.angle = ${angulo}
        shadow.blur_radius = ${(sombra.blur || 0) * 12700}
    except:
        pass
`;
    }

    // ============================================================
    // GUARDAR ESTILOS COMO JSON
    // ============================================================
    guardarEstilosJSON(estilos, nombre = 'default') {
        const jsonPath = path.join(this.tempDir, `${nombre}_styles.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(estilos, null, 2));
        console.log(`💾 Estilos guardados: ${jsonPath}`);
        return jsonPath;
    }

    // ============================================================
    // CARGAR ESTILOS DESDE JSON
    // ============================================================
    cargarEstilosJSON(nombre = 'default') {
        const jsonPath = path.join(this.tempDir, `${nombre}_styles.json`);
        
        if (fs.existsSync(jsonPath)) {
            const estilos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            console.log(`✅ Estilos cargados: ${jsonPath}`);
            return estilos;
        }
        
        return null;
    }

    // ============================================================
    // COPIAR FUENTE A CARPETA DE FUENTES
    // ============================================================
    async copiarFuente(nombreFuente) {
        const fuentesDir = path.join(__dirname, '../assets/Fuentes');
        
        if (!fs.existsSync(fuentesDir)) {
            fs.mkdirSync(fuentesDir, { recursive: true });
        }

        // Buscar fuente en sistema
        const fuentePath = await this.buscarFuenteEnSistema(nombreFuente);
        
        if (fuentePath) {
            const destPath = path.join(fuentesDir, path.basename(fuentePath));
            
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(fuentePath, destPath);
                console.log(`✅ Fuente copiada: ${path.basename(fuentePath)}`);
            }
            
            return destPath;
        }
        
        console.warn(`⚠️ Fuente no encontrada: ${nombreFuente}`);
        return null;
    }

    // ============================================================
    // BUSCAR FUENTE EN SISTEMA
    // ============================================================
    async buscarFuenteEnSistema(nombreFuente) {
        const fuentesDirs = [
            'C:\\Windows\\Fonts',
            'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\Windows\\Fonts',
            '/System/Library/Fonts',
            '/Library/Fonts',
            '~/.fonts'
        ];

        for (const dir of fuentesDirs) {
            if (!fs.existsSync(dir)) continue;
            
            try {
                const archivos = fs.readdirSync(dir);
                const fuenteEncontrada = archivos.find(f => 
                    f.toLowerCase().includes(nombreFuente.toLowerCase().replace(/\s+/g, ''))
                );
                
                if (fuenteEncontrada) {
                    return path.join(dir, fuenteEncontrada);
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    // ============================================================
    // LIMPIAR ARCHIVOS TEMPORALES
    // ============================================================
    cleanup() {
        try {
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                if (file.endsWith('.py')) {
                    const filePath = path.join(this.tempDir, file);
                    fs.unlinkSync(filePath);
                }
            });
            console.log('🧹 Scripts temporales limpiados');
        } catch (error) {
            console.warn('⚠️ Error limpiando scripts:', error);
        }
    }
}

module.exports = TextStyleApplier;