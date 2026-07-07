/**
 * GST Website Excel Exporter
 * Automatically extracts form data and exports it to a Excel (.xlsx) file.
 * Loaded dynamically on form pages.
 */

(function () {
    // Dynamically load SheetJS if not already present
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        document.head.appendChild(script);
    }

    // Function to gather all form values and corresponding headers
    function getFormData() {
        const data = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        const radioGroups = {};

        inputs.forEach(input => {
            // Skip buttons, file inputs and hidden inputs
            if (input.type === 'submit' || input.type === 'button' || input.type === 'file' || input.type === 'hidden') return;

            // Handle radio buttons (group them by name)
            if (input.type === 'radio') {
                if (!radioGroups[input.name]) {
                    radioGroups[input.name] = {
                        label: '',
                        value: ''
                    };
                }
                if (input.checked) {
                    // Try to find the specific label for this checked option
                    let optionLabel = '';
                    if (input.id) {
                        const lbl = document.querySelector(`label[for="${input.id}"]`);
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

                // Retrieve general group label if not set
                if (!radioGroups[input.name].label) {
                    // Look up parent hierarchy for the overall group label
                    let parent = input.parentElement;
                    while (parent && parent.tagName !== 'FORM') {
                        const siblingLabel = parent.querySelector('label');
                        if (siblingLabel && siblingLabel !== document.querySelector(`label[for="${input.id}"]`)) {
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

            // Handle checkboxes
            if (input.type === 'checkbox') {
                let labelText = '';
                if (input.id) {
                    const lbl = document.querySelector(`label[for="${input.id}"]`);
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

            // Handle standard inputs, selects, and textareas
            let header = '';

            // 1. label[for="id"]
            if (input.id) {
                const lbl = document.querySelector(`label[for="${input.id}"]`);
                if (lbl) header = lbl.textContent.trim();
            }

            // 2. Preceding label element
            if (!header) {
                let prev = input.previousElementSibling;
                while (prev && prev.tagName !== 'LABEL' && prev.tagName !== 'DIV' && prev.tagName !== 'BR') {
                    prev = prev.previousElementSibling;
                }
                if (prev && prev.tagName === 'LABEL') {
                    header = prev.textContent.trim();
                }
            }

            // 3. Parent container labels
            if (!header && input.parentElement) {
                const lbl = input.parentElement.querySelector('label');
                if (lbl) header = lbl.textContent.trim();
            }

            // 4. Placeholder
            if (!header && input.placeholder) {
                header = input.placeholder;
            }

            // 5. Fallback to Name
            if (!header && input.name) {
                header = input.name;
            }

            // 6. Generic fallback
            if (!header) {
                header = input.id || input.type || 'Field';
            }

            // Clean header formatting
            header = header.replace(/[*:]/g, '').trim();
            header = header.replace(/^Ex-\s*/i, ''); // strip "Ex-" placeholders

            // Store value
            data[header] = input.value;
        });

        // Add grouped radio values
        Object.keys(radioGroups).forEach(groupName => {
            const group = radioGroups[groupName];
            const groupLabel = group.label.replace(/[*:]/g, '').trim();
            data[groupLabel] = group.value || 'None selected';
        });

        return data;
    }

    // Function to generate the spreadsheet and download it
    function exportToExcel() {
        const data = getFormData();
        if (Object.keys(data).length === 0) {
            console.log("No valid form fields found to export.");
            return;
        }

        let pageName = window.location.pathname.split('/').pop().replace('.html', '');
        if (!pageName) pageName = 'GST_Page';
        const filename = `GST_Data_${pageName}.xlsx`;

        // Check if XLSX library loaded successfully
        if (typeof XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = () => {
                saveWorksheet(data, filename);
            };
            document.head.appendChild(script);
        } else {
            saveWorksheet(data, filename);
        }
    }

    function saveWorksheet(data, filename) {
        const worksheet = XLSX.utils.json_to_sheet([data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Form Inputs");
        XLSX.writeFile(workbook, filename);
    }

    // Function to inject floating export button
    function injectFloatingButton() {
        if (document.getElementById('excel-export-fab')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            .excel-export-fab {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: linear-gradient(135deg, #107c41 0%, #1f9a55 100%);
                color: white !important;
                border: none;
                border-radius: 50px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                z-index: 99999;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Segoe UI', Arial, sans-serif;
                text-decoration: none !important;
            }
            .excel-export-fab:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 15px 30px rgba(16, 124, 65, 0.4);
                background: linear-gradient(135deg, #1f9a55 0%, #107c41 100%);
            }
            .excel-export-fab:active {
                transform: translateY(-1px) scale(1.02);
                box-shadow: 0 5px 15px rgba(16, 124, 65, 0.3);
            }
            .excel-export-fab svg {
                width: 18px;
                height: 18px;
                fill: white;
            }
        `;
        document.head.appendChild(style);

        const button = document.createElement('button');
        button.id = 'excel-export-fab';
        button.className = 'excel-export-fab';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21.186 10.74l-2.616-2.616C18.243 7.797 17.8 7.973 17.8 8.441V11h-4.8c-.55 0-1 .45-1 1s.45 1 1 1h4.8v2.559c0 .468.443.644.77.316l2.616-2.616c.3-.3.3-.778 0-1.078M15 18H5V6h10V5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.5h-2z"/>
            </svg>
            Export to Excel
        `;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            exportToExcel();
        });
        document.body.appendChild(button);
    }

    // Run setup on load
    function init() {
        injectFloatingButton();

        // Hook automatic export on submit/proceed action clicks
        const actionElements = document.querySelectorAll('button, a, input[type="submit"]');
        actionElements.forEach(el => {
            const text = el.textContent.trim().toUpperCase() || (el.value ? el.value.trim().toUpperCase() : '');
            if (
                text.includes('PROCEED') || 
                text.includes('LOGIN') || 
                text.includes('SAVE & CONTINUE') || 
                text.includes('SAVE AND CONTINUE') || 
                text.includes('SUBMIT')
            ) {
                el.addEventListener('click', () => {
                    exportToExcel();
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
