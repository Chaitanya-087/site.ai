import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Code, Rows2 } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';
import { Separator } from './ui/separator';

function RenderEditor({ language, code, onChange, theme }) {
    const monaco = useMonaco();

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme("monokai-black", {
                base: "vs-dark",
                inherit: true,
                rules: [
                    { token: "comment", foreground: "75715E" },
                    { token: "string", foreground: "E6DB74" },
                    { token: "keyword", foreground: "F92672" },
                    { token: "number", foreground: "AE81FF" },
                    { token: "type.identifier", foreground: "A6E22E" },
                ],
                colors: {
                    "editor.background": "#000000",
                    "editor.foreground": "#F8F8F2",
                    "editor.lineHighlightBackground": "#272822",
                    "editorCursor.foreground": "#F8F8F0",
                    "editorWhitespace.foreground": "#3E3D32",
                },
            });
            monaco.editor.setTheme("monokai-black");
        }
    }, [monaco]);

    return (
        <Editor
            height="100%"
            width="100%"
            language={language}
            value={code}
            theme={theme === 'dark' ? "monokai-black" : 'light'}
            onChange={onChange(language)}
            options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
            }}
        />
    );
}
RenderEditor.propTypes = {
    language: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    theme: PropTypes.string.isRequired,
};

function CodeEditor({ code, setCode }) {
    const [srcDoc, setSrcDoc] = useState('');
    const { theme } = useTheme();

    const tabs = {
        'index.html': {
            name: 'index.html',
            language: 'html',
            editor: () => (
                <RenderEditor
                    language="html"
                    code={code.html}
                    onChange={onCodeChange}
                    theme={theme}
                />
            ),
        },
        'styles.css': {
            name: 'styles.css',
            language: 'css',
            editor: () => (
                <RenderEditor
                    language="css"
                    code={code.css}
                    onChange={onCodeChange}
                    theme={theme}
                />
            ),
        },
        'scripts.js': {
            name: 'scripts.js',
            language: 'js',
            editor: () => (
                <RenderEditor
                    language="javascript"
                    code={code.js}
                    onChange={onCodeChange}
                    theme={theme}
                />
            ),
        },
        'preview': {
            name: 'preview',
            language: 'html',
            editor: () => (
                <iframe
                    srcDoc={srcDoc}
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-none bg-white"
                />
            ),
        },
    };

    const keys = Object.keys(tabs);
    const [activeTab, setActiveTab] = useState(keys[0]);

    // Update the iframe output whenever code changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            const htmlContent = `
                <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <base target="_blank" />
                            <script src="https://cdn.tailwindcss.com"></script>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script> 
                            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/light.css" />
                            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/dark.css" />
                            <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/shoelace-autoloader.js"></script>
                            <style>${code.css}</style>
                            <title>Preview</title>
                        </head>
                        <body>
                            ${code.html}
                            <script>
                                ${code.js}
                            </script>
                        </body>
                    </html>
            `;
            setSrcDoc(htmlContent);
        }, 250);

        return () => clearTimeout(timeout);
    }, [code]);

    const onCodeChange = (key) => (value) => {
        setCode((prev) => ({
            ...prev,
            [key]: value || '',
        }));
    };

    return (
        <div className="flex flex-col h-screen w-full">
            {/* Header */}
            <div className="flex items-center h-12 shadow border-b px-2">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                    <Code className="w-6 h-6" />
                </Button>
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />

                <div className="flex justify-between w-full items-center px-1">
                    <div className="flex gap-1 items-center">
                        {keys.filter(key => key !== 'preview').map((key, index) => (
                            <div key={key} className="flex items-center">
                                <button
                                    onClick={() => setActiveTab(key)}
                                    className={`px-3 py-1 rounded-full transition-all duration-200 text-sm
                        ${activeTab === key
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-md"
                                            : "hover:bg-muted text-muted-foreground"
                                        }
                    `}
                                >
                                    {key}
                                </button>
                                {index < keys.length - 2 && (
                                    <Separator
                                        orientation="vertical"
                                        className="h-4 w-px bg-border mx-1"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`p-2 rounded-full transition-all duration-200
            ${activeTab === 'preview'
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500  text-white font-semibold shadow-md"
                                : "hover:bg-muted text-muted-foreground"
                            }
        `}
                    >
                        <Rows2 className="w-4 h-4" />
                    </button>
                </div>


            </div>

            <div className="flex-1 bg-[#1a1a1a]">
                {tabs[activeTab].editor()}
            </div>
        </div>
    );
}

CodeEditor.propTypes = {
    code: PropTypes.shape({
        html: PropTypes.string,
        css: PropTypes.string,
        js: PropTypes.string,
    }).isRequired,
    setCode: PropTypes.func.isRequired,
};

export default CodeEditor;
