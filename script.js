// Text Entailment Labeling Tool - JavaScript functionality

class LabelingTool {
    constructor() {
        this.data = [];
        this.labels = {};
        this.currentIndex = 0;
        this.fileName = '';
        
        this.initializeEventListeners();
        this.loadFromStorage();
    }

    initializeEventListeners() {
        // File input change event
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Replace file input change event
        document.getElementById('replace-file-input').addEventListener('change', (e) => {
            this.handleReplaceFileSelection(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Prevent default drag and drop behavior
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            this.showError('Please select a valid JSON file.');
            return;
        }

        // Show file info
        this.fileName = file.name;
        this.displayFileInfo(file);

        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                this.validateAndLoadData(jsonData);
            } catch (error) {
                this.showError('Invalid JSON file. Please check the file format and try again.');
                console.error('JSON parsing error:', error);
            }
        };
        reader.readAsText(file);
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    validateAndLoadData(jsonData) {
        // Ensure data is an array
        if (!Array.isArray(jsonData)) {
            this.showError('JSON data must be an array of objects.');
            return;
        }

        // Validate each item has required keys
        const invalidItems = [];
        jsonData.forEach((item, index) => {
            if (!item.hasOwnProperty('hypothesis') || !item.hasOwnProperty('premise')) {
                invalidItems.push(index + 1);
            }
        });

        if (invalidItems.length > 0) {
            this.showError(`Invalid data format. Items at positions ${invalidItems.join(', ')} are missing "hypothesis" or "premise" keys.`);
            return;
        }

        if (jsonData.length === 0) {
            this.showError('The uploaded file contains no data items.');
            return;
        }

        // Data is valid, load it
        this.data = jsonData;
        this.labels = {};
        this.currentIndex = 0;
        
        // Initialize labels with existing ones if they exist
        this.data.forEach((item, index) => {
            if (item.hasOwnProperty('label')) {
                this.labels[index] = item.label;
            }
        });

        this.saveToStorage();
        this.showLabelingInterface();
        this.updateDisplay();
        
        // Show success message
        this.showToast(`Successfully loaded ${this.data.length} items for labeling.`);
    }

    showLabelingInterface() {
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('labeling-section').style.display = 'block';
        document.getElementById('labeling-section').classList.add('fade-in');
        document.getElementById('progress-indicator').style.display = 'block';
        
        // Update current file name display
        document.getElementById('current-file-name').textContent = this.fileName || 'Unknown file';
    }

    updateDisplay() {
        if (this.data.length === 0) return;

        const currentItem = this.data[this.currentIndex];
        
        // Update text displays
        document.getElementById('premise-text').textContent = currentItem.premise;
        document.getElementById('hypothesis-text').textContent = currentItem.hypothesis;
        
        // Update item number and progress
        document.getElementById('item-number').textContent = this.currentIndex + 1;
        document.getElementById('current-index').textContent = this.currentIndex + 1;
        document.getElementById('total-items').textContent = this.data.length;
        document.getElementById('total-count').textContent = this.data.length;
        
        // Update progress bar
        const progress = ((this.currentIndex + 1) / this.data.length) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        
        // Update labeled count
        const labeledCount = Object.keys(this.labels).length;
        document.getElementById('labeled-count').textContent = labeledCount;
        
        // Update label buttons
        this.updateLabelButtons();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    updateLabelButtons() {
        const buttons = document.querySelectorAll('.label-btn');
        const currentLabel = this.labels[this.currentIndex];
        
        buttons.forEach(button => {
            const label = button.getAttribute('data-label');
            button.classList.remove('active');
            
            if (label === currentLabel) {
                button.classList.add('active');
            }
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.data.length - 1;
    }

    selectLabel(label) {
        if (this.data.length === 0) return;
        
        this.labels[this.currentIndex] = label;
        this.updateDisplay();
        this.saveToStorage();
        
        // Add highlight animation
        const button = document.querySelector(`[data-label="${label}"]`);
        button.classList.add('highlight');
        setTimeout(() => button.classList.remove('highlight'), 600);
        
        // Auto-advance to next item if not the last one
        if (this.currentIndex < this.data.length - 1) {
            setTimeout(() => this.navigateItem(1), 300);
        }
    }

    navigateItem(direction) {
        const newIndex = this.currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.data.length) {
            this.currentIndex = newIndex;
            this.updateDisplay();
            this.saveToStorage();
        }
    }

    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when labeling interface is visible
        if (document.getElementById('labeling-section').style.display === 'none') {
            return;
        }

        // Prevent default behavior for our shortcuts
        const key = event.key;
        
        switch (key) {
            case '1':
                event.preventDefault();
                this.selectLabel('contradiction');
                break;
            case '2':
                event.preventDefault();
                this.selectLabel('neutral');
                break;
            case '3':
                event.preventDefault();
                this.selectLabel('entailment');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.navigateItem(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.navigateItem(1);
                break;
        }
    }

    exportData() {
        if (this.data.length === 0) {
            this.showError('No data to export. Please upload a file first.');
            return;
        }

        // Create export data with labels
        const exportData = this.data.map((item, index) => {
            const exportItem = { ...item };
            if (this.labels.hasOwnProperty(index)) {
                exportItem.label = this.labels[index];
            }
            return exportItem;
        });

        // Create and download file
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateExportFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        const labeledCount = Object.keys(this.labels).length;
        this.showToast(`Successfully exported ${this.data.length} items with ${labeledCount} labels.`);
    }

    generateExportFileName() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const baseName = this.fileName.replace('.json', '') || 'labeled_data';
        return `${baseName}_labeled_${timestamp}.json`;
    }

    saveToStorage() {
        const state = {
            data: this.data,
            labels: this.labels,
            currentIndex: this.currentIndex,
            fileName: this.fileName
        };
        localStorage.setItem('labelingToolState', JSON.stringify(state));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('labelingToolState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.data && state.data.length > 0) {
                    this.data = state.data;
                    this.labels = state.labels || {};
                    this.currentIndex = state.currentIndex || 0;
                    this.fileName = state.fileName || '';
                    
                    this.showLabelingInterface();
                    this.updateDisplay();
                }
            } catch (error) {
                console.error('Error loading saved state:', error);
                localStorage.removeItem('labelingToolState');
            }
        }
    }

    showError(message) {
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }

    handleReplaceFileSelection(event) {
        const file = event.target.files[0];
        if (!file) {
            document.getElementById('confirm-replace-btn').disabled = true;
            document.getElementById('replace-file-info').style.display = 'none';
            return;
        }

        if (file.type !== 'application/json') {
            this.showError('Please select a valid JSON file.');
            document.getElementById('confirm-replace-btn').disabled = true;
            return;
        }

        // Show file info
        const replaceFileName = document.getElementById('replace-file-name');
        const replaceFileSize = document.getElementById('replace-file-size');
        const replaceFileInfo = document.getElementById('replace-file-info');
        
        replaceFileName.textContent = file.name;
        replaceFileSize.textContent = this.formatFileSize(file.size);
        replaceFileInfo.style.display = 'block';
        
        // Enable replace button
        document.getElementById('confirm-replace-btn').disabled = false;
    }

    replaceDataset(jsonData, fileName) {
        // Validate the new data using the same validation logic
        if (!Array.isArray(jsonData)) {
            this.showError('JSON data must be an array of objects.');
            return;
        }

        const invalidItems = [];
        jsonData.forEach((item, index) => {
            if (!item.hasOwnProperty('hypothesis') || !item.hasOwnProperty('premise')) {
                invalidItems.push(index + 1);
            }
        });

        if (invalidItems.length > 0) {
            this.showError(`Invalid data format. Items at positions ${invalidItems.join(', ')} are missing "hypothesis" or "premise" keys.`);
            return;
        }

        if (jsonData.length === 0) {
            this.showError('The uploaded file contains no data items.');
            return;
        }

        // Replace the current dataset
        this.data = jsonData;
        this.labels = {};
        this.currentIndex = 0;
        this.fileName = fileName;
        
        // Initialize labels with existing ones if they exist
        this.data.forEach((item, index) => {
            if (item.hasOwnProperty('label')) {
                this.labels[index] = item.label;
            }
        });

        // Update the interface
        this.saveToStorage();
        this.updateDisplay();
        document.getElementById('current-file-name').textContent = this.fileName;
        
        // Show success message
        this.showToast(`Successfully replaced dataset with ${this.data.length} new items.`);
    }

    showToast(message) {
        // Create a temporary toast for success messages
        const toast = document.createElement('div');
        toast.className = 'toast show position-fixed bottom-0 start-0 m-3';
        toast.style.zIndex = '1050';
        toast.innerHTML = `
            <div class="toast-header bg-success text-white">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function selectLabel(label) {
    window.labelingTool.selectLabel(label);
}

function navigateItem(direction) {
    window.labelingTool.navigateItem(direction);
}

function exportData() {
    window.labelingTool.exportData();
}

function hideError() {
    document.getElementById('error-alert').style.display = 'none';
}

function showFileReplace() {
    const modal = new bootstrap.Modal(document.getElementById('fileReplaceModal'));
    modal.show();
    
    // Reset the modal state
    document.getElementById('replace-file-input').value = '';
    document.getElementById('confirm-replace-btn').disabled = true;
    document.getElementById('replace-file-info').style.display = 'none';
}

function confirmFileReplace() {
    const fileInput = document.getElementById('replace-file-input');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Read and process the new file
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);
            window.labelingTool.replaceDataset(jsonData, file.name);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('fileReplaceModal'));
            modal.hide();
        } catch (error) {
            window.labelingTool.showError('Invalid JSON file. Please check the file format and try again.');
            console.error('JSON parsing error:', error);
        }
    };
    reader.readAsText(file);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.labelingTool = new LabelingTool();
    
    // Show keyboard shortcuts help after a delay
    setTimeout(function() {
        const helpToast = new bootstrap.Toast(document.getElementById('keyboard-help'));
        helpToast.show();
    }, 2000);
});
