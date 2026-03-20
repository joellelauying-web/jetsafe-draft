import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User } from './firebase';
import Header from './components/Header';
import Chat from './components/Chat';
import QRCodeDisplay from './components/QRCodeDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { Shield, Info, Smartphone, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center animate-pulse shadow-xl shadow-emerald-100">
            <Shield className="text-white w-8 h-8" />
          </div>
          <p className="text-stone-500 font-medium animate-pulse">Loading JETSafe AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Chat & Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-12"
          >
            <section id="chat-section">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-emerald-600 w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900">Message Checker</h2>
              </div>
              <ErrorBoundary>
                <Chat user={user} />
              </ErrorBoundary>
            </section>
          </motion.div>

          {/* Right Column: Info & QR */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="text-emerald-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-4">Why JETSafe AI?</h3>
              <ul className="space-y-4">
                {[
                  { icon: Shield, text: "Real-time AI scam detection", color: "text-emerald-600" },
                  { icon: Info, text: "Simple explanations for everyone", color: "text-blue-600" },
                  { icon: Smartphone, text: "Works on any phone or computer", color: "text-amber-600" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                    <span className="text-stone-600 text-sm leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <QRCodeDisplay />

            <div className="bg-stone-900 rounded-3xl p-8 text-white">
              <h3 className="text-lg font-bold mb-4">Need Help?</h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                If you're unsure about a message, don't click any links. Ask a family member or contact your local authorities.
              </p>
              <a 
                href="mailto:joellelauying@gmail.com"
                className="block w-full py-3 bg-white text-stone-900 rounded-2xl font-bold text-sm hover:bg-stone-100 transition-colors text-center"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-600 w-6 h-6" />
            <span className="font-bold text-stone-900">JETSafe AI</span>
          </div>
          <p className="text-stone-500 text-sm">
            © 2026 JETSafe AI. Protecting our community from scams.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-stone-400 hover:text-stone-600 text-sm font-medium">Privacy Policy</a>
            <a href="#" className="text-stone-400 hover:text-stone-600 text-sm font-medium">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
