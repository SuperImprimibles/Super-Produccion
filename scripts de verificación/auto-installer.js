// ============================================================
// INSTALADOR AUTOMÁTICO - Instala dependencias faltantes
// ============================================================

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const DependencyVerifier = require('./verify-dependencies');

class AutoInstaller {
    constructor() {
        this.verifier = new DependencyVerifier();
        this.installLog = [];
    }

    // ============================================================
    // INSTALACIÓN AUTOMÁTICA COMPLETA
    // ============================================================
    async installAll() {
        console.log('🚀 Iniciando instalación automática...\n');
        
        // Primero verificar qué falta
        await this.verifier.verifyAll();
        
        if (this.verifier.allDependenciesMet()) {
            console.log('✅ Todas las dependencias ya están instaladas');
            return true;
        }
        
        const missing = this.verifier.getMissingDependencies();
        
        console.log(`📦 Se instalarán ${missing.length} dependencias\n`);
        
        // Instalar cada dependencia faltante
        for (const dep of missing) {
            await this.installDependency(dep);
        }
        
        // Verificar nuevamente
        console.log('\n🔍 Verificando instalación...');
        await this.verifier.verifyAll();
        
        if (this.verifier.allDependenciesMet()) {
            console.log('\n✅ INSTALACIÓN COMPLETADA CON ÉXITO');
            return true;
        } else {
            console.log('\n⚠️ ALGUNAS DEPENDENCIAS NO SE PUDIERON INSTALAR');
            this.printFailedInstallations();
            return false;
        }
    }

    // ============================================================
    // INSTALAR DEPENDENCIA INDIVIDUAL
    // ============================================================
    async installDependency(dep) {
        console.log(`\n📦 Instalando: ${dep.name}`);
        
        try {
            switch (dep.type) {
                case 'python-package':
                    await this.installPythonPackage(dep);
                    break;
                    
                case 'python':
                    await this.installPython(dep);
                    break;
                    
                case 'software':
                    await this.installSoftware(dep);
                    break;
                    
                case 'file':
                    console.log(`⚠️ Archivo faltante: ${dep.name}`);
                    console.log(`   Debe estar en: ${dep.path}`);
                    break;
            }
        } catch (error) {
            console.error(`❌ Error instalando ${dep.name}:`, error.message);
            this.installLog.push({ dep, success: false, error: error.message });
        }
    }

    // ============================================================
    // INSTALAR PAQUETE PYTHON
    // ============================================================
    async installPythonPackage(dep) {
        console.log(`⏳ Ejecutando: ${dep.command}`);
        
        try {
            const { stdout, stderr } = await execPromise(dep.command, {
                maxBuffer: 10 * 1024 * 1024,
                timeout: 300000 // 5 minutos timeout
            });
            
            if (stdout) console.log(stdout);
            if (stderr) console.warn(stderr);
            
            console.log(`✅ ${dep.name} instalado correctamente`);
            this.installLog.push({ dep, success: true });
            
        } catch (error) {
            console.error(`❌ Error instalando ${dep.name}`);
            throw error;
        }
    }

    // ============================================================
    // INSTALAR PYTHON
    // ============================================================
    async installPython(dep) {
        console.log('⚠️ Python NO está instalado');
        console.log('📥 Por favor, descarga e instala Python desde:');
        console.log(`   ${dep.url}`);
        console.log('\n⚠️ IMPORTANTE:');
        console.log('   1. Marca "Add Python to PATH" durante la instalación');
        console.log('   2. Reinicia la terminal después de instalar');
        console.log('   3. Vuelve a ejecutar este instalador');
        
        this.installLog.push({ 
            dep, 
            success: false, 
            error: 'Manual installation required' 
        });
    }

    // ============================================================
    // INSTALAR SOFTWARE (LIBREOFFICE)
    // ============================================================
    async installSoftware(dep) {
        console.log('⚠️ LibreOffice NO está instalado');
        console.log('📥 Por favor, descarga e instala LibreOffice desde:');
        console.log(`   ${dep.url}`);
        console.log('\n💡 Después de instalar, reinicia la aplicación');
        
        this.installLog.push({ 
            dep, 
            success: false, 
            error: 'Manual installation required' 
        });
    }

    // ============================================================
    // IMPRIMIR INSTALACIONES FALLIDAS
    // ============================================================
    printFailedInstallations() {
        const failed = this.installLog.filter(log => !log.success);
        
        if (failed.length === 0) return;
        
        console.log('\n❌ Instalaciones fallidas:');
        failed.forEach((log, index) => {
            console.log(`\n${index + 1}. ${log.dep.name}`);
            console.log(`   Error: ${log.error}`);
            if (log.dep.url) {
                console.log(`   Descarga manual: ${log.dep.url}`);
            }
        });
    }

    // ============================================================
    // INSTALAR SOLO REMBG (Función específica)
    // ============================================================
    async installRembgOnly() {
        console.log('🎨 Instalando rembg con soporte GPU...\n');
        
        try {
            const command = 'pip install rembg[gpu]';
            console.log(`⏳ Ejecutando: ${command}`);
            
            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024,
                timeout: 300000 // 5 minutos
            });
            
            console.log(stdout);
            if (stderr) console.warn(stderr);
            
            console.log('\n✅ rembg instalado correctamente');
            console.log('💡 Descargando modelo u2net (primera vez)...');
            
            // Verificar instalación ejecutando rembg
            await this.testRembg();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error instalando rembg:', error.message);
            return false;
        }
    }

    // ============================================================
    // PROBAR REMBG
    // ============================================================
    async testRembg() {
        try {
            const testScript = `
import sys
try:
    from rembg import remove
    print("✅ rembg importado correctamente")
    sys.exit(0)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
`;
            
            const { spawn } = require('child_process');
            const python = spawn('python', ['-c', testScript]);
            
            python.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            
            python.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            
            return new Promise((resolve) => {
                python.on('close', (code) => {
                    resolve(code === 0);
                });
            });
            
        } catch (error) {
            console.error('⚠️ No se pudo verificar rembg');
            return false;
        }
    }
}

// ============================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE
// ============================================================
if (require.main === module) {
    const installer = new AutoInstaller();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--rembg-only')) {
        installer.installRembgOnly().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        installer.installAll().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = AutoInstaller;