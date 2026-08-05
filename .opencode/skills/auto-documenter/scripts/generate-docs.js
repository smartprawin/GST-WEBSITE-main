/**
 * Documentation Generator for Auto-Documenter
 * Generates documentation markdown from scanned codebase data.
 * 
 * Usage: node generate-docs.js <scan-result.json> [output-file]
 */

const fs = require('fs');
const path = require('path');

const scanData = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const outputFile = process.argv[3] || `${scanData.projectName.toUpperCase()}-DOCUMENTATION.md`;

function generateDocs() {
    const lines = [];
    
    // Header
    lines.push(`# ${scanData.projectName.toUpperCase()} - Complete Documentation`);
    lines.push('');
    lines.push('> Auto-generated documentation of all routes, API endpoints, and pages.');
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Table of Contents
    lines.push('## Table of Contents');
    lines.push('');
    if (scanData.server.apiEndpoints.length > 0) {
        lines.push('1. [Server Routes](#server-routes)');
        lines.push('2. [API Endpoints](#api-endpoints)');
    }
    if (scanData.database.tables.length > 0) {
        lines.push(`${scanData.server.apiEndpoints.length > 0 ? '3' : '1'}. [Database Schema](#database-schema)`);
    }
    if (scanData.pages.length > 0) {
        const nextNum = scanData.server.apiEndpoints.length > 0 ? 4 : 2;
        lines.push(`${nextNum}. [Pages](#pages)`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // Server Routes
    if (scanData.server.routes.length > 0) {
        lines.push('## Server Routes');
        lines.push('');
        lines.push('| Method | Route | Purpose |');
        lines.push('|--------|-------|---------|');
        for (const route of scanData.server.routes) {
            lines.push(`| \`${route.method}\` | \`${route.route}\` | ${route.purpose || '-'} |`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    
    // API Endpoints
    if (scanData.server.apiEndpoints.length > 0) {
        lines.push('## API Endpoints');
        lines.push('');
        for (const api of scanData.server.apiEndpoints) {
            lines.push(`### ${api.method} ${api.route}`);
            lines.push('');
            if (api.purpose) {
                lines.push(api.purpose);
                lines.push('');
            }
        }
        lines.push('---');
        lines.push('');
    }
    
    // Database Schema
    if (scanData.database.tables.length > 0) {
        lines.push('## Database Schema');
        lines.push('');
        lines.push('| Table | Records | Columns |');
        lines.push('|-------|---------|---------|');
        for (const table of scanData.database.tables) {
            const colList = table.columns.map(c => c.name).join(', ');
            lines.push(`| \`${table.name}\` | ${table.records} | ${colList} |`);
        }
        lines.push('');
        
        // Detailed table schemas
        for (const table of scanData.database.tables) {
            if (table.columns.length > 0) {
                lines.push(`### ${table.name}`);
                lines.push('');
                lines.push('| Column | Type | Primary Key |');
                lines.push('|--------|------|-------------|');
                for (const col of table.columns) {
                    lines.push(`| ${col.name} | ${col.type} | ${col.pk ? 'Yes' : ''} |`);
                }
                lines.push('');
            }
        }
        lines.push('---');
        lines.push('');
    }
    
    // Pages
    if (scanData.pages.length > 0) {
        lines.push('## Pages');
        lines.push('');
        
        // Group by directory
        const groups = {};
        for (const page of scanData.pages) {
            const dir = path.dirname(page.path);
            if (!groups[dir]) groups[dir] = [];
            groups[dir].push(page);
        }
        
        let pageNum = 1;
        for (const [dir, pages] of Object.entries(groups)) {
            if (dir !== '.') {
                lines.push(`### ${dir}/`);
                lines.push('');
            }
            
            for (const page of pages) {
                lines.push(`#### ${pageNum}. ${page.path}`);
                lines.push('');
                lines.push('| Property | Value |');
                lines.push('|----------|-------|');
                lines.push(`| **Title** | ${page.title || 'Untitled'} |`);
                lines.push(`| **Heading** | ${page.heading || '-'} |`);
                lines.push('');
                
                if (page.forms.length > 0) {
                    lines.push('**Form Fields:**');
                    lines.push('| Field | Type |');
                    lines.push('|-------|------|');
                    for (const form of page.forms) {
                        for (const field of form.fields) {
                            const fieldName = field.name || field.id || 'unnamed';
                            lines.push(`| ${fieldName} | ${field.type} |`);
                        }
                    }
                    lines.push('');
                }
                
                if (page.links.length > 0) {
                    lines.push('**Links:**');
                    for (const link of page.links) {
                        lines.push(`- ${link}`);
                    }
                    lines.push('');
                }
                
                if (page.apiCalls && page.apiCalls.length > 0) {
                    lines.push('**API Calls:**');
                    for (const api of page.apiCalls) {
                        lines.push(`- ${api}`);
                    }
                    lines.push('');
                }
                
                if (page.navigation && page.navigation.length > 0) {
                    lines.push('**Navigation:**');
                    for (const nav of page.navigation) {
                        lines.push(`- -> \`${nav}\``);
                    }
                    lines.push('');
                }
                
                pageNum++;
            }
        }
        lines.push('---');
        lines.push('');
    }
    
    // Scripts
    if (scanData.scripts.length > 0) {
        lines.push('## Shared Scripts');
        lines.push('');
        lines.push('| File | Functions | API Calls |');
        lines.push('|------|-----------|-----------|');
        for (const script of scanData.scripts) {
            const funcs = script.functions.join(', ') || '-';
            const apis = script.apiCalls.join(', ') || '-';
            lines.push(`| \`${script.path}\` | ${funcs} | ${apis} |`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    
    // Footer
    lines.push(`*Auto-generated for ${scanData.projectName} on ${new Date().toISOString().split('T')[0]}*`);
    
    return lines.join('\n');
}

const docs = generateDocs();

// Write to file
fs.writeFileSync(outputFile, docs);
console.log(`Documentation generated: ${outputFile}`);
console.log(`  Pages: ${scanData.pages.length}`);
console.log(`  API Endpoints: ${scanData.server.apiEndpoints.length}`);
console.log(`  Database Tables: ${scanData.database.tables.length}`);
console.log(`  Scripts: ${scanData.scripts.length}`);
