"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

// ============================================
// TYPES
// ============================================

interface TipTapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
}

// ============================================
// TOOLBAR BUTTON
// ============================================

function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${active
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
                } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-[var(--color-border)] mx-1" />;
}

// ============================================
// EDITOR COMPONENT
// ============================================

export default function TipTapEditor({
    content,
    onChange,
    placeholder = "Začnite písať...",
    editable = true,
}: TipTapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: "text-[var(--color-primary)] underline" },
            }),
            Underline,
        ],
        content,
        editable,
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none min-h-[240px] focus:outline-none px-4 py-3 text-[var(--color-foreground)] text-sm leading-relaxed",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external content changes (e.g. when translations update)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt("URL odkazu:", "https://");
        if (url) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
    };

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${editor.isFocused
            ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
            : "border-[var(--color-border)]"
            }`}>
            {/* Toolbar */}
            {editable && (
                <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-wrap">
                    {/* Headings */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive("heading", { level: 2 })}
                        title="Nadpis (H2)"
                    >
                        H2
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive("heading", { level: 3 })}
                        title="Podnadpis (H3)"
                    >
                        H3
                    </ToolbarButton>

                    <Divider />

                    {/* Text formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive("bold")}
                        title="Tučné"
                    >
                        <span className="font-bold">B</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive("italic")}
                        title="Kurzíva"
                    >
                        <span className="italic">I</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive("underline")}
                        title="Podčiarknuté"
                    >
                        <span className="underline">U</span>
                    </ToolbarButton>

                    <Divider />

                    {/* Lists */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive("bulletList")}
                        title="Odrážky"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive("orderedList")}
                        title="Číslovanie"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003h12m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 11 1.591 0L2.99 15.152h2.25M2.99 18.751h2.25" />
                        </svg>
                    </ToolbarButton>

                    <Divider />

                    {/* Block elements */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive("blockquote")}
                        title="Citácia"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontálna čiara"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" d="M3 12h18" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={addLink}
                        active={editor.isActive("link")}
                        title="Odkaz"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                    </ToolbarButton>

                    {editor.isActive("link") && (
                        <>
                            <Divider />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().unsetLink().run()}
                                title="Odstrániť odkaz"
                            >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </ToolbarButton>
                        </>
                    )}
                </div>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Placeholder overlay */}
            {editor.isEmpty && editable && (
                <div className="px-4 -mt-[240px] pt-3 pointer-events-none text-[var(--color-muted)] text-sm opacity-50">
                    {placeholder}
                </div>
            )}
        </div>
    );
}
