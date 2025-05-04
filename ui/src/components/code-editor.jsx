import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';

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
                    sandbox="allow-scripts"
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
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Preview</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                    </style>
                    <style>${code.css}</style>
                </head>
                <body>
                    ${code.html}
                    <script>${code.js}</script>
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
            <div className="flex items-center justify-between h-12 shadow border-b px-2">
                <Button variant="ghost" size="icon" className="w-7 h-7">
                    <Code className="w-6 h-5" />
                </Button>

                <div className="flex gap-2">
                    {keys.map((key) => (
                        <Button
                            key={key}
                            variant={activeTab === key ? 'default' : 'ghost'}
                            size="sm"
                            className="capitalize"
                            onClick={() => setActiveTab(key)}
                        >
                            {key}
                        </Button>
                    ))}
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
