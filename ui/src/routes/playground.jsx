import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Allotment } from "allotment";
import { FaArrowDownLong } from "react-icons/fa6";
import SyncLoader from "react-spinners/SyncLoader";
import CodeEditor from '@/components/code-editor';
import avatarImgSrc from '@/assets/avatar.jpeg';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Snail } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SiteHeader } from '@/components/site-header';

const fallbackUserData = {
  name: "shadcn",
  email: "m@example.com",
  avatar: avatarImgSrc,
};

function Playground() {
  const { id } = useParams();
  const chatAreaRef = useRef(null);
  const { user, isSignedIn } = useUser();
  const [chat, setChat] = useState({ messages: [] });
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasScrolledToTop, setHasScrolledToTop] = useState(false);
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [userDetails, setUserDetails] = useState(fallbackUserData);

  useEffect(() => {
    if (isSignedIn && user) {
      setUserDetails({
        name: user.firstName + " " + user.lastName || "Unknown User",
        email: user.primaryEmailAddress?.emailAddress || "No email",
        avatar: user.imageUrl || avatarImgSrc,
      });
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    const fetchChat = async () => {
      if (id) {
        const res = await fetch(`http://localhost:8080/chats/${id}`);
        const data = await res.json();
        setChat(data);
        setCode(data.code);
      }
    };
    fetchChat();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };

  const handleOnScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const offset = 50;
    setHasScrolledToTop(scrollHeight - scrollTop - clientHeight > offset);
  };

  const onSubmit = async () => {
    if (prompt.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        content: prompt,
        type: 'user',
        created_at: new Date().toLocaleTimeString(),
      };

      setChat(prevChat => ({
        ...prevChat,
        messages: [...prevChat.messages, userMessage],
      }));

      setIsLoading(true);

      try {
        const res = await fetch(`http://localhost:8080/chats/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: prompt }),
        });

        const data = await res.json();

        setChat(prevChat => ({
          ...prevChat,
          messages: [...prevChat.messages, data.message],
        }));
        setCode(data.code);
      } catch (error) {
        console.error("Error fetching AI response:", error);
      } finally {
        setIsLoading(false);
        setPrompt('');
      }
    }
  };

  return (
    <Allotment separator className="w-full">
      <Allotment.Pane minSize={400}>
        <div className="flex flex-col h-full">
          <SiteHeader />

          {/* Chat Area */}
          <div
            ref={chatAreaRef}
            onScroll={handleOnScroll}
            className="flex-1 overflow-y-auto min-h-0 scroll-smooth p-4 relative"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              {chat.messages?.map((message, i) => (
                <div key={message.id} className="flex items-start gap-3">
                  {message.type === 'ai' ? (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-white text-black">
                        <Snail className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-6 w-6 rounded-full">
                      <AvatarImage src={userDetails.avatar} alt={userDetails.name} />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="rounded-xl px-4 py-2 bg-background max-w-prose">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {isLoading && i === chat.messages.length - 1 && (
                    <div className="mt-2">
                      <SyncLoader color="#ccc" size={6} />
                    </div>
                  )}
                </div>
              ))}
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
              <Button className="rounded-full size-[40px]" onClick={onSubmit}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </Allotment.Pane>

      <Allotment.Pane minSize={500}>
        <CodeEditor code={code} setCode={setCode} />
      </Allotment.Pane>
    </Allotment>
  );
}

export default Playground;
