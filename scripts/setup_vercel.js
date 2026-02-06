const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

// 1. Check if linked
console.log('🔄 Checking Vercel Link status...');
const vercelDir = path.join(__dirname, '..', '.vercel');
if (!fs.existsSync(vercelDir)) {
    console.log('⚠️  Project not linked. Starting link process...');
    console.log('👉 Please follow the prompts to log in and select your project.');

    try {
        // Run interactive link
        execSync('npx vercel link', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error('❌ Linking failed or was cancelled.');
        process.exit(1);
    }
} else {
    console.log('✅ Project is linked.');
}

// 2. Read Env Vars
console.log('\n📖 Reading .env.local...');
if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ .env.local not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
const envVars = envContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
        const [key, ...rest] = line.split('=');
        return { key, value: rest.join('=') };
    });

// 3. Upload Vars
async function uploadVars() {
    console.log(`\n🚀 Found ${envVars.length} variables. Uploading to Production...`);

    for (const { key, value } of envVars) {
        if (!key || !value) continue;

        console.log(`\n🔹 Setting ${key}...`);

        // Remove existing (optional, but cleaner to avoid "already exists" prompt if logic varies)
        // For simplicity, we just try to add. If it exists, 'vercel env add' might prompt or fail.
        // Actually 'vercel env add' prompts "Variable X already exists. Replace? [y/N]". 
        // We can force by running 'vercel env rm -y' first? 
        // Let's try to remove first to be safe and automated.

        try {
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore', cwd: path.join(__dirname, '..') });
            console.log(`   (Removed old version if existed)`);
        } catch (e) {
            // Ignore error if it didn't exist
        }

        // Add new
        return new Promise((resolve, reject) => {
            const child = spawn('npx', ['vercel', 'env', 'add', key, 'production'], {
                cwd: path.join(__dirname, '..'),
                stdio: ['pipe', 'inherit', 'inherit'], // Pipe stdin, inherit others
                shell: true
            });

            // Write value to stdin
            child.stdin.write(value);
            child.stdin.end();

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`   ✅ ${key} added.`);
                    resolve();
                } else {
                    console.error(`   ❌ Failed to add ${key}.`);
                    reject();
                }
            });
        });
    }
}

// Execute loop sequentially
(async () => {
    try {
        for (const { key, value } of envVars) {
            // Reuse logic inside loop properly
            // Re-declaring loop body logic here to handle verify/remove/add
            if (!key || !value) continue;

            console.log(`\n🔹 Processing ${key}...`);

            // 1. Remove
            try {
                execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore', cwd: path.join(__dirname, '..') });
            } catch (e) { }

            // 2. Add
            await new Promise((resolve, reject) => {
                const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
                const child = spawn(cmd, ['vercel', 'env', 'add', key, 'production'], {
                    cwd: path.join(__dirname, '..'),
                    stdio: ['pipe', 'inherit', 'inherit']
                });

                child.stdin.write(value);
                child.stdin.end();

                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error('Process exited with code ' + code));
                });
            });
            console.log(`   ✅ Uploaded.`);
        }
        console.log('\n✨ All variables uploaded successfully!');
    } catch (err) {
        console.error('\n❌ An error occurred:', err);
    }
})();
