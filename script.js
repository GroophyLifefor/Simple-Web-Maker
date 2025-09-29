class WebMaker {
  constructor() {
    this.previewArea = document.getElementById('preview-area');
    this.htmlOutput = document.getElementById('html-output');
    this.copyButton = document.getElementById('copy-html');
    this.elementCounter = 0;
    this.currentEditingElement = null;
    
    // Modal elements
    this.modal = document.getElementById('edit-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalClose = document.getElementById('modal-close');
    this.modalCancel = document.getElementById('modal-cancel');
    this.modalSave = document.getElementById('modal-save');
    this.textInputContainer = document.getElementById('text-input-container');
    this.listInputContainer = document.getElementById('list-input-container');
    this.textInput = document.getElementById('text-input');
    this.listItemsWrapper = document.getElementById('list-items-wrapper');
    this.addListItemBtn = document.getElementById('add-list-item');
    
    this.init();
  }
  
  init() {
    this.setupDragAndDrop();
    this.setupCopyButton();
    this.setupModal();
    this.updateHtmlOutput();
    
    // Prevent default drag behavior on document to avoid deletions
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
      // Only prevent default if not dropping in preview area
      if (!this.previewArea.contains(e.target)) {
        e.preventDefault();
        // Don't do anything - just prevent browser default behavior
      }
    });
  }
  
  setupDragAndDrop() {
    // Handle dragging from input panel
    const elementButtons = document.querySelectorAll('.element-btn');
    
    elementButtons.forEach(button => {
      button.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', button.dataset.type);
        e.dataTransfer.setData('source', 'input');
        button.style.opacity = '0.5';
      });
      
      button.addEventListener('dragend', (e) => {
        button.style.opacity = '1';
      });
    });
    
    // Handle dropping in preview area
    this.previewArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      
      // Handle dragging from input panel
      if (e.dataTransfer.types.includes('text/plain')) {
        this.previewArea.classList.add('drag-over');
        
        // If dragging from preview (reordering), handle top and bottom zones
        if (this.draggedElement) {
          const rect = this.previewArea.getBoundingClientRect();
          const elements = this.previewArea.querySelectorAll('.preview-element:not(.dragging)');
          
          // Top zone - make it first
          if (e.clientY < rect.top + 50) {
            this.clearDragFeedback();
            if (elements.length > 0) {
              elements[0].style.borderTop = '3px solid #667eea';
            }
            return;
          }
          
          // Bottom zone - make it last
          if (e.clientY > rect.bottom - 50) {
            this.clearDragFeedback();
            if (elements.length > 0) {
              elements[elements.length - 1].style.borderBottom = '3px solid #667eea';
            }
            return;
          }
        }
      }
    });
    
    this.previewArea.addEventListener('dragleave', (e) => {
      if (!this.previewArea.contains(e.relatedTarget)) {
        this.previewArea.classList.remove('drag-over');
        this.clearDragFeedback();
      }
    });
    
    this.previewArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.previewArea.classList.remove('drag-over');
      
      const elementType = e.dataTransfer.getData('text/plain');
      const source = e.dataTransfer.getData('source');
      
      if (source === 'input') {
        this.addElement(elementType);
      } else if (this.draggedElement) {
        // Handle drop in top/bottom zones
        const rect = this.previewArea.getBoundingClientRect();
        const elements = this.previewArea.querySelectorAll('.preview-element:not(.dragging)');
        
        if (e.clientY < rect.top + 50 && elements.length > 0) {
          // Drop at the beginning
          this.previewArea.insertBefore(this.draggedElement, elements[0]);
          this.updateHtmlOutput();
        } else if (e.clientY > rect.bottom - 50) {
          // Drop at the end
          this.previewArea.appendChild(this.draggedElement);
          this.updateHtmlOutput();
        }
      }
      
      this.clearDragFeedback();
    });
  }
  
  addElement(type) {
    // Remove drop hint if it exists
    const dropHint = this.previewArea.querySelector('.drop-hint');
    if (dropHint) {
      dropHint.remove();
    }
    
    this.elementCounter++;
    const element = document.createElement('div');
    element.className = 'preview-element';
    element.draggable = true;
    element.dataset.id = `element-${this.elementCounter}`;
    element.dataset.type = type;
    
    let content;
    switch (type) {
      case 'h1':
        content = '<h1>Heading 1</h1>';
        break;
      case 'h2':
        content = '<h2>Heading 2</h2>';
        break;
      case 'p':
        content = '<p>This is a paragraph. Double-click to edit.</p>';
        break;
      case 'ul':
        content = '<ul><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>';
        break;
      case 'ol':
        content = '<ol><li>List item 1</li><li>List item 2</li><li>List item 3</li></ol>';
        break;
      default:
        content = '<p>Unknown element</p>';
    }
    
    // Add delete button
    element.innerHTML = content + '<button class="delete-btn" title="Delete">×</button>';
    this.previewArea.appendChild(element);
    
    // Add event listeners for this element
    this.setupElementEvents(element);
    this.updateHtmlOutput();
  }
  
  setupElementEvents(element) {
    const deleteBtn = element.querySelector('.delete-btn');
    
    // Double-click to edit
    element.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.editElement(element);
    });
    
    // Delete button click
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      element.remove();
      this.updateHtmlOutput();
      
      if (this.previewArea.children.length === 0) {
        const dropHint = document.createElement('p');
        dropHint.className = 'drop-hint';
        dropHint.textContent = 'Drag elements here to build your page';
        this.previewArea.appendChild(dropHint);
      }
    });
    
    // Drag start
    element.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', element.dataset.id);
      e.dataTransfer.setData('source', 'preview');
      element.classList.add('dragging');
      this.draggedElement = element;
    });
    
    // Drag end
    element.addEventListener('dragend', (e) => {
      element.classList.remove('dragging');
      this.clearDragFeedback();
      this.draggedElement = null;
    });
    
    // Drag over - show where it will drop
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedElement && this.draggedElement !== element) {
        this.clearDragFeedback();
        const rect = element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
          element.style.borderTop = '3px solid #667eea';
          this.showPlaceholder(element, 'before');
        } else {
          element.style.borderBottom = '3px solid #667eea';
          this.showPlaceholder(element, 'after');
        }
      }
    });
    
    // Drop - actually move the element
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedElement && this.draggedElement !== element) {
        const rect = element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
          element.parentNode.insertBefore(this.draggedElement, element);
        } else {
          element.parentNode.insertBefore(this.draggedElement, element.nextSibling);
        }
        this.updateHtmlOutput();
      }
      this.clearDragFeedback();
    });
  }
  
  showPlaceholder(element, position) {
    this.clearPlaceholders();
    
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    
    if (position === 'before') {
      element.parentNode.insertBefore(placeholder, element);
    } else {
      element.parentNode.insertBefore(placeholder, element.nextSibling);
    }
  }
  
  clearPlaceholders() {
    const placeholders = document.querySelectorAll('.drag-placeholder');
    placeholders.forEach(placeholder => placeholder.remove());
  }
  
  clearDragFeedback() {
    const placeholders = document.querySelectorAll('.drag-placeholder');
    placeholders.forEach(placeholder => placeholder.remove());
    
    // Clear all border indicators
    const elements = document.querySelectorAll('.preview-element');
    elements.forEach(el => {
      el.style.borderTop = '';
      el.style.borderBottom = '';
    });
  }
  
  editElement(element) {
    this.currentEditingElement = element;
    const currentContent = element.innerHTML;
    const contentWithoutButton = currentContent.replace(/<button class="delete-btn"[^>]*>.*?<\/button>/g, '');
    
    // Check if it's a list (ul or ol)
    const listMatch = contentWithoutButton.match(/<(ul|ol)>(.*?)<\/\1>/s);
    if (listMatch) {
      const listType = listMatch[1];
      this.openListModal(listType, contentWithoutButton);
    } else {
      // Handle regular elements (h1, h2, p)
      const tagMatch = contentWithoutButton.match(/<(\w+)>(.*?)<\/\1>/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const textContent = tagMatch[2];
        this.openTextModal(tagName, textContent);
      }
    }
  }

  setupModal() {
    // Close modal events
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modalCancel.addEventListener('click', () => this.closeModal());
    
    // Save modal event
    this.modalSave.addEventListener('click', () => this.saveModalContent());
    
    // Add list item event
    this.addListItemBtn.addEventListener('click', () => this.addListItem());
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('show')) {
        this.closeModal();
      }
    });
  }
  
  openTextModal(tagName, content) {
    this.modalTitle.textContent = `Edit ${tagName.toUpperCase()}`;
    this.textInputContainer.style.display = 'block';
    this.listInputContainer.style.display = 'none';
    this.textInput.value = content;
    this.textInput.dataset.tagName = tagName;
    this.showModal();
    
    // Focus the input
    setTimeout(() => {
      this.textInput.focus();
      this.textInput.select();
    }, 100);
  }
  
  openListModal(listType, content) {
    this.modalTitle.textContent = `Edit ${listType.toUpperCase()} List`;
    this.textInputContainer.style.display = 'none';
    this.listInputContainer.style.display = 'block';
    
    // Extract current list items
    const listContent = content.match(/<(ul|ol)>(.*?)<\/\1>/s)[2];
    const itemMatches = listContent.match(/<li>(.*?)<\/li>/g) || [];
    const items = itemMatches.map(item => item.replace(/<\/?li>/g, ''));
    
    // Clear existing list items
    this.listItemsWrapper.innerHTML = '';
    
    // Add list items or default ones
    if (items.length > 0) {
      items.forEach(item => this.addListItem(item));
    } else {
      this.addListItem('List item 1');
      this.addListItem('List item 2');
      this.addListItem('List item 3');
    }
    
    this.listInputContainer.dataset.listType = listType;
    this.showModal();
    
    // Focus first input
    setTimeout(() => {
      const firstInput = this.listItemsWrapper.querySelector('.list-item-input');
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 100);
  }
  
  addListItem(value = '') {
    const itemGroup = document.createElement('div');
    itemGroup.className = 'list-item-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'list-item-input';
    input.value = value;
    input.placeholder = `List item ${this.listItemsWrapper.children.length + 1}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-item-btn';
    removeBtn.innerHTML = '&times;';
    
    removeBtn.addEventListener('click', () => {
      itemGroup.remove();
      this.updateListItemPlaceholders();
    });
    
    // Enter key to add new item
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addListItem();
        // Focus the new input
        setTimeout(() => {
          const newInput = this.listItemsWrapper.lastElementChild.querySelector('.list-item-input');
          if (newInput) newInput.focus();
        }, 10);
      }
    });
    
    itemGroup.appendChild(input);
    itemGroup.appendChild(removeBtn);
    this.listItemsWrapper.appendChild(itemGroup);
    
    this.updateListItemPlaceholders();
  }
  
  updateListItemPlaceholders() {
    const inputs = this.listItemsWrapper.querySelectorAll('.list-item-input');
    inputs.forEach((input, index) => {
      input.placeholder = `List item ${index + 1}`;
    });
  }
  
  showModal() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  closeModal() {
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
    this.currentEditingElement = null;
  }
  
  saveModalContent() {
    if (!this.currentEditingElement) return;
    
    if (this.textInputContainer.style.display !== 'none') {
      // Save text content
      const newText = this.textInput.value.trim();
      const tagName = this.textInput.dataset.tagName;
      
      if (newText) {
        this.currentEditingElement.innerHTML = `<${tagName}>${newText}</${tagName}><button class="delete-btn" title="Delete">×</button>`;
        this.setupElementEvents(this.currentEditingElement); // Reattach events
        this.updateHtmlOutput();
        this.animateElementUpdate(this.currentEditingElement);
      }
    } else {
      // Save list content
      const inputs = this.listItemsWrapper.querySelectorAll('.list-item-input');
      const items = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');
      
      if (items.length > 0) {
        const listType = this.listInputContainer.dataset.listType;
        const listContent = items.map(item => `<li>${item}</li>`).join('');
        this.currentEditingElement.innerHTML = `<${listType}>${listContent}</${listType}><button class="delete-btn" title="Delete">×</button>`;
        this.setupElementEvents(this.currentEditingElement); // Reattach events
        this.updateHtmlOutput();
        this.animateElementUpdate(this.currentEditingElement);
      }
    }
    
    this.closeModal();
  }
  
  animateElementUpdate(element) {
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'scale(1.05)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 300);
  }
  
  updateHtmlOutput() {
    const elements = this.previewArea.querySelectorAll('.preview-element');
    let html = '';
    
    elements.forEach(element => {
      // Get content without the delete button
      const content = element.innerHTML.replace(/<button class="delete-btn"[^>]*>.*?<\/button>/g, '');
      html += this.formatHtml(content) + '\n';
    });
    
    this.htmlOutput.value = html.trim();
  }
  
  formatHtml(htmlString) {
    // Parse the HTML to format it properly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    const element = tempDiv.firstElementChild;
    if (!element) return htmlString;
    
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'ul' || tagName === 'ol') {
      // Format lists with proper indentation
      const listItems = element.querySelectorAll('li');
      let formattedList = `<${tagName}>\n`;
      
      listItems.forEach(li => {
        formattedList += `  <li>${li.textContent}</li>\n`;
      });
      
      formattedList += `</${tagName}>`;
      return formattedList;
    } else {
      // Format single-line elements
      return `<${tagName}>${element.textContent}</${tagName}>`;
    }
  }
  
  setupCopyButton() {
    this.copyButton.addEventListener('click', () => {
      this.htmlOutput.select();
      navigator.clipboard.writeText(this.htmlOutput.value).then(() => {
        // Visual feedback
        this.copyButton.textContent = 'Copied!';
        this.copyButton.classList.add('success-flash');
        
        setTimeout(() => {
          this.copyButton.textContent = 'Copy HTML';
          this.copyButton.classList.remove('success-flash');
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        document.execCommand('copy');
        this.copyButton.textContent = 'Copied!';
        setTimeout(() => {
          this.copyButton.textContent = 'Copy HTML';
        }, 2000);
      });
    });
  }
}

// Initialize the web maker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WebMaker();
});