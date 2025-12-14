import api from './api';

/**
 * Generates and exports a PDF for a job
 * Downloads the PDF and opens it in a new tab
 * @param {number} jobId - The job ID
 * @param {string} jobNumber - The job number for filename
 * @returns {Promise<void>}
 */
export const exportJobPDF = async (jobId, jobNumber) => {
    try {
        // Fetch PDF blob from API (no breakdown by default)
        const response = await api.get(`/api/v1/jobs/${jobId}/pdf`, {
            params: { show_breakdown: false },
            responseType: 'blob'
        });

        // Create blob URL
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `Job_${jobNumber}_${date}.pdf`;

        // Download the PDF
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        downloadLink.click();

        // Open in new tab
        window.open(blobUrl, '_blank');

        // Cleanup after a delay to ensure both operations complete
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);

        return { success: true };
    } catch (error) {
        console.error('Error exporting job PDF:', error);
        throw error;
    }
};

/**
 * Generates and exports a PDF for an indent
 * Downloads the PDF and opens it in a new tab
 * @param {number} indentId - The indent ID
 * @param {string} serialNumber - The indent serial number for filename
 * @returns {Promise<void>}
 */
export const exportIndentPDF = async (indentId, serialNumber) => {
    try {
        // Fetch PDF blob from API
        const response = await api.get(`/api/v1/indents/${indentId}/pdf`, {
            responseType: 'blob'
        });

        // Create blob URL
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `Indent_${serialNumber}_${date}.pdf`;

        // Download the PDF
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        downloadLink.click();

        // Open in new tab
        window.open(blobUrl, '_blank');

        // Cleanup after a delay to ensure both operations complete
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);

        return { success: true };
    } catch (error) {
        console.error('Error exporting indent PDF:', error);
        throw error;
    }
};

