"use client";

import { useCallback, useMemo, useState } from "react";
import { useCharacter } from "@/context/CharacterSaveFileContext";
import type { Feat } from "@/context/CharacterSaveFileContext";
import { useEditMode } from "@/context/EditModeContext";

export default function FeatsPanel() {
  const { data, setByPath } = useCharacter();
  const { editMode } = useEditMode();
  const feats = useMemo(() => (data.feats || []) as Feat[], [data.feats]);
  const [collapsedFeats, setCollapsedFeats] = useState<Record<number, boolean>>({});

  const addFeat = useCallback(() => {
    const newFeats = [...feats, { title: "New Feat", lines: [""] }];
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const removeFeat = useCallback((index: number) => {
    const newFeats = feats.filter((_, i) => i !== index);
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const moveFeat = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= feats.length || fromIndex === toIndex) return;

    const newFeats = [...feats];
    const [movedFeat] = newFeats.splice(fromIndex, 1);
    newFeats.splice(toIndex, 0, movedFeat);
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const updateFeatTitle = useCallback((index: number, title: string) => {
    const newFeats = [...feats];
    newFeats[index] = { ...newFeats[index], title };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const updateFeatLine = useCallback((featIndex: number, lineIndex: number, value: string) => {
    const newFeats = [...feats];
    const newLines = [...newFeats[featIndex].lines];
    newLines[lineIndex] = value;
    newFeats[featIndex] = { ...newFeats[featIndex], lines: newLines };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const addFeatLine = useCallback((featIndex: number) => {
    const newFeats = [...feats];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      lines: [...newFeats[featIndex].lines, ""],
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const removeFeatLine = useCallback((featIndex: number, lineIndex: number) => {
    const newFeats = [...feats];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      lines: newFeats[featIndex].lines.filter((_, i) => i !== lineIndex),
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const normalizeLink = useCallback((link: string) => {
    return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  }, []);

  const addFeatSourceLink = useCallback((featIndex: number) => {
    const nextLink = window.prompt("Add source link");
    if (nextLink === null) return;
    const trimmed = nextLink.trim();
    if (!trimmed) return;

    const newFeats = [...feats];
    const currentLinks = newFeats[featIndex].sourceLinks || [];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      sourceLinks: [...currentLinks, trimmed],
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const editFeatSourceLink = useCallback((featIndex: number, linkIndex: number) => {
    const currentLinks = feats[featIndex].sourceLinks || [];
    const current = currentLinks[linkIndex] || "";
    const nextLink = window.prompt("Edit source link", current);
    if (nextLink === null) return;

    const trimmed = nextLink.trim();
    const newFeats = [...feats];
    const updatedLinks = [...currentLinks];

    if (trimmed) {
      updatedLinks[linkIndex] = trimmed;
    } else {
      updatedLinks.splice(linkIndex, 1);
    }

    newFeats[featIndex] = {
      ...newFeats[featIndex],
      sourceLinks: updatedLinks,
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const removeFeatSourceLink = useCallback((featIndex: number, linkIndex: number) => {
    const newFeats = [...feats];
    const currentLinks = newFeats[featIndex].sourceLinks || [];
    newFeats[featIndex] = {
      ...newFeats[featIndex],
      sourceLinks: currentLinks.filter((_, i) => i !== linkIndex),
    };
    setByPath("feats", newFeats);
  }, [feats, setByPath]);

  const toggleFeatCollapsed = useCallback((featIndex: number) => {
    setCollapsedFeats((prev) => ({
      ...prev,
      [featIndex]: !prev[featIndex],
    }));
  }, []);

  const collapseAllFeats = useCallback(() => {
    setCollapsedFeats(Object.fromEntries(feats.map((_, index) => [index, true])));
  }, [feats]);

  const expandAllFeats = useCallback(() => {
    setCollapsedFeats({});
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold">Feats</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {feats.length > 0 && (
            <>
              <button
                onClick={collapseAllFeats}
                className="px-2 py-1 rounded-lg text-xs border border-(--border) hover:opacity-80 transition"
              >
                Collapse all
              </button>
              <button
                onClick={expandAllFeats}
                className="px-2 py-1 rounded-lg text-xs border border-(--border) hover:opacity-80 transition"
              >
                Expand all
              </button>
            </>
          )}
          {editMode && (
            <button
              onClick={addFeat}
              className="px-3 py-1 bg-(--accent) text-(--accent-contrast) rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              + Add Feat
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin">
        {feats.length === 0 && !editMode ? (
          <p className="text-sm opacity-60">No feats yet.</p>
        ) : (
          feats.map((feat, featIndex) => {
            const hasSourceLinks = (feat.sourceLinks || []).some((link) => link.trim().length > 0);
            const previewText = feat.lines
              .map((line) => line.trim())
              .filter(Boolean)
              .join(" • ");
            const shouldShowToggle = editMode || hasSourceLinks || feat.lines.length > 1 || previewText.length > 140;
            const isCollapsed = shouldShowToggle ? (collapsedFeats[featIndex] ?? true) : false;

            return (
            <div
              key={featIndex}
              className="rounded-xl border border-zinc-700/90 p-3 sm:p-4 relative"
            >
              {editMode && (
                <div className="absolute top-1 right-1 flex items-center gap-1">
                  <button
                    onClick={() => moveFeat(featIndex, featIndex - 1)}
                    className="text-xs px-1.5 py-0.5 rounded border border-(--border) hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move feat up"
                    disabled={featIndex === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFeat(featIndex, featIndex + 1)}
                    className="text-xs px-1.5 py-0.5 rounded border border-(--border) hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move feat down"
                    disabled={featIndex === feats.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFeat(featIndex)}
                    className="text-red-500 hover:text-red-300 text-sm font-bold px-1"
                    title="Remove feat"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="mb-2 pr-24">
                <div className="min-w-0 flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => updateFeatTitle(featIndex, e.target.value)}
                      className="font-semibold w-full input"
                      placeholder="Feat name"
                    />
                  ) : (
                    <h3 className="font-semibold truncate">{feat.title}</h3>
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <>
                  {editMode ? (
                    <ul className="list-disc text-sm space-y-1 pl-5">
                      {feat.lines.map((line, lineIndex) => (
                        <li key={lineIndex} className="flex items-start gap-2">
                          <>
                            <input
                              type="text"
                              value={line}
                              onChange={(e) => updateFeatLine(featIndex, lineIndex, e.target.value)}
                              className="flex-1 input text-sm"
                              placeholder="Feat description"
                            />
                            {feat.lines.length > 1 && (
                              <button
                                onClick={() => removeFeatLine(featIndex, lineIndex)}
                                className="text-red-400 hover:text-red-300 text-xs"
                                title="Remove line"
                              >
                                ✕
                              </button>
                            )}
                          </>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <FormattedFeatContent lines={feat.lines} />
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(feat.sourceLinks || [])
                      .filter((link) => link.trim().length > 0)
                      .map((link, linkIndex) => (
                        <div key={linkIndex} className="inline-flex items-center gap-1">
                          <a
                            href={normalizeLink(link.trim())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded border border-(--border) hover:opacity-80"
                            title={link.trim()}
                          >
                            🔗
                          </a>
                          {editMode && (
                            <>
                              <button
                                onClick={() => editFeatSourceLink(featIndex, linkIndex)}
                                className="text-[10px] px-1.5 py-0.5 rounded border border-(--border) hover:opacity-80"
                                title="Edit source link"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => removeFeatSourceLink(featIndex, linkIndex)}
                                className="text-[10px] px-1.5 py-0.5 rounded border border-red-400/70 text-red-400 hover:text-red-300"
                                title="Remove source link"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      ))}

                    {editMode && (
                      <button
                        onClick={() => addFeatSourceLink(featIndex)}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-(--border) hover:opacity-80"
                        title="Add source link"
                      >
                        +🔗
                      </button>
                    )}
                  </div>

                  {editMode && (
                    <div className="mt-2">
                      <button
                        onClick={() => addFeatLine(featIndex)}
                        className="text-xs opacity-60 hover:opacity-100 transition"
                      >
                        + Add line
                      </button>
                    </div>
                  )}
                </>
              )}

              {shouldShowToggle && isCollapsed && (
                <div className="pl-8 pr-1">
                  <p
                    className="text-sm opacity-75 whitespace-pre-wrap"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {previewText || "No details yet."}
                  </p>
                </div>
              )}

              {shouldShowToggle && (
                <button
                  onClick={() => toggleFeatCollapsed(featIndex)}
                  className="mt-3 -mb-3 sm:-mb-4 -mx-3 sm:-mx-4 w-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] rounded-b-xl rounded-t-none border-x-0 border-b-0 border-t border-zinc-700/60 px-3 py-2 text-xs opacity-70 transition hover:opacity-100 hover:bg-white/5"
                  title={isCollapsed ? "Expand feat" : "Collapse feat"}
                  aria-label={isCollapsed ? "Expand feat" : "Collapse feat"}
                >
                  {isCollapsed ? "Expand details" : "Collapse details"}
                </button>
              )}
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}

function FormattedFeatContent({ lines }: { lines: string[] }) {
  const sections: Array<
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] }
  > = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      sections.push({ type: "paragraph", text });
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    const items = listBuffer.map((item) => item.trim()).filter(Boolean);
    if (items.length > 0) {
      sections.push({ type: "list", items });
    }
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-•]\s+/.test(line)) {
      flushParagraph();
      listBuffer.push(line.replace(/^[-•]\s+/, ""));
      continue;
    }

    if (listBuffer.length > 0) {
      flushList();
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return (
    <div className="space-y-3 text-sm leading-6">
      {sections.map((section, index) =>
        section.type === "paragraph" ? (
          <p key={`paragraph-${index}`} className="whitespace-pre-wrap opacity-90">
            {section.text}
          </p>
        ) : (
          <ul key={`list-${index}`} className="list-disc space-y-2 pl-5 opacity-90">
            {section.items.map((item, itemIndex) => (
              <li key={`item-${index}-${itemIndex}`} className="pl-1 leading-6">
                {item}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

