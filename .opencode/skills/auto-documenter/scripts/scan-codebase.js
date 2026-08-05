/**
 * Codebase Scanner for Auto-Documenter
 * Scans a project and extracts documentation-relevant information.
 * 
 * Usage: node scan-codebase.js [project-root]
 * Output: JSON with all extracted data
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();

const result = {
    projectRoot,
    projectName: path.basename(projectRoot),
    timestamp: new Date().toISOString(),
    documentationFile: null,
    server: { routes: [], apiEndpoints: [], middleware: [] },
    pages: [],
    database: { tables: [], schemas: {} },
    scripts: [],
    dependencies: {},
    css: []
};

// Find documentation file
function findDocumentationFile() {
    const patterns = [
        '*-DOCUMENTATION.md',
        '*-DOCS.md',
        '*-documentation.md',
        'README.md'
    ];
    
    for (const pattern of patterns) {
        const files = globSync(pattern, projectRoot);
        if (files.length > 0) {
            result.documentationFile = files[0];
            return;
        }
    }
    
    const docsDir = path.join(projectRoot, 'docs');
    if (fs.existsSync(docsDir)) {
        const mdFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
        if (mdFiles.length > 0) {
            result.documentationFile = path.join('docs', mdFiles[0]);
        }
    }
}

function globSync(pattern, dir) {
    const files = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                files.push(...globSync(pattern, fullPath));
            } else if (entry.isFile() && matchPattern(entry.name, pattern)) {
                files.push(path.relative(projectRoot, fullPath));
            }
        }
    } catch (e) {}
    return files;
}

function matchPattern(filename, pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(filename);
}

// Scan server.js
function scanServer() {
    const serverPath = path.join(projectRoot, 'server.js');
    if (!fs.existsSync(serverPath)) {
        // Try other common names
        const alternatives = ['app.js', 'index.js', 'main.js'];
        for (const alt of alternatives) {
            if (fs.existsSync(path.join(projectRoot, alt))) {
                scanServerFile(alt);
                return;
            }
        }
        return;
    }
    scanServerFile('server.js');
}

function scanServerFile(filename) {
    const content = fs.readFileSync(path.join(projectRoot, filename), 'utf8');
    
    // Extract routes
    const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const route = match[2];
        
        // Try to extract purpose from comments above
        const beforeMatch = content.substring(0, match.index);
        const lines = beforeMatch.split('\n');
        let purpose = '';
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
            const commentMatch = lines[i].match(/\/\/\s*(.+)/);
            if (commentMatch) {
                purpose = commentMatch[1].trim();
                break;
            }
        }
        
        if (route.startsWith('/api/')) {
            result.server.apiEndpoints.push({ method, route, purpose });
        } else {
            result.server.routes.push({ method, route, purpose });
        }
    }
    
    // Extract PORT
    const portMatch = content.match(/PORT\s*=\s*(\d+)/);
    if (portMatch) {
        result.server.port = parseInt(portMatch[1]);
    }
}

// Scan HTML files
function scanHTMLFiles() {
    const htmlFiles = globSync('*.html', projectRoot)
        .filter(f => !f.includes('node_modules'));
    
    for (const file of htmlFiles) {
        try {
            const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
            const pageInfo = extractPageInfo(file, content);
            result.pages.push(pageInfo);
        } catch (e) {}
    }
}

function extractPageInfo(filePath, content) {
    const info = {
        path: filePath,
        title: '',
        heading: '',
        forms: [],
        links: [],
        apiCalls: [],
        scripts: []
    };
    
    // Extract title
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) info.title = titleMatch[1].trim();
    
    // Extract first h1 or h2
    const headingMatch = content.match(/<h[12][^>]*>([^<]+)<\/h[12]>/i);
    if (headingMatch) info.heading = headingMatch[1].trim();
    
    // Extract forms and fields
    const formRegex = /<form[^>]*>/gi;
    let formMatch;
    while ((formMatch = formRegex.exec(content)) !== null) {
        const form = { fields: [] };
        
        // Find closing tag
        const formStart = formMatch.index;
        const formContent = content.substring(formStart, formStart + 5000);
        
        // Extract input fields
        const inputRegex = /<(input|select|textarea)[^>]*>/gi;
        let inputMatch;
        while ((inputMatch = inputRegex.exec(formContent)) !== null) {
            const tag = inputMatch[1].toLowerCase();
            const attrs = inputMatch[0];
            
            const field = { type: tag };
            
            const nameMatch = attrs.match(/name\s*=\s*["']([^"']+)["']/);
            if (nameMatch) field.name = nameMatch[1];
            
            const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/);
            if (idMatch) field.id = idMatch[1];
            
            const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
            if (typeMatch) field.inputType = typeMatch[1];
            
            if (tag === 'select') {
                field.type = 'select';
            } else if (tag === 'textarea') {
                field.type = 'textarea';
            } else if (field.inputType === 'radio') {
                field.type = 'radio';
            } else if (field.inputType === 'checkbox') {
                field.type = 'checkbox';
            } else if (field.inputType === 'file') {
                field.type = 'file';
            }
            
            if (field.name || field.id) {
                form.fields.push(field);
            }
        }
        
        if (form.fields.length > 0) {
            info.forms.push(form);
        }
    }
    
    // Extract links
    const linkRegex = /href\s*=\s*["']([^"']+\.html[^"']*)["']/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
        info.links.push(linkMatch[1]);
    }
    
    // Extract API calls
    const apiRegex = /fetch\s*\(\s*['"`]([^'"`]+\/api\/[^'"`]+)['"`]/g;
    let apiMatch;
    while ((apiMatch = apiRegex.exec(content)) !== null) {
        info.apiCalls.push(apiMatch[1]);
    }
    
    // Also check for exportAndGo calls
    const exportRegex = /exportAndGo\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let exportMatch;
    while ((exportMatch = exportRegex.exec(content)) !== null) {
        info.navigation = info.navigation || [];
        info.navigation.push(exportMatch[1]);
    }
    
    return info;
}

// Scan database
function scanDatabase() {
    const sqliteFiles = globSync('*.sqlite', projectRoot)
        .concat(globSync('*.db', projectRoot))
        .filter(f => !f.includes('-wal') && !f.includes('-shm'));
    
    for (const dbFile of sqliteFiles) {
        try {
            const Database = require('better-sqlite3');
            const db = new Database(path.join(projectRoot, dbFile), { readonly: true });
            
            const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
            
            for (const table of tables) {
                const schema = db.prepare(`PRAGMA table_info([${table.name}])`).all();
                const count = db.prepare(`SELECT COUNT(*) as cnt FROM [${table.name}]`).get();
                
                result.database.tables.push({
                    name: table.name,
                    records: count.cnt,
                    columns: schema.map(c => ({
                        name: c.name,
                        type: c.type,
                        pk: c.pk === 1
                    }))
                });
                
                result.database.schemas[table.name] = schema.map(c => c.name);
            }
            
            db.close();
        } catch (e) {}
    }
}

// Scan package.json
function scanPackageJson() {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            result.projectName = pkg.name || result.projectName;
            result.dependencies = pkg.dependencies || {};
            result.server.port = result.server.port || 3000;
        } catch (e) {}
    }
}

// Scan JavaScript files
function scanJSFiles() {
    const jsFiles = globSync('*.js', projectRoot)
        .filter(f => !f.includes('node_modules') && f !== 'server.js' && f !== 'app.js');
    
    for (const file of jsFiles) {
        try {
            const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
            const scriptInfo = {
                path: file,
                functions: [],
                exports: [],
                apiCalls: []
            };
            
            // Extract function declarations
            const funcRegex = /function\s+(\w+)/g;
            let funcMatch;
            while ((funcMatch = funcRegex.exec(content)) !== null) {
                scriptInfo.functions.push(funcMatch[1]);
            }
            
            // Extract API calls
            const apiRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let apiMatch;
            while ((apiMatch = apiRegex.exec(content)) !== null) {
                scriptInfo.apiCalls.push(apiMatch[1]);
            }
            
            if (scriptInfo.functions.length > 0 || scriptInfo.apiCalls.length > 0) {
                result.scripts.push(scriptInfo);
            }
        } catch (e) {}
    }
}

// Scan CSS files
function scanCSSFiles() {
    const cssFiles = globSync('*.css', projectRoot)
        .filter(f => !f.includes('node_modules'));
    
    for (const file of cssFiles) {
        result.css.push(file);
    }
}

// Main execution
try {
    findDocumentationFile();
    scanServer();
    scanHTMLFiles();
    scanDatabase();
    scanPackageJson();
    scanJSFiles();
    scanCSSFiles();
    
    console.log(JSON.stringify(result, null, 2));
} catch (err) {
    console.error('Scan error:', err.message);
    process.exit(1);
}
