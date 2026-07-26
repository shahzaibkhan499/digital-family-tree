'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Upload, FileText, Image as ImageIcon, Clock, Cloud,
  FolderOpen, Camera, Check, ChevronRight, HardDrive, Wifi,
  MonitorSmartphone, Smartphone, Plus, Grid3X3, List,
} from 'lucide-react';

export interface SelectedDocument {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  source: 'upload' | 'vault' | 'drive' | 'dropbox' | 'onedrive' | 'icloud' | 'recent';
  thumbnail?: string;
}

interface DocumentPickerProps {
  onSelect: (documents: SelectedDocument[]) => void;
  onClose: () => void;
  isOpen: boolean;
  maxSelection?: number;
  accept?: string[];
  mode?: 'single' | 'multiple';
}

type PickerTab = 'upload' | 'vault' | 'recent' | 'cloud' | 'gallery';

const TAB_CONFIG: { id: PickerTab; label: string; icon: any }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'vault', label: 'Document Vault', icon: FolderOpen },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'cloud', label: 'Cloud Providers', icon: Cloud },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
];

const CLOUD_PROVIDERS = [
  { id: 'drive', name: 'Google Drive', icon: 'ðŸ“', color: 'from-blue-500 to-green-500', connected: false },
  { id: 'dropbox', name: 'Dropbox', icon: 'ðŸ“¦', color: 'from-blue-600 to-blue-400', connected: false },
  { id: 'onedrive', name: 'OneDrive', icon: 'â˜ï¸', color: 'from-blue-500 to-cyan-400', connected: false },
  { id: 'icloud', name: 'iCloud', icon: 'ðŸŽ', color: 'from-slate-400 to-slate-300', connected: false },
];

const MOCK_VAULT_DOCS: SelectedDocument[] = [
  { id: 'v1', name: 'Marriage Certificate.pdf', url: '#', type: 'application/pdf', size: 245000, source: 'vault', thumbnail: undefined },
  { id: 'v2', name: 'Family Tree Diagram.png', url: '#', type: 'image/png', size: 1200000, source: 'vault', thumbnail: undefined },
  { id: 'v3', name: 'Birth Record - Ali.pdf', url: '#', type: 'application/pdf', size: 89000, source: 'vault', thumbnail: undefined },
  { id: 'v4', name: 'Photo Album 2024.zip', url: '#', type: 'application/zip', size: 15000000, source: 'vault', thumbnail: undefined },
  { id: 'v5', name: 'Property Deed.pdf', url: '#', type: 'application/pdf', size: 540000, source: 'vault', thumbnail: undefined },
  { id: 'v6', name: 'Passport Scan.jpg', url: '#', type: 'image/jpeg', size: 320000, source: 'vault', thumbnail: undefined },
];

const MOCK_RECENT_DOCS: SelectedDocument[] = [
  { id: 'r1', name: 'Meeting Notes.docx', url: '#', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 45000, source: 'recent', thumbnail: undefined },
  { id: 'r2', name: 'Budget 2024.xlsx', url: '#', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 128000, source: 'recent', thumbnail: undefined },
  { id: 'r3', name: 'Invitation Card.png', url: '#', type: 'image/png', size: 890000, source: 'recent', thumbnail: undefined },
];

const MOCK_GALLERY_ITEMS: SelectedDocument[] = [
  { id: 'g1', name: 'Wedding Photo 1.jpg', url: '#', type: 'image/jpeg', size: 2400000, source: 'vault', thumbnail: undefined },
  { id: 'g2', name: 'Family Portrait.png', url: '#', type: 'image/png', size: 3100000, source: 'vault', thumbnail: undefined },
  { id: 'g3', name: 'Celebration Shot.jpg', url: '#', type: 'image/jpeg', size: 1800000, source: 'vault', thumbnail: undefined },
  { id: 'g4', name: 'Group Photo.jpg', url: '#', type: 'image/jpeg', size: 2900000, source: 'vault', thumbnail: undefined },
  { id: 'g5', name: 'Ceremony Detail.png', url: '#', type: 'image/png', size: 1500000, source: 'vault', thumbnail: undefined },
  { id: 'g6', name: 'Reception Hall.jpg', url: '#', type: 'image/jpeg', size: 2200000, source: 'vault', thumbnail: undefined },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'ðŸ–¼ï¸';
  if (type.includes('pdf')) return 'ðŸ“„';
  if (type.includes('word') || type.includes('document')) return 'ðŸ“';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'ðŸ“Š';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'ðŸ“½ï¸';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'ðŸ“¦';
  if (type.includes('video')) return 'ðŸŽ¬';
  if (type.includes('audio')) return 'ðŸŽµ';
  if (type.includes('text')) return 'ðŸ“ƒ';
  return 'ðŸ“';
}

function getFileTypeBadgeColor(type: string): string {
  if (type.startsWith('image/')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (type.includes('pdf')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (type.includes('word') || type.includes('document')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (type.includes('sheet') || type.includes('excel')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
}

export default function DocumentPicker({
  onSelect,
  onClose,
  isOpen,
  maxSelection = 10,
  accept,
  mode = 'multiple',
}: DocumentPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>('upload');
  const [selectedDocs, setSelectedDocs] = useState<SelectedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<SelectedDocument[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDocs([]);
      setSearchQuery('');
      setUploadedFiles([]);
      setActiveTab('upload');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'upload' && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [isOpen, activeTab]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const toggleSelection = useCallback((doc: SelectedDocument) => {
    setSelectedDocs(prev => {
      const exists = prev.find(d => d.id === doc.id && d.source === doc.source);
      if (exists) {
        return prev.filter(d => !(d.id === doc.id && d.source === doc.source));
      }
      if (mode === 'single') return [doc];
      if (prev.length >= maxSelection) return prev;
      return [...prev, doc];
    });
  }, [mode, maxSelection]);

  const isSelected = useCallback((doc: SelectedDocument) => {
    return selectedDocs.some(d => d.id === doc.id && d.source === doc.source);
  }, [selectedDocs]);

  const handleFileDrop = useCallback((files: FileList | null) => {
    if (!files) return;
    const newDocs: SelectedDocument[] = Array.from(files).map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      source: 'upload' as const,
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploadedFiles(prev => [...prev, ...newDocs]);
    if (mode === 'single' && newDocs.length > 0) {
      setSelectedDocs([newDocs[0]]);
    } else {
      setSelectedDocs(prev => {
        const combined = [...prev, ...newDocs];
        return combined.slice(0, maxSelection);
      });
    }
  }, [mode, maxSelection]);

  const handleBrowseClick = () => fileInputRef.current?.click();
  const handleCameraClick = () => cameraInputRef.current?.click();

  const filteredVaultDocs = useMemo(() =>
    MOCK_VAULT_DOCS.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredRecentDocs = useMemo(() =>
    MOCK_RECENT_DOCS.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredGalleryItems = useMemo(() =>
    MOCK_GALLERY_ITEMS.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredUploadedDocs = useMemo(() =>
    uploadedFiles.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [uploadedFiles, searchQuery]);

  const tabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileDrop(e.dataTransfer.files); }}
              onClick={handleBrowseClick}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${
                isDragOver
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                isDragOver ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <Upload className={`h-7 w-7 transition-colors ${isDragOver ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                or click to browse your device
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={e => { e.stopPropagation(); handleBrowseClick(); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <FolderOpen className="h-4 w-4" />
                  Browse Files
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleCameraClick(); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </button>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                Supports PDF, DOCX, XLSX, PNG, JPG, and more
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple={mode === 'multiple'}
              accept={accept?.join(',')}
              className="hidden"
              onChange={e => handleFileDrop(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handleFileDrop(e.target.files)}
            />

            {/* Uploaded Files Grid */}
            {filteredUploadedDocs.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Uploaded Files ({filteredUploadedDocs.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUploadedDocs.map(doc => (
                    <DocumentCard key={doc.id} doc={doc} selected={isSelected(doc)} onToggle={() => toggleSelection(doc)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'vault':
        return (
          <div>
            {filteredVaultDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No documents in vault</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Upload files to add them to your vault</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredVaultDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} selected={isSelected(doc)} onToggle={() => toggleSelection(doc)} />
                ))}
              </div>
            )}
          </div>
        );

      case 'recent':
        return (
          <div>
            {filteredRecentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No recent documents</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Documents you use often will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredRecentDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} selected={isSelected(doc)} onToggle={() => toggleSelection(doc)} />
                ))}
              </div>
            )}
          </div>
        );

      case 'cloud':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLOUD_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-600"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${provider.color} text-xl text-white shadow-md`}>
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{provider.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {provider.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    provider.connected
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400'
                  }`}>
                    {provider.connected ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Connect
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <Cloud className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Cloud Integration</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Connect your cloud storage to directly access and attach documents from your preferred provider.
                    All connections are secured with OAuth 2.0.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div>
            {filteredGalleryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No images available</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Upload images to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredGalleryItems.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} selected={isSelected(doc)} onToggle={() => toggleSelection(doc)} isImage />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Documents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'single' ? 'Choose a document' : `Select up to ${maxSelection} documents`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  title={viewMode === 'grid' ? 'List view' : 'Grid view'}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex overflow-x-auto scrollbar-hide px-6">
                {TAB_CONFIG.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                      className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="doc-picker-tab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar */}
            {activeTab !== 'upload' && activeTab !== 'cloud' && (
              <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab === 'vault' ? 'vault documents' : activeTab === 'gallery' ? 'images' : 'recent files'}...`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {tabContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {selectedDocs.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    {selectedDocs.length} selected
                  </span>
                )}
                {maxSelection > 1 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {selectedDocs.length}/{maxSelection} max
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onSelect(selectedDocs); onClose(); }}
                  disabled={selectedDocs.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Check className="h-4 w-4" />
                  {selectedDocs.length > 0 ? `Add Selected (${selectedDocs.length})` : 'Add Selected'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DocumentCard({
  doc,
  selected,
  onToggle,
  isImage = false,
}: {
  doc: SelectedDocument;
  selected: boolean;
  onToggle: () => void;
  isImage?: boolean;
}) {
  const ext = getFileExtension(doc.name);

  return (
    <button
      onClick={onToggle}
      className={`group relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10 dark:border-emerald-400 dark:bg-emerald-900/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
      }`}
    >
      {/* Selection indicator */}
      <div className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-500 text-white scale-100'
          : 'border-slate-300 bg-white/80 text-transparent opacity-0 group-hover:opacity-100 dark:border-slate-600 dark:bg-slate-900/80'
      }`}>
        <Check className="h-3.5 w-3.5" />
      </div>

      {/* Thumbnail */}
      <div className={`flex h-28 items-center justify-center ${
        isImage ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50'
      }`}>
        {doc.thumbnail || isImage ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
            <ImageIcon className="h-10 w-10 text-emerald-400 dark:text-emerald-500" />
          </div>
        ) : (
          <span className="text-3xl">{getFileIcon(doc.type)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">{doc.name}</p>
        <div className="flex items-center gap-2">
          {ext && (
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getFileTypeBadgeColor(doc.type)}`}>
              {ext}
            </span>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatFileSize(doc.size)}</span>
        </div>
      </div>
    </button>
  );
}
