/**
 * GST Website Form Exporter
 * Collects form data and sends to server to save in SQLite database.
 */

async function exportAndGo(url) {
    const data = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    const radioGroups = {};

    inputs.forEach(input => {
        if (input.type === 'submit' || input.type === 'button' || input.type === 'file' || input.type === 'hidden') return;

        if (input.type === 'radio') {
            if (!radioGroups[input.name]) {
                radioGroups[input.name] = { label: input.name, value: '' };
            }
            if (input.checked) {
                radioGroups[input.name].value = input.value;
            }
            return;
        }

        if (input.type === 'checkbox') {
            let labelText = '';
            if (input.id) {
                const lbl = document.querySelector('label[for="' + input.id + '"]');
                if (lbl) labelText = lbl.textContent.trim();
            }
            if (!labelText && input.parentElement && input.parentElement.tagName === 'LABEL') {
                labelText = input.parentElement.textContent.trim();
            }
            if (!labelText) {
                let sibling = input.nextSibling;
                if (sibling && sibling.nodeType === Node.TEXT_NODE) {
                    labelText = sibling.textContent.trim();
                } else if (input.nextElementSibling && input.nextElementSibling.tagName === 'LABEL') {
                    labelText = input.nextElementSibling.textContent.trim();
                }
            }
            if (!labelText) {
                labelText = input.name || 'Checkbox Option';
            }
            labelText = labelText.replace(/[*:]/g, '').trim();
            data[labelText] = input.checked ? 'Yes' : 'No';
            return;
        }

        let header = input.name || '';
        if (!header) {
            if (input.id) {
                const lbl = document.querySelector('label[for="' + input.id + '"]');
                if (lbl) header = lbl.textContent.trim();
            }
            if (!header) {
                let prev = input.previousElementSibling;
                while (prev && prev.tagName !== 'LABEL' && prev.tagName !== 'DIV' && prev.tagName !== 'BR') {
                    prev = prev.previousElementSibling;
                }
                if (prev && prev.tagName === 'LABEL') {
                    header = prev.textContent.trim();
                }
            }
            if (!header && input.parentElement) {
                const lbl = input.parentElement.querySelector('label');
                if (lbl) header = lbl.textContent.trim();
            }
            if (!header && input.placeholder) {
                header = input.placeholder;
            }
            if (!header) {
                header = input.id || input.type || 'Field';
            }
        }

        header = header.replace(/[*:]/g, '').trim();
        header = header.replace(/^Ex-\s*/i, '');

        data[header] = input.value;
    });

    Object.keys(radioGroups).forEach(groupName => {
        const group = radioGroups[groupName];
        const groupLabel = group.label.replace(/[*:]/g, '').trim();
        data[groupLabel] = group.value || 'None selected';
    });

    console.log('Form Exporter: collected =', JSON.stringify(data));

    const pageName = window.location.pathname.split('/').pop().replace('.html', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sheetMap = { main: 'main_html' };
    data._sheet = sheetMap[pageName] || pageName;

    try {
        const res = await fetch('http://localhost:4000/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true
        });
        const text = await res.text();
        console.log('Form Exporter: server response =', text);
        if (!res.ok) {
            alert('Warning: data may not have been saved (server responded: ' + res.status + '). Make sure you opened this page from http://localhost:4000');
        }
    } catch (e) {
        console.error('Export failed:', e);
        alert('Data was NOT saved. The GST server (http://localhost:4000) is not reachable. Open this page from http://localhost:4000/REGISTER GST/MAIN.html');
    }

    window.location.href = url;
}
