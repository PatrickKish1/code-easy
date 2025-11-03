/**
 * File extension to icon mapping utility
 * Supports both local image paths and external URLs
 */

export type FileIcon = string | { url: string; alt?: string };

export interface FileIconConfig {
  extensions: string[];
  icon: FileIcon;
}

// Common file extension to icon mappings
// Icons can be placed in /public/icons/ directory or use external URLs
// You can use icon libraries like:
// - vscode-icons: https://github.com/vscode-icons/vscode-icons
// - file-icons: https://github.com/file-icons/icons
// - simple-icons: https://simpleicons.org/
const FILE_ICON_MAPPINGS: FileIconConfig[] = [
  // Web
  { extensions: ['html', 'htm'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { extensions: ['css', 'scss', 'sass', 'less'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { extensions: ['js', 'mjs', 'cjs'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { extensions: ['jsx'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { extensions: ['ts'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { extensions: ['tsx'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  
  // Config & Data
  { extensions: ['json'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/json/json-original.svg' },
  { extensions: ['yaml', 'yml'], icon: '/icons/file.svg' }, // Can be replaced with yaml icon
  { extensions: ['xml'], icon: '/icons/file.svg' },
  { extensions: ['toml'], icon: '/icons/file.svg' },
  { extensions: ['env', 'env.local'], icon: '/icons/file.svg' },
  
  // Documentation
  { extensions: ['md', 'markdown'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg' },
  { extensions: ['txt'], icon: '/icons/file.svg' },
  { extensions: ['pdf'], icon: '/icons/file.svg' },
  
  // Images
  { extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'], icon: '/icons/file.svg' },
  
  // Video & Audio
  { extensions: ['mp4', 'avi', 'mov', 'webm'], icon: '/icons/file.svg' },
  { extensions: ['mp3', 'wav', 'ogg', 'flac'], icon: '/icons/file.svg' },
  
  // Archives
  { extensions: ['zip', 'tar', 'gz', 'rar', '7z'], icon: '/icons/file.svg' },
  
  // Code & Scripts
  { extensions: ['py'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { extensions: ['java'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { extensions: ['cpp', 'cxx', 'cc', 'c++'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
  { extensions: ['c'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg' },
  { extensions: ['cs'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
  { extensions: ['php'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { extensions: ['rb'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
  { extensions: ['go'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
  { extensions: ['rs'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg' },
  { extensions: ['swift'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg' },
  { extensions: ['kt'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg' },
  { extensions: ['dart'], icon: '/icons/file.svg' },
  
  // Shell
  { extensions: ['sh', 'bash'], icon: '/icons/file.svg' },
  { extensions: ['ps1'], icon: '/icons/file.svg' },
  { extensions: ['bat', 'cmd'], icon: '/icons/file.svg' },
  
  // Database
  { extensions: ['sql'], icon: '/icons/file.svg' },
  { extensions: ['db', 'sqlite'], icon: '/icons/file.svg' },
  
  // Build & Config
  { extensions: ['lock'], icon: '/icons/file.svg' },
  { extensions: ['gitignore', 'gitattributes'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { extensions: ['dockerfile'], icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { extensions: ['makefile'], icon: '/icons/file.svg' },
  
  // Default fallback
  { extensions: ['default'], icon: '/icons/file.svg' },
];

// Cache for extension to icon mapping
const iconCache = new Map<string, FileIcon>();

/**
 * Get file icon for a given file path or extension
 * @param path - File path (e.g., "src/index.tsx") or extension (e.g., "tsx")
 * @returns Icon path/URL or default icon
 */
export function getFileIcon(path: string): FileIcon {
  // Check cache first
  if (iconCache.has(path)) {
    return iconCache.get(path)!;
  }

  // Extract extension from path
  const ext = path.includes('.') 
    ? path.split('.').pop()?.toLowerCase() || ''
    : path.toLowerCase();

  // Handle special cases
  if (ext === 'dockerfile' || path.toLowerCase() === 'dockerfile') {
    iconCache.set(path, '/icons/docker.svg');
    return '/icons/docker.svg';
  }

  // Find matching icon
  for (const mapping of FILE_ICON_MAPPINGS) {
    if (mapping.extensions.includes(ext) || (ext === '' && mapping.extensions.includes('default'))) {
      const icon = mapping.icon;
      iconCache.set(path, icon);
      return icon;
    }
  }

  // Return default icon
  const defaultIcon = '/icons/file.svg';
  iconCache.set(path, defaultIcon);
  return defaultIcon;
}

/**
 * Get file icon component props
 * Returns an object with src and alt for use in img tags
 */
export function getFileIconProps(path: string): { src: string; alt: string } {
  const icon = getFileIcon(path);
  const src = typeof icon === 'string' ? icon : icon.url;
  const alt = typeof icon === 'string' 
    ? `${path.split('.').pop() || 'file'} icon` 
    : icon.alt || `${path.split('.').pop() || 'file'} icon`;
  
  return { src, alt };
}

/**
 * Add custom icon mapping
 * Useful for adding project-specific icons
 */
export function addIconMapping(extensions: string[], icon: FileIcon): void {
  FILE_ICON_MAPPINGS.unshift({ extensions, icon });
  // Clear cache when new mappings are added
  iconCache.clear();
}

/**
 * Set a custom icon for a specific file path
 */
export function setFileIcon(path: string, icon: FileIcon): void {
  iconCache.set(path, icon);
}

