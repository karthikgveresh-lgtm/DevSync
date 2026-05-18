import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEditor } from './EditorContext';

const ExtensionContext = createContext();

export const useExtensions = () => useContext(ExtensionContext);

export const ExtensionProvider = ({ children }) => {
  const editor = useEditor();
  const [installedExtensions, setInstalledExtensions] = useState([]);
  const [statusBarItems, setStatusBarItems] = useState([]);

  // This is the API exposed to our "Extensions"
  useEffect(() => {
    window.devSyncAPI = {
      editor,
      registerExtension: (ext) => {
        setInstalledExtensions(prev => {
          if (prev.find(e => e.id === ext.id)) return prev;
          setTimeout(() => {
            if (ext.onActivate) {
              try {
                ext.onActivate(window.devSyncAPI);
              } catch (err) {
                console.error(`Error activating extension ${ext.id}:`, err);
              }
            }
          }, 0);
          return [...prev, ext];
        });
      },
      addStatusBarItem: (item) => {
        setStatusBarItems(prev => [...prev, item]);
      },
      showNotification: (msg) => {
        alert(`[DevSync Extension]: ${msg}`);
      },
      // Utility for extensions to easily insert code
      insertText: (text) => {
        if (!editor.activeFileId) return;
        const currentContent = editor.activeFile?.content || '';
        editor.handleEditorChange(currentContent + text);
      }
    };
  }, [editor]);

  const value = {
    installedExtensions,
    statusBarItems
  };

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  );
};
