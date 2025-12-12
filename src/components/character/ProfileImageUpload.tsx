"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storage } from "@/lib/appwrite";
import { ID } from "appwrite";

interface ProfileImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string) => void;
  onClose: () => void;
}

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_BUCKET_ID || "profile-pictures";

// Simple SVG Icons
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UploadIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LinkIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CheckIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function ProfileImageUpload({
  currentImage,
  onImageChange,
  onClose,
}: ProfileImageUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsLoading(true);
    try {
      // Upload to Appwrite Storage
      const fileId = ID.unique();
      const response = await storage.createFile(BUCKET_ID, fileId, file);
      
      // Get file URL
      const fileUrl = storage.getFileView(BUCKET_ID, response.$id).toString();
      setPreview(fileUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    setIsLoading(true);
    // Test if the URL is valid by loading it
    const img = new Image();
    img.onload = () => {
      setPreview(urlInput);
      setIsLoading(false);
    };
    img.onerror = () => {
      alert("Failed to load image from URL. Please check the URL and try again.");
      setIsLoading(false);
    };
    img.src = urlInput;
  };

  const handleConfirm = () => {
    if (preview) {
      onImageChange(preview);
      onClose();
    }
  };

  const handleRemove = () => {
    onImageChange("");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-md rounded-2xl panel border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Change Profile Picture</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "upload"
                ? "accent-soft"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <UploadIcon size={16} className="inline mr-2" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "url"
                ? "accent-soft"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <LinkIcon size={16} className="inline mr-2" />
            URL
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full p-8 border-2 border-dashed rounded-xl hover:border-(--accent) transition-colors flex flex-col items-center gap-2"
                >
                  <UploadIcon size={32} />
                  <span className="text-sm font-medium">
                    {isLoading ? "Loading..." : "Click to upload image"}
                  </span>
                  <span className="text-xs opacity-50">Max size: 5MB</span>
                </button>
              </motion.div>
            )}

            {activeTab === "url" && (
              <motion.div
                key="url"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-(--accent)"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={isLoading || !urlInput.trim()}
                  className="w-full px-4 py-2 rounded-lg accent-soft font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load Image"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          {preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden border-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          {currentImage && (
            <button
              onClick={handleRemove}
              className="px-4 py-2 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 font-medium transition-colors"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!preview}
            className="flex-1 px-4 py-2 rounded-lg accent-soft font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckIcon size={16} />
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
