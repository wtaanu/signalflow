import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Eye, EyeOff, Copy, CheckCircle2, Download, Terminal, Puzzle } from "lucide-react";

export default function Settings() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // In a real app, you would fetch this from a protected endpoint.
  // For the prompt requirements, we display a mock representation of the generated key
  // from the backend secrets configuration.
  const apiKey = "sf_eb1e5db0a125d315edbf8dca1ce46a2ea2e3c651e633eeac6086704acd8132a1";
  
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div>
        <h1 className="text-4xl font-display font-bold text-gradient pb-1">Settings</h1>
        <p className="text-zinc-400 mt-2 text-lg">Manage your API keys and extension configuration.</p>
      </div>

      <div className="grid gap-6">
        
        {/* API Key Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-white">Secret API Key</h2>
              <p className="text-zinc-400 text-sm">Used to authenticate the Chrome Extension with your dashboard.</p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-2 pl-4 flex items-center justify-between group">
            <div className="font-mono text-sm tracking-wider text-zinc-300 overflow-hidden text-ellipsis mr-4">
              {showKey ? apiKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title={showKey ? "Hide key" : "Reveal key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2 text-sm text-amber-400/80 bg-amber-400/10 p-4 rounded-xl border border-amber-400/20">
            <Terminal className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Keep this key safe. Do not share it or commit it to version control. It provides full access to save leads to your CRM.</p>
          </div>
        </motion.div>

        {/* Extension Setup Guide */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-white">Extension Setup</h2>
              <p className="text-zinc-400 text-sm">How to install and connect the SignalFlow Chrome Extension.</p>
            </div>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            
            {[
              { 
                step: 1, 
                title: "Download the Extension", 
                desc: "Get the latest version of the SignalFlow extension from the repository.",
                icon: Download
              },
              { 
                step: 2, 
                title: "Load Unpacked in Chrome", 
                desc: "Go to chrome://extensions, enable 'Developer mode', and click 'Load unpacked'. Select the extension folder.",
                icon: Terminal
              },
              { 
                step: 3, 
                title: "Configure API Key", 
                desc: "Click the extension icon in your browser toolbar, open options, and paste your Secret API Key from above.",
                icon: Key
              }
            ].map((item, i) => (
              <div key={item.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-zinc-400 group-hover:text-primary group-hover:border-primary transition-colors">
                  {item.step}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl glass-panel group-hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-white text-lg">{item.title}</h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}

          </div>
        </motion.div>

      </div>
    </div>
  );
}
