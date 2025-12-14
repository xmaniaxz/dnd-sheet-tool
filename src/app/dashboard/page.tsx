"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { account, avatars } from "@/lib/appwrite";
import Image from "next/image";
import type { Models } from "appwrite";
import { characterService } from "@/lib/characterService";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ThemePicker from "@/components/ui/ThemePicker";
import Modal from "@/components/modals/Modal";
import PdfImport from "@/components/PdfImport";
import PdfReviewModal, { type CharacterData } from "@/components/modals/PdfReviewModal";
import { parsePdfCharacterSheet } from "@/lib/pdfParser";

type CharacterSummary = {
  $id: string;
  name: string;
  level: number;
  identity: {
    class: string;
    race: string;
  };
  hp: {
    current: number;
    max: number;
  };
  profilePicture?: string;
  $updatedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [openModal, setOpenModal] = useState<{
    isOpen: boolean;
    characterId: string;
    characterName: string;
  }>({
    isOpen: false,
    characterId: "",
    characterName: "",
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    characterId: string;
    characterName: string;
  }>({
    isOpen: false,
    characterId: "",
    characterName: "",
  });
  const [pdfReviewModal, setPdfReviewModal] = useState<{
    isOpen: boolean;
    data: CharacterData;
    filename: string;
  }>({
    isOpen: false,
    data: {},
    filename: "",
  });

  const loadUserAndCharacters = async () => {
    try {
      setLoading(true);

      // Get current user
      const currentUser = await account.get();
      setUser(currentUser);

      // Load characters from Appwrite
      const charactersList = await characterService.list({ limit: 50 });

      // Map to CharacterSummary format
      const summaries: CharacterSummary[] = charactersList.map((char) => ({
        $id: char.$id || char.id || "unknown",
        name: char.name || "Unnamed Character",
        level: char.level || 1,
        identity: {
          class: char.identity?.class || "Unknown",
          race: char.identity?.race || "Unknown",
        },
        hp: {
          current: char.hp?.current ?? 10,
          max: char.hp?.max ?? 10,
        },
        profilePicture: char.profilePicture || undefined,
        $updatedAt: char.$updatedAt || new Date().toISOString(),
      }));

      setCharacters(summaries);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load your data");
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      // Defer to avoid synchronous setState in effect body
      void loadUserAndCharacters();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("./login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleNewCharacter = () => {
    // Clear the current character and navigate to a clean sheet
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("character-document-id");
    }
    router.push("./character?new=true");
  };

  const handlePdfImport = async (file: File) => {
    try {
      // Parse the PDF to extract character data
      const extractedData = await parsePdfCharacterSheet(file);
      
      // Show review modal with extracted data
      setPdfReviewModal({
        isOpen: true,
        data: extractedData,
        filename: file.name,
      });
    } catch (error) {
      console.error('Failed to parse PDF:', error);
      throw error;
    }
  };

  const handleConfirmPdfImport = (data: CharacterData) => {
    // Store the reviewed data in sessionStorage
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem('pending-character-data', JSON.stringify(data));
    }
    
    // Close modal and navigate to character page
    setPdfReviewModal({ isOpen: false, data: {}, filename: "" });
    router.push('./character?import=pdf');
  };

  const handleCancelPdfImport = () => {
    // Close modal without importing
    setPdfReviewModal({ isOpen: false, data: {}, filename: "" });
  };

  const handleOpenCharacter = (characterId: string, characterName: string) => {
    setOpenModal({ isOpen: true, characterId, characterName });
  };

  const confirmOpenCharacter = () => {
    router.push(`./character?id=${openModal.characterId}`);
  };

  const handleDeleteCharacter = (
    characterId: string,
    characterName: string
  ) => {
    setDeleteModal({ isOpen: true, characterId, characterName });
  };

  const confirmDeleteCharacter = async () => {
    try {
      await characterService.delete(deleteModal.characterId);
      setCharacters((chars) =>
        chars.filter((c) => c.$id !== deleteModal.characterId)
      );
    } catch (err) {
      console.error("Failed to delete character:", err);
      // Could add an error modal here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900/20 via-background to-blue-900/20">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-lg opacity-70 animate-pulse">
            Loading your characters...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-900/20 via-background to-orange-900/20">
        <div className="text-center card p-8 rounded-2xl shadow-2xl border-2 border-red-500/30">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-400 text-lg font-semibold mb-4">{error}</p>
          <button
            onClick={loadUserAndCharacters}
            className="px-6 py-3 bg-linear-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium hover:from-red-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-surface">
      {/* Modals */}
      <PdfReviewModal
        isOpen={pdfReviewModal.isOpen}
        onClose={handleCancelPdfImport}
        onConfirm={handleConfirmPdfImport}
        extractedData={pdfReviewModal.data}
        filename={pdfReviewModal.filename}
      />
      
      <Modal
        isOpen={openModal.isOpen}
        onClose={() =>
          setOpenModal({ isOpen: false, characterId: "", characterName: "" })
        }
        onConfirm={confirmOpenCharacter}
        title="Continue Adventure"
        message={`Do you want to open ${
          openModal.characterName || "this character"
        }?`}
        confirmText="Open"
        cancelText="Cancel"
      />

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, characterId: "", characterName: "" })
        }
        onConfirm={confirmDeleteCharacter}
        title="Retire Character"
        message={`Are you sure you want to retire ${
          deleteModal.characterName || "this character"
        }? This action cannot be undone and all character data will be permanently lost.`}
        confirmText="Retire"
        cancelText="Keep"
        danger={true}
      />

      {/* Warm candlelight ambiance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            backgroundColor:
              "color-mix(in oklab, var(--accent) 10%, transparent)",
          }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            backgroundColor:
              "color-mix(in oklab, var(--accent) 10%, transparent)",
            animationDelay: "2s",
          }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - Tavern board style */}
        <div
          className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r backpanel backdrop-blur-sm p-4 lg:p-6 flex flex-col"
          style={{
            borderColor:
              "color-mix(in oklab, var(--accent) 30%, var(--border))",
          }}
        >
          <div className="mb-6 lg:mb-8">
            <h1
              className="text-2xl lg:text-3xl font-bold mb-2 font-serif tracking-wide"
              style={{
                color: "color-mix(in oklab, var(--accent) 95%, var(--text))",
                textShadow:
                  "0 2px 10px color-mix(in oklab, var(--accent) 30%, transparent)",
              }}
            >
              Adventurer&apos;s Hall
            </h1>
            <div
              className="h-1 w-20 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, var(--accent), transparent)",
              }}
            ></div>
          </div>

          {/* Theme Picker */}
          <div className="mb-4 lg:mb-6 ">
            
            <p
              className="text-xs mb-2 font-medium"
              style={{
                color: "color-mix(in oklab, var(--accent) 50%, var(--text))",
              }}
            >
              Theme
            </p>
            <section className="flex flex-col gap-2">
            <div className="self-start">
              <ThemeToggle />
            </div>
            <ThemePicker />
            </section>

            
          </div>

          {/* User Profile Card */}
          <div className="panel rounded-lg p-4 lg:p-5 mb-4 lg:mb-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={avatars.getInitials(user?.name || user?.email || "A").toString()}
                alt={user?.name || user?.email || "User"}
                width={48}
                height={48}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full shadow-lg"
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs lg:text-sm font-medium"
                  style={{
                    color:
                      "color-mix(in oklab, var(--accent) 70%, var(--text))",
                  }}
                >
                  Welcome back
                </p>
                <p
                  className="font-semibold text-sm lg:text-base truncate"
                  style={{
                    color:
                      "color-mix(in oklab, var(--accent) 95%, var(--text))",
                  }}
                >
                  {user?.name || user?.email || "Adventurer"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-3 px-4 py-2 border rounded-lg transition-all text-sm font-medium hover:bg-opacity-30"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--accent) 40%, var(--border))",
                color: "color-mix(in oklab, var(--accent) 80%, var(--text))",
              }}
            >
              Leave Hall
            </button>
          </div>

          {/* Spacer to push Tavern Notice to bottom */}
          <div className="flex-1"></div>

          {/* Divider */}
          <div
            className="h-px w-full mb-4"
            style={{
              background:
                "linear-gradient(to right, transparent, color-mix(in oklab, var(--accent) 40%, var(--border)), transparent)",
            }}
          ></div>

          {/* Tavern Notice - Pinned to bottom */}
          <div
            className="panel-subtle rounded-lg p-4 text-sm leading-relaxed"
            style={{
              color: "color-mix(in oklab, var(--accent) 70%, var(--text))",
            }}
          >
            <p
              className="font-medium mb-2"
              style={{
                color: "color-mix(in oklab, var(--accent) 85%, var(--text))",
              }}
            >
              Tavern Notice
            </p>
            <p className="text-xs lg:text-sm">
              Your characters are kept safe in the guild&apos;s archives.
              Changes save automatically as you work.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header with PDF Import */}
            <div className="mb-6 lg:mb-8 flex items-center justify-between">
              <div>
                <h2
                  className="text-xl lg:text-2xl font-bold font-serif"
                  style={{
                    color: "color-mix(in oklab, var(--accent) 95%, var(--text))",
                  }}
                >
                  Your Party
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{
                    color: "color-mix(in oklab, var(--accent) 70%, var(--text))",
                  }}
                >
                  Import a character sheet or create a new one
                </p>
              </div>
              <PdfImport onImport={handlePdfImport} />
            </div>

            {/* Characters Grid with Create New as a card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Create New Character Card */}
              <button
                onClick={handleNewCharacter}
                className="border-2 border-dashed rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] group backdrop-blur-sm panel-subtle min-h-[350px] sm:min-h-[400px] flex flex-col items-center justify-center"
                style={{
                  borderColor:
                    "color-mix(in oklab, var(--accent) 40%, var(--border))",
                }}
              >
                <div className="relative mb-4">
                  <div
                    className="absolute inset-0 rounded-full blur-xl group-hover:blur-2xl transition-all"
                    style={{
                      backgroundColor:
                        "color-mix(in oklab, var(--accent) 20%, transparent)",
                    }}
                  ></div>
                  <svg
                    className="relative w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-all"
                    style={{
                      color:
                        "color-mix(in oklab, var(--accent) 60%, var(--text))",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span
                  className="text-lg sm:text-xl font-bold font-serif"
                  style={{
                    color:
                      "color-mix(in oklab, var(--accent) 95%, var(--text))",
                  }}
                >
                  Create New Character
                </span>
                <p
                  className="text-xs sm:text-sm mt-2"
                  style={{
                    color:
                      "color-mix(in oklab, var(--accent) 60%, var(--text))",
                  }}
                >
                  Start a new adventure
                </p>
              </button>

              {/* Existing Characters */}
              {characters.map((character, index) => (
                <div
                  key={character.$id || `character-${index}`}
                  onClick={() =>
                    handleOpenCharacter(character.$id, character.name)
                  }
                  className="border rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] group backdrop-blur-sm animate-fade-in panel cursor-pointer"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    borderColor:
                      "color-mix(in oklab, var(--accent) 30%, var(--border))",
                  }}
                >
                  {/* Character Portrait */}
                  <div
                    className="relative h-48 sm:h-56 overflow-hidden"
                    style={{
                      background:
                        "color-mix(in oklab, var(--accent) 20%, var(--panel))",
                    }}
                  >
                    {character.profilePicture ? (
                      <>
                        <Image
                          src={character.profilePicture}
                          alt={character.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, color-mix(in oklab, var(--panel) 90%, transparent), color-mix(in oklab, var(--panel) 30%, transparent), transparent)",
                          }}
                        ></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "color-mix(in oklab, var(--accent) 20%, var(--panel))",
                          }}
                        ></div>
                        <svg
                          className="relative w-24 h-24 group-hover:scale-110 transition-transform"
                          style={{
                            color:
                              "color-mix(in oklab, var(--accent) 30%, var(--text))",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Level Badge */}
                    <div
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-1 sm:px-3 sm:py-1 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold shadow-lg border"
                      style={{
                        background: `linear-gradient(to right, var(--accent), color-mix(in oklab, var(--accent) 80%, #f60))`,
                        borderColor:
                          "color-mix(in oklab, var(--accent) 30%, #fff)",
                      }}
                    >
                      Lv. {character.level}
                    </div>

                    {/* Class badge */}
                    <div
                      className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-2 py-1 sm:px-3 sm:py-1 backdrop-blur-sm rounded-lg text-xs font-semibold border"
                      style={{
                        backgroundColor:
                          "color-mix(in oklab, var(--panel) 80%, #000)",
                        borderColor:
                          "color-mix(in oklab, var(--accent) 30%, var(--border))",
                        color:
                          "color-mix(in oklab, var(--accent) 90%, var(--text))",
                      }}
                    >
                      {character.identity.class}
                    </div>
                  </div>

                  {/* Character Info */}
                  <div className="p-4 sm:p-5">
                    <h3
                      className="text-lg sm:text-xl font-bold mb-1 truncate font-serif"
                      style={{
                        color:
                          "color-mix(in oklab, var(--accent) 95%, var(--text))",
                      }}
                    >
                      {character.name}
                    </h3>
                    <p
                      className="text-xs sm:text-sm mb-3 sm:mb-4 font-medium"
                      style={{
                        color:
                          "color-mix(in oklab, var(--accent) 70%, var(--text))",
                      }}
                    >
                      {character.identity.race}
                    </p>

                    {/* HP Bar */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              "color-mix(in oklab, var(--accent) 70%, var(--text))",
                          }}
                        >
                          Health
                        </span>
                        <span
                          className="font-bold"
                          style={{
                            color:
                              "color-mix(in oklab, var(--accent) 85%, var(--text))",
                          }}
                        >
                          {character.hp.current ?? 10}/{character.hp.max ?? 10}
                        </span>
                      </div>
                      <div
                        className="h-2.5 rounded-full overflow-hidden border"
                        style={{
                          backgroundColor:
                            "color-mix(in oklab, var(--panel) 80%, #000)",
                          borderColor:
                            "color-mix(in oklab, var(--accent) 20%, var(--border))",
                        }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            background: `linear-gradient(to right, #dc2626, var(--accent))`,
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((character.hp.current ?? 10) /
                                  (character.hp.max ?? 10)) *
                                  100
                              )
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center justify-between">
                      <p
                        className="text-xs"
                        style={{
                          color:
                            "color-mix(in oklab, var(--accent) 40%, var(--text))",
                        }}
                      >
                        Last seen{" "}
                        {new Date(character.$updatedAt).toLocaleDateString()}
                      </p>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCharacter(character.$id, character.name);
                        }}
                        className="p-2 rounded-lg transition-all hover:bg-red-950/50 border-2 flex items-center justify-center backdrop-blur-sm"
                        style={{
                          borderColor: "#dc2626",
                          backgroundColor:
                            "color-mix(in oklab, var(--panel) 40%, transparent)",
                        }}
                        title="Retire character"
                        aria-label="Retire character"
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
