import { Play, Info, MousePointer2, Send, Copy } from 'lucide-react';

const tutorials = [
  {
    id: 'copy-paste',
    title: 'How to Copy & Paste',
    description: 'Learn how to copy a message from WhatsApp or SMS and paste it here.',
    icon: Copy,
    color: 'bg-blue-50 text-blue-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
  },
  {
    id: 'analyze',
    title: 'How to Check a Message',
    description: 'See how to press the send button and read the AI results.',
    icon: Send,
    color: 'bg-emerald-50 text-emerald-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
  },
  {
    id: 'camera',
    title: 'Using Your Camera',
    description: 'Learn how to take a photo of a message to analyze it.',
    icon: MousePointer2,
    color: 'bg-amber-50 text-amber-600',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Placeholder
  }
];

export default function Tutorials() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
          <Info className="text-white w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Help & Tutorials</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <div key={tutorial.id} className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="aspect-video bg-stone-100 relative flex items-center justify-center">
              <iframe 
                src={tutorial.videoUrl}
                className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                title={tutorial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="text-stone-900 fill-stone-900 w-5 h-5 ml-1" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 ${tutorial.color} rounded-lg flex items-center justify-center`}>
                  <tutorial.icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900">{tutorial.title}</h3>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">
                {tutorial.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
