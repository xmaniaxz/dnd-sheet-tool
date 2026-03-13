"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";
import ProfileImageUpload from "@/components/character/ProfileImageUpload";

export default function CharacterPortrait({ className = "" }: { className?: string }) {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleImageChange = useCallback(
    (imageUrl: string) => {
      setByPath("profilePicture", imageUrl);
    },
    [setByPath],
  );

  return (
    <>
      <div className={`relative ${className} group`}>
        <div className="w-full aspect-square absolute inset-0 rounded-full accent-glow glow-full glow-pulse" />
        <div className="relative flex h-full w-full items-center justify-center rounded-full ring-2 ring-(--border) overflow-hidden">
          <Image
            src={data.profilePicture || "/default_character.jpg"}
            alt={data.name || "Character"}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover h-full w-full"
            priority
            unoptimized
          />

          {editMode && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                <span className="text-sm font-medium">Change Image</span>
              </div>
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <ProfileImageUpload
            currentImage={data.profilePicture}
            onImageChange={handleImageChange}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
