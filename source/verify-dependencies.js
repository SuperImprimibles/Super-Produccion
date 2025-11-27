// ============================================================
// VERIFICADOR DE DEPENDENCIAS COMPLETO
// ============================================================

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');
const path = require('path');

class DependencyVerifier {
    constructor() {
        this.results = {
            python: { installed: false, version: null, packages: {} },
            libreoffice: { installed: false, version: null, path: null },
            powerpoint: { valid: false, files: {} },
            node: { installed: true, version: process.version },
            rembg: { installed: false, working: false },
            status: 'checking'
        };
        
        this.requiredPythonPackages = ['rembg', 'python-pptx', 'Pillow'];
        this.requiredFiles = [
            'assets/Presentacion Kit.pptx',
            'assets/Kit Cumpleaños.pptx',
            'assets/Icono.png',
            'assets/pantalla-de-inicio.png'
        ];
    }

    // ============================================================
    // VERIFICACIÓN COMPLETA
    // ============================================================
    async verifyAll() {
        console.log('🔍 VERIFICACIÓN DE DEPENDENCIAS\n');
        console.log('='.repeat(70));
        
        await this.verifyPython();
        await this.verifyLibreOffice();
        await this.verifyPowerPointFiles();
        await this.verifyRembg();
        
        this.results.status = this.allDependenciesMet() ? 'ready' : 'incomplete';
        
        this.printReport();
        
        return this.results;
    }

    // ============================================================
    // VERIFICAR PYTHON
    // ============================================================
    async verifyPython() {
        console.log('\n🐍 Verificando Python...');
        
        try {
            const { stdout } = await execPromise('python --version');
            const version = stdout.trim();
            this.results.python.installed = true;
            this.results.python.version = version;
            console.log(`  ✅ ${version}`);
            
            // Verificar paquetes Python
            await this.verifyPythonPackages();
            
        } catch (error) {
            console.log('  ❌ Python NO instalado');
            this.results.python.installed = false;
        }
    }

    // ============================================================
    // VERIFICAR PAQUETES PYTHON
    // ============================================================
    async verifyPythonPackages() {
        console.log('\n  📦 Verificando paquetes Python:');
        
        for (const pkg of this.requiredPythonPackages) {
            try {
                const { stdout } = await execPromise(`pip show ${pkg}`);
                
                if (stdout.includes('Version:')) {
                    const versionMatch = stdout.match(/Version: (.+)/);
                    const version = versionMatch ? versionMatch[1].trim() : 'unknown';
                    
                    this.results.python.packages[pkg] = {
                        installed: true,
                        version: version
                    };
                    
                    console.log(`     ✅ ${pkg}: ${version}`);
                } else {
                    throw new Error('Not found');
                }
                
            } catch (error) {
                this.results.python.packages[pkg] = {
                    installed: false,
                    version: null
                };
                console.log(`     ❌ ${pkg}: NO instalado`);
            }
        }
    }

    // ============================================================
    // VERIFICAR LIBREOFFICE
    // ============================================================
    async verifyLibreOffice() {
        console.log('\n📄 Verificando LibreOffice...');
        
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
                try {
                    const { stdout } = await execPromise(`"${p}" --version`);
                    const version = stdout.trim();
                    
                    this.results.libreoffice.installed = true;
                    this.results.libreoffice.version = version;
                    this.results.libreoffice.path = p;
                    
                    console.log(`  ✅ ${version}`);
                    console.log(`  📍 Ruta: ${p}`);
                    return;
                    
                } catch (error) {
                    continue;
                }
            }
        }
        
        console.log('  ❌ LibreOffice NO encontrado');
        this.results.libreoffice.installed = false;
    }

    // ============================================================
    // VERIFICAR ARCHIVOS POWERPOINT
    // ============================================================
    async verifyPowerPointFiles() {
        console.log('\n📂 Verificando archivos PowerPoint...');
        
        let allValid = true;
        
        for (const file of this.requiredFiles) {
            const fullPath = path.join(__dirname, '..', file);
            const exists = fs.existsSync(fullPath);
            
            this.results.powerpoint.files[file] = {
                exists: exists,
                path: fullPath,
                size: exists ? fs.statSync(fullPath).size : 0
            };
            
            if (exists) {
                const sizeKB = (fs.statSync(fullPath).size / 1024).toFixed(2);
                console.log(`  ✅ ${file} (${sizeKB} KB)`);
            } else {
                console.log(`  ❌ ${file} - NO ENCONTRADO`);
                allValid = false;
            }
        }
        
        this.results.powerpoint.valid = allValid;
    }

    // ============================================================
    // VERIFICAR REMBG FUNCIONAL
    // ============================================================
    async verifyRembg() {
        console.log('\n🎨 Verificando rembg...');
        
        const pkg = this.results.python.packages['rembg'];
        
        if (!pkg || !pkg.installed) {
            console.log('  ❌ rembg NO instalado');
            this.results.rembg.installed = false;
            this.results.rembg.working = false;
            return;
        }
        
        this.results.rembg.installed = true;
        
        // Probar que funcione
        try {
            const testScript = `
import sys
try:
    from rembg import remove
    print("OK")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;
            
            const { stdout } = await execPromise(`python -c "${testScript}"`);
            
            if (stdout.trim() === 'OK') {
                this.results.rembg.working = true;
                console.log('  ✅ rembg funcional');
            } else {
                this.results.rembg.working = false;
                console.log('  ⚠️ rembg instalado pero no funcional');
            }
            
        } catch (error) {
            this.results.rembg.working = false;
            console.log('  ⚠️ rembg instalado pero no funcional');
        }
    }

    // ============================================================
    // VERIFICAR SI TODO ESTÁ LISTO
    // ============================================================
    allDependenciesMet() {
        const pythonOK = this.results.python.installed && 
                        Object.values(this.results.python.packages)
                              .every(pkg => pkg.installed);
        
        const libreOfficeOK = this.results.libreoffice.installed;
        const filesOK = this.results.powerpoint.valid;
        const rembgOK = this.results.rembg.working;
        
        return pythonOK && libreOfficeOK && filesOK && rembgOK;
    }

    // ============================================================
    // IMPRIMIR REPORTE
    // ============================================================
    printReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 REPORTE DE VERIFICACIÓN');
        console.log('='.repeat(70));
        
        // Python
        if (this.results.python.installed) {
            const allPkgs = Object.values(this.results.python.packages)
                                  .every(pkg => pkg.installed);
            console.log(`✅ Python: ${this.results.python.version}`);
            console.log(`   Paquetes: ${allPkgs ? '✅ Todos instalados' : '⚠️ Faltan paquetes'}`);
            
            // Listar paquetes faltantes
            if (!allPkgs) {
                const missing = Object.entries(this.results.python.packages)
                    .filter(([name, info]) => !info.installed)
                    .map(([name]) => name);
                console.log(`   ⚠️ Faltantes: ${missing.join(', ')}`);
            }
        } else {
            console.log('❌ Python: NO INSTALADO');
        }
        
        // LibreOffice
        if (this.results.libreoffice.installed) {
            console.log(`✅ LibreOffice: ${this.results.libreoffice.version}`);
        } else {
            console.log('❌ LibreOffice: NO INSTALADO');
        }
        
        // Archivos
        if (this.results.powerpoint.valid) {
            console.log('✅ Archivos PowerPoint: Todos presentes');
        } else {
            console.log('⚠️ Archivos PowerPoint: Algunos faltan');
            
            const missing = Object.entries(this.results.powerpoint.files)
                .filter(([name, info]) => !info.exists)
                .map(([name]) => name);
            console.log(`   ⚠️ Faltantes: ${missing.join(', ')}`);
        }
        
        // Rembg
        if (this.results.rembg.working) {
            console.log('✅ Rembg: Funcional');
        } else if (this.results.rembg.installed) {
            console.log('⚠️ Rembg: Instalado pero no funcional');
        } else {
            console.log('❌ Rembg: NO instalado');
        }
        
        console.log('='.repeat(70));
        
        // Estado final
        if (this.allDependenciesMet()) {
            console.log('✅ SISTEMA LISTO PARA USAR');
        } else {
            console.log('⚠️ FALTAN DEPENDENCIAS');
            console.log('\n💡 Ejecuta "npm run setup" para instalar automáticamente');
        }
        
        console.log('='.repeat(70) + '\n');
    }

    // ============================================================
    // OBTENER LISTA DE FALTANTES
    // ============================================================
    getMissingDependencies() {
        const missing = [];
        
        if (!this.results.python.installed) {
            missing.push({
                type: 'python',
                name: 'Python 3.7+',
                action: 'install',
                url: 'https://www.python.org/downloads/',
                instructions: [
                    'Descargar instalador desde python.org',
                    'Marcar "Add Python to PATH" durante instalación',
                    'Reiniciar terminal después de instalar'
                ]
            });
        }
        
        for (const [pkg, info] of Object.entries(this.results.python.packages)) {
            if (!info.installed) {
                missing.push({
                    type: 'python-package',
                    name: pkg,
                    action: 'pip-install',
                    command: `pip install ${pkg}${pkg === 'rembg' ? '[gpu]' : ''}`
                });
            }
        }
        
        if (!this.results.libreoffice.installed) {
            missing.push({
                type: 'software',
                name: 'LibreOffice',
                action: 'install',
                url: 'https://www.libreoffice.org/download/',
                instructions: [
                    'Descargar instalador desde libreoffice.org',
                    'Ejecutar instalador',
                    'Reiniciar aplicación'
                ]
            });
        }
        
        for (const [file, info] of Object.entries(this.results.powerpoint.files)) {
            if (!info.exists) {
                missing.push({
                    type: 'file',
                    name: file,
                    action: 'download',
                    path: info.path,
                    instructions: [
                        `Asegúrate de que el archivo existe en: ${info.path}`
                    ]
                });
            }
        }
        
        if (!this.results.rembg.working && this.results.rembg.installed) {
            missing.push({
                type: 'python-package',
                name: 'rembg (reinstalar)',
                action: 'reinstall',
                command: 'pip uninstall rembg -y && pip install "rembg[gpu]"',
                instructions: [
                    'Desinstalar rembg actual',
                    'Reinstalar con soporte GPU'
                ]
            });
        }
        
        return missing;
    }

    // ============================================================
    // GENERAR REPORTE JSON
    // ============================================================
    generateReport() {
        const reportPath = path.join(__dirname, '../dependency_report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            status: this.results.status,
            ready: this.allDependenciesMet(),
            results: this.results,
            missing: this.getMissingDependencies()
        };
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Reporte guardado en: ${reportPath}\n`);
        } catch (error) {
            console.warn('⚠️ No se pudo guardar el reporte:', error.message);
        }
        
        return report;
    }
}

// ============================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE
// ============================================================
if (require.main === module) {
    const verifier = new DependencyVerifier();
    
    verifier.verifyAll().then(results => {
        verifier.generateReport();
        
        if (!verifier.allDependenciesMet()) {
            const missing = verifier.getMissingDependencies();
            
            console.log('📋 DEPENDENCIAS FALTANTES:\n');
            
            missing.forEach((dep, index) => {
                console.log(`${index + 1}. ${dep.name}`);
                console.log(`   Tipo: ${dep.type}`);
                if (dep.command) {
                    console.log(`   Comando: ${dep.command}`);
                }
                if (dep.url) {
                    console.log(`   URL: ${dep.url}`);
                }
                if (dep.instructions) {
                    console.log(`   Instrucciones:`);
                    dep.instructions.forEach(inst => {
                        console.log(`     - ${inst}`);
                    });
                }
                console.log('');
            });
        }
        
        process.exit(verifier.allDependenciesMet() ? 0 : 1);
    });
}

module.exports = DependencyVerifier;