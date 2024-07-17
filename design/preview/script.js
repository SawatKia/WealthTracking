// Existing script
const header = document.querySelector('.header');
const gridContainer = document.querySelector('.grid-container');
const gridItems = document.querySelectorAll('.grid-item');

let isHovering = false;

header.addEventListener('mouseenter', () => {
    gridContainer.classList.add('show');
});

header.addEventListener('mouseleave', () => {
    setTimeout(() => {
        if (!isHovering) {
            gridContainer.classList.remove('show');
        }
    }, 100);
});

gridContainer.addEventListener('mouseenter', () => {
    isHovering = true;
    gridContainer.classList.add('show');
});

gridContainer.addEventListener('mouseleave', () => {
    isHovering = false;
    gridContainer.classList.remove('show');
});

window.addEventListener('scroll', () => {
    if (!isHovering && !header.matches(':hover')) {
        gridContainer.classList.remove('show');
    }
});

gridItems.forEach(item => {
    item.addEventListener('click', () => {
        const link = item.querySelector('a');
        if (link) {
            window.location.href = link.href;
        }
    });
});

// New export functionality
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.export-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const format = button.getAttribute('data-format');
            const targetId = button.getAttribute('data-target');
            const element = document.getElementById(targetId);

            if (!element) {
                console.error(`Element with ID ${targetId} not found`);
                return;
            }

            console.log(`Exporting ${targetId} as ${format}`);

            if (format === 'png') {
                await exportAsPNG(element);
            } else if (format === 'pdf') {
                await exportAsPDF(element);
            }
        });
    });
});

async function exportAsPNG(element) {
    try {
        const canvas = await html2canvas(element);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: `${element.id}.png`,
                types: [{
                    description: 'PNG File',
                    accept: { 'image/png': ['.png'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            // Fallback for browsers that don't support showSaveFilePicker
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${element.id}.png`;
            link.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Failed to export as PNG:', error);
    }
}

async function exportAsPDF(element) {
    try {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: `${element.id}.pdf`,
                types: [{
                    description: 'PDF File',
                    accept: { 'application/pdf': ['.pdf'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(pdf.output('blob'));
            await writable.close();
        } else {
            // Fallback for browsers that don't support showSaveFilePicker
            pdf.save(`${element.id}.pdf`);
        }
    } catch (error) {
        console.error('Failed to export as PDF:', error);
    }
}
