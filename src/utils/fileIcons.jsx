import React from 'react';
import { 
  FileCode, Folder as FolderIcon, FolderOpen, 
  FileJson, FileText, File, Image, Hexagon, GitBranch 
} from 'lucide-react';

export const getFileIcon = (fileName, isFolder, isOpen) => {
  if (isFolder) {
    let color = "#dcb67a";
    if (fileName === 'node_modules') color = "#8b9eb5";
    else if (fileName === 'src') color = "#43853d";
    else if (fileName === 'public') color = "#8a553f";
    else if (fileName === 'server') color = "#50a14f";
    return isOpen ? <FolderOpen size={14} color={color} /> : <FolderIcon size={14} color={color} />;
  }

  const ext = (fileName || '').split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return <FileCode size={14} color="#f5c036" />;
    case 'html':
      return <FileCode size={14} color="#e34c26" />;
    case 'css':
      return <FileCode size={14} color="#264de4" />;
    case 'json':
      return <FileJson size={14} color="#8bc500" />;
    case 'md':
      return <FileText size={14} color="#519aba" />;
    case 'svg':
    case 'png':
    case 'jpg':
      return <Image size={14} color="#a074c4" />;
    case 'py':
      return <FileCode size={14} color="#3572A5" />;
    case 'gitignore':
      return <GitBranch size={14} color="#f14e32" />;
    default:
      if ((fileName || '').includes('eslint')) return <Hexagon size={14} color="#4b32c3" />;
      return <File size={14} color="#cccccc" />;
  }
};
