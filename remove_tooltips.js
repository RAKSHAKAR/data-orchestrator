const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('./frontend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove <Tooltip ...> and </Tooltip>
    content = content.replace(/<Tooltip[^>]*>/g, '');
    content = content.replace(/<\/Tooltip>/g, '');

    // Remove Tooltip from imports
    content = content.replace(/Tooltip,\s*/g, '');
    content = content.replace(/,\s*Tooltip/g, '');
    content = content.replace(/import\s*{\s*Tooltip\s*}\s*from\s*'@mui\/material';\n?/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
