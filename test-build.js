const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing TypeScript build...');

try {
    // Clean previous build
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
        console.log('✅ Cleaned previous build');
    }

    // Run TypeScript build
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ TypeScript build successful');

    // Check if main file exists
    const mainFile = path.join('dist', 'index.js');
    if (fs.existsSync(mainFile)) {
        console.log('✅ Main file exists:', mainFile);
    } else {
        throw new Error('Main file not found: ' + mainFile);
    }

    // Check if all module directories exist
    const modulesDir = path.join('dist', 'modules');
    if (fs.existsSync(modulesDir)) {
        const modules = fs.readdirSync(modulesDir);
        console.log('✅ Modules built:', modules.join(', '));
    } else {
        throw new Error('Modules directory not found');
    }

    console.log('🎉 Build test passed! Ready for deployment.');

} catch (error) {
    console.error('❌ Build test failed:', error.message);
    process.exit(1);
}
