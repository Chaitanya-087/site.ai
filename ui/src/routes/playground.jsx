import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Allotment } from "allotment";
import { FaArrowDownLong } from "react-icons/fa6";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useChatStore } from '@/store/chat-store';
import { CodeEditor } from '@/components/code-editor';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function Playground() {
  const { id } = useParams();
  const location = useLocation();
  const chatAreaRef = useRef(null);
  const initRef = useRef(false);
  const [prompt, setPrompt] = useState('');
  const [hasScrolledToTop, setHasScrolledToTop] = useState(false);
  const errorTimestampRef = useRef(null);
  const initialPromptRef = useRef(location.state?.initialPrompt || null);

  const {
    chat,
    postMessage,
    fetchChat,
    isChatThinking,
    error,
    clear,
  } = useChatStore();

  useEffect(() => {
    const init = async () => {
      if (!id) return;

      await fetchChat(id);

      const prompt = initialPromptRef.current;
      if (prompt) {
        await postMessage(id, prompt.trim());
        initialPromptRef.current = null;
      }
    }

    if (initRef.current) {
      init();
    }

    return () => {
      clear();
      initRef.current = true;
    }

  }, [id, clear, postMessage, fetchChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  useEffect(() => {
    if (error && error.message && error.timestamp !== errorTimestampRef.current) {
      toast.error(error.message, {
        action: {
          label: "undo",
        },
      });
      errorTimestampRef.current = error.timestamp;
    }
  }, [error]);

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };

  const handleOnScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current || {};
    const offset = 50;
    if (scrollTop !== undefined && scrollHeight !== undefined && clientHeight !== undefined) {
      setHasScrolledToTop(scrollHeight - scrollTop - clientHeight > offset);
    }
  };

  const onSubmit = () => {
    postMessage(id, prompt.trim());
    setPrompt("");
  };

  return (
    <Allotment separator className="w-full">
      <Allotment.Pane minSize={400} preferredSize={400}>
        <div className="flex flex-col h-full">
          <SiteHeader />

          {/* Chat Area */}
          <div
            ref={chatAreaRef}
            onScroll={handleOnScroll}
            className="flex-1 overflow-y-auto min-h-0 scroll-smooth p-4 relative"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              {chat?.messages?.map((message, index) => {
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className={clsx(
                      "flex w-full gap-2 items-center",
                      message.type === "user" ? "justify-end" : ""
                    )}
                  >
                    <div className={clsx(
                      { "border bg-background": message.type === "user" },
                      "rounded-tl-xl rounded-b-xl rounded-tr-sm px-4 py-2"
                    )}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isChatThinking(id) && (
                <div className="flex w-full gap-2 items-center justify-start">
                  <div className="rounded-tl-xl rounded-b-xl rounded-tr-sm px-4 py-2">
                    <Skeleton className="h-4 w-[250px] mb-2" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              )}
            </div>

            {hasScrolledToTop && (
              <button
                className="absolute left-1/2 transform -translate-x-1/2 -top-10 w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full text-white"
                onClick={scrollToBottom}
              >
                <FaArrowDownLong size={14} />
              </button>
            )}
          </div>

          {/* Input Section */}
          <div className="w-full p-4">
            <div className="max-w-3xl mx-auto flex items-center space-x-2 border rounded-full h-14 px-2">
              <Input
                placeholder="Start typing your idea..."
                className="h-full border-none focus-visible:ring-0 flex-1"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
              <Button className="rounded-full size-[40px]" disabled={isChatThinking(id)} onClick={onSubmit}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </Allotment.Pane>

      <Allotment.Pane minSize={600}>
        <CodeEditor code={chat?.code || ""} setCode={() => { }} />
      </Allotment.Pane>
    </Allotment>
  );
}

export default Playground;
