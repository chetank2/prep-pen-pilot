import { Note, PDFMetadata } from './api';

// IndexedDB wrapper for complex data
class IndexedDBService {
  private dbName = 'upsc-prep-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('type', 'type', { unique: false });
          notesStore.createIndex('folderId', 'folderId', { unique: false });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('pdfs')) {
          const pdfsStore = db.createObjectStore('pdfs', { keyPath: 'id' });
          pdfsStore.createIndex('filename', 'filename', { unique: false });
          pdfsStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('summaries')) {
          const summariesStore = db.createObjectStore('summaries', { keyPath: 'id' });
          summariesStore.createIndex('pdfId', 'pdfId', { unique: false });
          summariesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.put(note);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getNote(id: string): Promise<Note | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getNotes(filters?: { type?: string; folderId?: string }): Promise<Note[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let notes = request.result || [];
        
        if (filters?.type) {
          notes = notes.filter(note => note.type === filters.type);
        }
        
        if (filters?.folderId) {
          notes = notes.filter(note => note.folderId === filters.folderId);
        }

        resolve(notes);
      };
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async savePDF(pdf: PDFMetadata): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pdfs'], 'readwrite');
      const store = transaction.objectStore('pdfs');
      const request = store.put(pdf);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPDFs(): Promise<PDFMetadata[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pdfs'], 'readonly');
      const store = transaction.objectStore('pdfs');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}

// LocalStorage wrapper for simple data
class LocalStorageService {
  private prefix = 'upsc-prep-';

  set(key: string, value: any): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue || null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// Settings and preferences
export interface AppSettings {
  theme: 'light' | 'dark';
  aiEnabled: boolean;
  autoSave: boolean;
  defaultFolder: string;
  canvasSettings: {
    defaultStrokeWidth: number;
    defaultColor: string;
    pressureSensitive: boolean;
  };
}

const defaultSettings: AppSettings = {
  theme: 'light',
  aiEnabled: true,
  autoSave: true,
  defaultFolder: 'general',
  canvasSettings: {
    defaultStrokeWidth: 3,
    defaultColor: '#000000',
    pressureSensitive: false,
  },
};

class SettingsService {
  private localStorage = new LocalStorageService();

  getSettings(): AppSettings {
    return this.localStorage.get('settings', defaultSettings) || defaultSettings;
  }

  updateSettings(updates: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.localStorage.set('settings', updated);
  }

  resetSettings(): void {
    this.localStorage.set('settings', defaultSettings);
  }
}

// Export services
export const indexedDBService = new IndexedDBService();
export const localStorageService = new LocalStorageService();
export const settingsService = new SettingsService();

// Initialize IndexedDB on module load
indexedDBService.init().catch(console.error); 