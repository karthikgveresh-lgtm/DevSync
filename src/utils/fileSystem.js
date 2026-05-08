/**
 * File System Utilities for modern browser File System Access API
 */

export const openFileFromSystem = async () => {
  if (!('showOpenFilePicker' in window)) {
    alert("Your browser does not support the modern File System Access API. Please use Google Chrome, Edge, or Opera.");
    return null;
  }
  
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
    });
    const file = await handle.getFile();
    const content = await file.text();
    
    return {
      name: file.name,
      content: content,
      type: file.name.split('.').pop() || 'plaintext',
    };
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error opening file:', err);
    }
    return null;
  }
};

export const openFolderFromSystem = async () => {
  if (!('showDirectoryPicker' in window)) {
    alert("Your browser does not support the modern File System Access API. Please use Google Chrome, Edge, or Opera to open local folders.");
    return null;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker();
    const result = [];
    
    // Recursive function to read directory
    async function readDirectory(handle, parentId = null) {
      const folderId = Math.random().toString(36).substr(2, 9);
      
      result.push({
        id: folderId,
        name: handle.name,
        type: 'folder',
        isFolder: true,
        isOpen: true,
        parentId: parentId
      });

      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const content = await file.text();
          result.push({
            id: Math.random().toString(36).substr(2, 9),
            name: entry.name,
            type: entry.name.split('.').pop() || 'plaintext',
            isFolder: false,
            content: content,
            parentId: folderId
          });
        } else if (entry.kind === 'directory') {
          await readDirectory(entry, folderId);
        }
      }
    }

    await readDirectory(directoryHandle);
    return result;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error opening folder:', err);
    }
    return null;
  }
};
