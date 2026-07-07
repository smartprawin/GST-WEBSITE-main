/**
 * GST Website Excel Exporter
 * Collects form data and sends to server to append to data.xlsx.
 */

async function exportAndGo(url) {
    const data = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    const radioGroups = {};

    inputs.forEach(input => {
        if (input.type === 'submit' || input.type === 'button' || input.type === 'file' || input.type === 'hidden') return;

        if (input.type === 'radio') {
            if (!radioGroups[input.name]) {
                radioGroups[input.name] = { label: '', value: '' };
            }
            if (input.checked) {
                let optionLabel = '';
                if (input.id) {
                    const lbl = document.querySelector('label[for="' + input.id + '"]');
                    if (lbl) optionLabel = lbl.textContent.trim();
                }
                if (!optionLabel) {
                    let sibling = input.nextSibling;
                    if (sibling && sibling.nodeType === Node.TEXT_NODE) {
                        optionLabel = sibling.textContent.trim();
                    } else if (input.nextElementSibling && input.nextElementSibling.tagName === 'LABEL') {
                        optionLabel = input.nextElementSibling.textContent.trim();
                    }
                }
                radioGroups[input.name].value = optionLabel || input.value;
            }

            if (!radioGroups[input.name].label) {
                let parent = input.parentElement;
                while (parent && parent.tagName !== 'FORM') {
                    const siblingLabel = parent.querySelector('label');
                    if (siblingLabel && siblingLabel !== document.querySelector('label[for="' + input.id + '"]')) {
                        radioGroups[input.name].label = siblingLabel.textContent.trim();
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (!radioGroups[input.name].label) {
                    radioGroups[input.name].label = input.name || 'Registration Type';
                }
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

        let header = '';
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
        if (!header && input.name) {
            header = input.name;
        }
        if (!header) {
            header = input.id || input.type || 'Field';
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

    console.log('Excel Exporter: collected =', JSON.stringify(data));

    const pageName = window.location.pathname.split('/').pop().replace('.html', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    data._sheet = pageName;

    try {
        const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true
        });
        const text = await res.text();
        console.log('Excel Exporter: server response =', text);
    } catch (e) {
        console.error('Export failed:', e);
    }

    window.location.href = url;
}
