// ============================================================
// VERIFICADOR DE DEPENDENCIAS - Sistema Completo
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
        console.log('🔍 Iniciando verificación de dependencias...\n');
        
        await this.verifyPython();
        await this.verifyLibreOffice();
        await this.verifyPowerPointFiles();
        
        this.results.status = this.allDependenciesMet() ? 'ready' : 'incomplete';
        
        this.printReport();
        
        return this.results;
    }

    // ============================================================
    // VERIFICAR PYTHON
    // ============================================================
    async verifyPython() {
        try {
            const { stdout } = await execPromise('python --version');
            const version = stdout.trim();
            this.results.python.installed = true;
            this.results.python.version = version;
            console.log(`✅ Python: ${version}`);
            
            // Verificar paquetes Python
            await this.verifyPythonPackages();
            
        } catch (error) {
            console.log('❌ Python NO instalado');
            this.results.python.installed = false;
        }
    }

    // ============================================================
    // VERIFICAR PAQUETES PYTHON
    // ============================================================
    async verifyPythonPackages() {
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
                    
                    console.log(`  ✅ ${pkg}: ${version}`);
                } else {
                    throw new Error('Not found');
                }
                
            } catch (error) {
                this.results.python.packages[pkg] = {
                    installed: false,
                    version: null
                };
                console.log(`  ❌ ${pkg}: NO instalado`);
            }
        }
    }

    // ============================================================
    // VERIFICAR LIBREOFFICE
    // ============================================================
    async verifyLibreOffice() {
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
                    
                    console.log(`✅ LibreOffice: ${version}`);
                    console.log(`   Ruta: ${p}`);
                    return;
                    
                } catch (error) {
                    continue;
                }
            }
        }
        
        console.log('❌ LibreOffice NO encontrado');
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
    // VERIFICAR SI TODO ESTÁ LISTO
    // ============================================================
    allDependenciesMet() {
        const pythonOK = this.results.python.installed && 
                        Object.values(this.results.python.packages)
                              .every(pkg => pkg.installed);
        
        const libreOfficeOK = this.results.libreoffice.installed;
        const filesOK = this.results.powerpoint.valid;
        
        return pythonOK && libreOfficeOK && filesOK;
    }

    // ============================================================
    // IMPRIMIR REPORTE
    // ============================================================
    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 REPORTE DE VERIFICACIÓN');
        console.log('='.repeat(60));
        
        // Python
        if (this.results.python.installed) {
            const allPkgs = Object.values(this.results.python.packages)
                                  .every(pkg => pkg.installed);
            console.log(`✅ Python: ${this.results.python.version}`);
            console.log(`   Paquetes: ${allPkgs ? '✅ Todos instalados' : '⚠️ Faltan paquetes'}`);
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
        }
        
        console.log('='.repeat(60));
        
        // Estado final
        if (this.allDependenciesMet()) {
            console.log('✅ SISTEMA LISTO PARA USAR');
        } else {
            console.log('⚠️ FALTAN DEPENDENCIAS - Ejecutar instalador automático');
        }
        
        console.log('='.repeat(60) + '\n');
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
                url: 'https://www.python.org/downloads/'
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
                url: 'https://www.libreoffice.org/download/'
            });
        }
        
        for (const [file, info] of Object.entries(this.results.powerpoint.files)) {
            if (!info.exists) {
                missing.push({
                    type: 'file',
                    name: file,
                    action: 'download',
                    path: info.path
                });
            }
        }
        
        return missing;
    }
}

// ============================================================
// EJECUTAR VERIFICACIÓN SI SE LLAMA DIRECTAMENTE
// ============================================================
if (require.main === module) {
    const verifier = new DependencyVerifier();
    
    verifier.verifyAll().then(results => {
        if (!verifier.allDependenciesMet()) {
            console.log('\n📋 Dependencias faltantes:');
            const missing = verifier.getMissingDependencies();
            
            missing.forEach((dep, index) => {
                console.log(`\n${index + 1}. ${dep.name}`);
                console.log(`   Tipo: ${dep.type}`);
                if (dep.command) {
                    console.log(`   Comando: ${dep.command}`);
                }
                if (dep.url) {
                    console.log(`   URL: ${dep.url}`);
                }
            });
            
            console.log('\n💡 Ejecuta "npm run auto-install" para instalar automáticamente');
        }
        
        process.exit(verifier.allDependenciesMet() ? 0 : 1);
    });
}

module.exports = DependencyVerifier;