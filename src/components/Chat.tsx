import { useState, useEffect, useRef } from 'react';
import { Send, Camera, Image as ImageIcon, Volume2, ShieldAlert, ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import { db, auth, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType, User } from '../firebase';
import { analyzeMessage, speakText, AnalysisResult } from '../services/geminiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatMessage {
  id: string;
  uid: string;
  content: string;
  type: 'user' | 'ai';
  analysis?: AnalysisResult;
  createdAt: string;
}

interface ChatProps {
  user: User | null;
}

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forwardedText = params.get('text') || params.get('msg');
    if (forwardedText) {
      setInput(decodeURIComponent(forwardedText));
      // Clear the URL params without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const path = `users/${user.uid}/chats`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      if (msgs.length === 0) {
        setMessages([{
          id: 'welcome',
          uid: 'system',
          content: `Hello! I am your **JETSafe Assistant**. I am here to help you check if a message or email is a scam. 

**Disclaimer:** JETSafe results are for reference only and may not be 100% accurate. Always double-check with official sources.

How can I help you today? You can paste a message or upload a picture.`,
          type: 'ai',
          createdAt: new Date().toISOString()
        }]);
      } else {
        setMessages(msgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || !user || isAnalyzing) return;

    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsAnalyzing(true);
    setError(null);

    const path = `users/${user.uid}/chats`;
    const userMsg = {
      uid: user.uid,
      content: currentInput || "Image analysis request",
      type: 'user' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, path), userMsg);
      
      const result = await analyzeMessage(currentInput, currentImage || undefined);
      
      const aiMsg = {
        uid: user.uid,
        content: result.reasoning,
        type: 'ai' as const,
        analysis: result,
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, path), aiMsg);
      
      // Auto-speak the result for elderly users
      handleSpeak(result.reasoning);

    } catch (error: any) {
      console.error("Analysis Error:", error);
      const errorMessage = error?.message || "Something went wrong while analyzing the message.";
      setError(errorMessage);
      
      // If it's a Firestore error, we still want to log it properly
      if (error?.code || error?.message?.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeak = async (text: string) => {
    try {
      const audioBase64 = await speakText(text);
      if (audioBase64) {
        // Use audio/mpeg which is widely supported
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
        
        // Handle potential play() rejection (e.g., autoplay blocked)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Audio playback was blocked or failed:", error);
          });
        }
      }
    } catch (error) {
      console.error("Speech Error:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
          <ShieldCheck className="text-emerald-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-stone-900 mb-4">Protect Your Messages</h2>
        <p className="text-stone-500 text-lg max-w-md mb-8">
          Sign in to start checking messages for scams. We'll keep your history safe so you can refer back to it anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-8 py-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">JETSafe Assistant</h3>
            <p className="text-sm text-stone-500 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              AI Analysis Ready
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-stone-200">
        {messages.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="text-stone-400 w-8 h-8" />
            </div>
            <p className="text-stone-400 text-lg font-medium">Paste a message below to check if it's real.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.type === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "p-6 rounded-[32px] text-lg leading-relaxed shadow-sm",
              msg.type === 'user' 
                ? "bg-stone-900 text-white rounded-tr-none" 
                : "bg-stone-100 text-stone-900 rounded-tl-none"
            )}>
              {msg.analysis && (
                <div className={cn(
                  "flex items-center gap-3 mb-4 p-4 rounded-2xl border-2",
                  msg.analysis.isFake 
                    ? "bg-red-50 border-red-200 text-red-700" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}>
                  {msg.analysis.isFake ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                  <div>
                    <p className="text-2xl font-black uppercase tracking-wider">
                      {msg.analysis.isFake ? "FAKE / SCAM" : "REAL / SAFE"}
                    </p>
                    <p className="text-sm font-bold opacity-80">
                      Risk Score: {msg.analysis.riskScore}%
                    </p>
                  </div>
                </div>
              )}
              <div className="markdown-body">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-3 px-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.type === 'ai' && (
                <button 
                  onClick={() => handleSpeak(msg.content)}
                  className="p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors"
                  title="Listen to AI"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex items-center gap-4 text-stone-400 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">AI is analyzing the message...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 bg-stone-50 border-t border-stone-200">
        {selectedImage && (
          <div className="mb-4 relative inline-block">
            <img src={selectedImage} alt="Selected" className="h-24 w-24 object-cover rounded-2xl border-2 border-emerald-500" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste message here..."
              className="w-full bg-white border-2 border-stone-200 rounded-3xl px-6 py-4 pr-32 text-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all outline-none resize-none min-h-[64px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                title="Upload Image"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                title="Open Camera"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isAnalyzing}
            className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-lg",
              (!input.trim() && !selectedImage) || isAnalyzing
                ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
            )}
          >
            {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
          </button>
        </form>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
          capture="environment"
        />
        <p className="mt-4 text-center text-xs font-medium text-stone-400 max-w-lg mx-auto">
          JETSafe results are for reference only and may not be 100% accurate. Always double-check with official sources.
        </p>
      </div>
    </div>
  );
}
