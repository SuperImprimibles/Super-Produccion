// ============================================================
// INSTALADOR AUTOMÁTICO COMPLETO
// ============================================================

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const fs = require('fs');
const path = require('path');

class AutoInstaller {
    constructor() {
        this.installLog = [];
        this.pythonPackages = [
            { name: 'rembg[gpu]', command: 'pip install "rembg[gpu]"' },
            { name: 'python-pptx', command: 'pip install python-pptx' },
            { name: 'Pillow', command: 'pip install Pillow' }
        ];
    }

    // ============================================================
    // VERIFICAR PYTHON
    // ============================================================
    async verifyPython() {
        try {
            const { stdout } = await execPromise('python --version');
            console.log('✅ Python encontrado:', stdout.trim());
            return true;
        } catch (error) {
            console.error('❌ Python NO encontrado');
            return false;
        }
    }

    // ============================================================
    // VERIFICAR PAQUETE PYTHON
    // ============================================================
    async verifyPythonPackage(packageName) {
        try {
            const cleanName = packageName.replace('[gpu]', '').replace('[cpu]', '');
            const { stdout } = await execPromise(`pip show ${cleanName}`);
            
            if (stdout.includes('Version:')) {
                const versionMatch = stdout.match(/Version: (.+)/);
                const version = versionMatch ? versionMatch[1].trim() : 'unknown';
                console.log(`✅ ${packageName}: ${version}`);
                return true;
            }
            return false;
        } catch (error) {
            console.log(`❌ ${packageName}: NO instalado`);
            return false;
        }
    }

    // ============================================================
    // INSTALAR PAQUETE PYTHON
    // ============================================================
    async installPythonPackage(packageInfo) {
        console.log(`\n📦 Instalando ${packageInfo.name}...`);
        
        try {
            console.log(`⏳ Ejecutando: ${packageInfo.command}`);
            
            const { stdout, stderr } = await execPromise(packageInfo.command, {
                maxBuffer: 50 * 1024 * 1024, // 50MB buffer
                timeout: 600000 // 10 minutos timeout
            });
            
            if (stdout) {
                console.log('📋 Salida:');
                console.log(stdout.substring(0, 500) + (stdout.length > 500 ? '...' : ''));
            }
            
            if (stderr && !stderr.includes('WARNING')) {
                console.warn('⚠️ Advertencias:', stderr.substring(0, 200));
            }
            
            // Verificar instalación
            const installed = await this.verifyPythonPackage(packageInfo.name);
            
            if (installed) {
                console.log(`✅ ${packageInfo.name} instalado correctamente`);
                this.installLog.push({ 
                    package: packageInfo.name, 
                    success: true, 
                    time: new Date().toISOString() 
                });
                return true;
            } else {
                throw new Error('Verificación falló después de instalación');
            }
            
        } catch (error) {
            console.error(`❌ Error instalando ${packageInfo.name}:`, error.message);
            this.installLog.push({ 
                package: packageInfo.name, 
                success: false, 
                error: error.message 
            });
            return false;
        }
    }

    // ============================================================
    // INSTALAR TODOS LOS PAQUETES
    // ============================================================
    async installAll() {
        console.log('🚀 INICIANDO INSTALACIÓN AUTOMÁTICA\n');
        console.log('=' .repeat(60));
        
        // Verificar Python
        const hasPython = await this.verifyPython();
        
        if (!hasPython) {
            console.error('\n❌ PYTHON NO ENCONTRADO');
            console.log('\n📥 Por favor descarga e instala Python desde:');
            console.log('   https://www.python.org/downloads/');
            console.log('\n⚠️ IMPORTANTE:');
            console.log('   1. Marca "Add Python to PATH" durante la instalación');
            console.log('   2. Reinicia la terminal después de instalar');
            console.log('   3. Vuelve a ejecutar este instalador\n');
            return false;
        }
        
        console.log('\n📦 INSTALANDO PAQUETES PYTHON...\n');
        
        let allSuccess = true;
        
        for (const pkg of this.pythonPackages) {
            const isInstalled = await this.verifyPythonPackage(pkg.name);
            
            if (isInstalled) {
                console.log(`✅ ${pkg.name} ya está instalado, omitiendo...`);
                continue;
            }
            
            const success = await this.installPythonPackage(pkg);
            
            if (!success) {
                allSuccess = false;
                console.error(`❌ Falló la instalación de ${pkg.name}`);
            }
            
            // Esperar 2 segundos entre instalaciones
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (allSuccess) {
            console.log('✅ INSTALACIÓN COMPLETADA CON ÉXITO');
            console.log('\n📋 Log de instalación:');
            this.installLog.forEach((log, i) => {
                console.log(`   ${i + 1}. ${log.package}: ${log.success ? '✅ OK' : '❌ FAILED'}`);
            });
        } else {
            console.log('⚠️ INSTALACIÓN COMPLETADA CON ERRORES');
            console.log('\n❌ Paquetes con problemas:');
            this.installLog.filter(l => !l.success).forEach((log, i) => {
                console.log(`   ${i + 1}. ${log.package}: ${log.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        return allSuccess;
    }

    // ============================================================
    // INSTALAR SOLO REMBG
    // ============================================================
    async installRembgOnly() {
        console.log('🎨 INSTALANDO REMBG CON SOPORTE GPU\n');
        
        const hasPython = await this.verifyPython();
        
        if (!hasPython) {
            console.error('❌ Python no encontrado');
            return false;
        }
        
        const rembgPackage = this.pythonPackages.find(p => p.name === 'rembg[gpu]');
        
        if (!rembgPackage) {
            console.error('❌ Configuración de rembg no encontrada');
            return false;
        }
        
        const success = await this.installPythonPackage(rembgPackage);
        
        if (success) {
            console.log('\n✅ REMBG INSTALADO CORRECTAMENTE');
            console.log('💡 El modelo u2net se descargará automáticamente en el primer uso');
            
            // Probar rembg
            await this.testRembg();
        } else {
            console.log('\n❌ NO SE PUDO INSTALAR REMBG');
        }
        
        return success;
    }

    // ============================================================
    // PROBAR REMBG
    // ============================================================
    async testRembg() {
        console.log('\n🧪 Probando rembg...');
        
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
            
            const { stdout, stderr } = await execPromise(`python -c "${testScript}"`);
            
            console.log(stdout);
            
            if (stderr && !stderr.includes('WARNING')) {
                console.warn('⚠️', stderr);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error probando rembg:', error.message);
            return false;
        }
    }

    // ============================================================
    // VERIFICAR TODAS LAS DEPENDENCIAS
    // ============================================================
    async verifyAll() {
        console.log('🔍 VERIFICANDO DEPENDENCIAS\n');
        console.log('='.repeat(60));
        
        const results = {
            python: false,
            packages: {}
        };
        
        // Verificar Python
        results.python = await this.verifyPython();
        
        if (!results.python) {
            console.log('\n❌ Python no encontrado. Ejecuta "npm run setup" para instalar.');
            return results;
        }
        
        // Verificar paquetes
        console.log('\n📦 Verificando paquetes Python...\n');
        
        for (const pkg of this.pythonPackages) {
            results.packages[pkg.name] = await this.verifyPythonPackage(pkg.name);
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Resumen
        const allInstalled = Object.values(results.packages).every(v => v);
        
        if (allInstalled) {
            console.log('✅ TODAS LAS DEPENDENCIAS ESTÁN INSTALADAS');
        } else {
            console.log('⚠️ FALTAN DEPENDENCIAS');
            console.log('\n📋 Ejecuta "npm run setup" para instalar automáticamente');
        }
        
        console.log('\n' + '='.repeat(60));
        
        return results;
    }

    // ============================================================
    // GUARDAR LOG
    // ============================================================
    saveLog() {
        const logPath = path.join(__dirname, '../install_log.json');
        const logData = {
            timestamp: new Date().toISOString(),
            results: this.installLog
        };
        
        try {
            fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
            console.log(`\n💾 Log guardado en: ${logPath}`);
        } catch (error) {
            console.warn('⚠️ No se pudo guardar el log:', error.message);
        }
    }
}

// ============================================================
// EJECUTAR SI SE LLAMA DIRECTAMENTE
// ============================================================
if (require.main === module) {
    const installer = new AutoInstaller();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--verify')) {
        // Solo verificar
        installer.verifyAll().then(results => {
            const allOk = results.python && Object.values(results.packages).every(v => v);
            process.exit(allOk ? 0 : 1);
        });
    } else if (args.includes('--rembg-only')) {
        // Solo instalar rembg
        installer.installRembgOnly().then(success => {
            installer.saveLog();
            process.exit(success ? 0 : 1);
        });
    } else {
        // Instalación completa
        installer.installAll().then(success => {
            installer.saveLog();
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = AutoInstaller;