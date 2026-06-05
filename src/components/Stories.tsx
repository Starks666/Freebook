import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, useTransform } from 'motion/react';
import { Plus, X, Upload } from 'lucide-react';
import { Story, User } from '../types';

interface StoriesProps {
  currentUser: User;
  token: string;
}

export default function Stories({ currentUser, token }: StoriesProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl })
      });
      if (response.ok) {
        setImageUrl('');
        setShowUploader(false);
        fetchStories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setShowUploader(true)}>
        <div className="w-16 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
             <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover"/>
             <div className="absolute bottom-1 bg-white dark:bg-gray-800 rounded-full p-1"><Plus className="w-4 h-4 text-blue-600" /></div>
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Create</span>
      </div>

      {stories.map(story => (
        <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setViewingStoryId(story.id)}>
          <div className="w-16 h-24 rounded-xl overflow-hidden border-2 border-blue-500">
            {story.imageUrl.startsWith('data:video/') ? (
                <video src={story.imageUrl} className="w-full h-full object-cover" muted />
            ) : (
                <img src={story.imageUrl} alt={story.author.username} className="w-full h-full object-cover"/>
            )}
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-16 text-center">{story.author.displayName.split(' ')[0]}</span>
        </div>
      ))}

      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateStory} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Create Story</h3>
              <button type="button" onClick={() => setShowUploader(false)}><X/></button>
            </div>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-full">
              <Upload className="text-gray-400" />
              <span className="text-xs text-gray-500">Click to upload image or video</span>
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {imageUrl && (
                imageUrl.startsWith('data:video/') 
                    ? <video src={imageUrl} className="max-h-32 mx-auto" />
                    : <img src={imageUrl} className="max-h-32 mx-auto" alt="Preview"/>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Post Story</button>
          </form>
        </div>
      )}

      {viewingStoryId && (
        <StoryViewer 
          stories={stories} 
          initialStoryId={viewingStoryId} 
          onClose={() => setViewingStoryId(null)} 
        />
      )}
    </div>
  );
}

function StoryViewer({ stories, initialStoryId, onClose }: { stories: Story[], initialStoryId: string, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(stories.findIndex(s => s.id === initialStoryId));
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v}%`);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
        progress.set(0);
      } else {
        onClose();
      }
    }, 5000);

    // Reset progress animation
    progress.set(0);
    const animation = animate(progress, 100, { duration: 5, ease: 'linear' });

    return () => {
      clearInterval(timer);
      animation.stop();
    };
  }, [currentIndex, stories.length, onClose]);

  const story = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-0">
      <div className="w-full h-full relative">
        <div className="absolute top-0 left-0 right-0 p-2 z-10">
          <div className="h-1 bg-gray-500 rounded-full w-full overflow-hidden">
             <motion.div 
              style={{ width }}
              className="h-1 bg-white"
            />
          </div>
        </div>
        {story.imageUrl.startsWith('data:video/') ? (
          <video src={story.imageUrl} className="w-full h-full object-contain" autoPlay muted />
        ) : (
          <img src={story.imageUrl} className="w-full h-full object-contain" alt="Story" />
        )}
        <button className="absolute top-4 right-4 text-white" onClick={onClose}><X /></button>
        <div className="absolute bottom-4 left-4 text-white font-bold">{story.author.displayName}</div>
      </div>
    </div>
  );
}
