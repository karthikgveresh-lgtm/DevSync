import { WebContainer } from '@webcontainer/api';

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;
let bootPromise = null;

export async function getWebContainer() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  if (!bootPromise) {
    bootPromise = WebContainer.boot();
  }
  
  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
}

export async function writeFilesToContainer(files) {
  const container = await getWebContainer();
  const fileSystemTree = {};

  for (const file of files) {
    if (!file.isFolder) {
      // Basic flat structure for the hackathon prototype.
      // In a full app, we'd build the nested tree.
      fileSystemTree[file.name] = {
        file: {
          contents: file.content || ''
        }
      };
    }
  }

  await container.mount(fileSystemTree);
}
