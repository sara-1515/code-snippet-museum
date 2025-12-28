import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Eye, Code, Sparkles, Award, Clock, Zap, Plus, User, LogOut, LogIn, History } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api';


const highlightCode = (code, lang) => {
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch'];
  const strings = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /\/\/.*/g;
  
  let highlighted = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  highlighted = highlighted.replace(strings, '<span class="text-green-400">$&</span>');
  highlighted = highlighted.replace(comments, '<span class="text-gray-500 italic">$&</span>');
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-purple-400 font-semibold">${keyword}</span>`);
  });
  
  return highlighted;
};

const CodeBlock = ({ code, language, label }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition"></div>
    <div className="relative bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">{language}</span>
      </div>
      <pre className="text-sm overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  </div>
);

const SnippetCard = ({ snippet, onClick, currentUser }) => {
  const [likes, setLikes] = useState(snippet.likes);
  const [liked, setLiked] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please login to like snippets!');
      return;
    }
    if (!liked) {
      try {
        const response = await axios.post(`${API_URL}/snippets/${snippet.id}/like`, {
          user_id: currentUser.id  // ← THIS WAS ADDED
        });
        setLikes(response.data.likes);
        setLiked(true);
      } catch (error) {
        console.error('Error liking snippet:', error);
        alert(error.response?.data?.error || 'Failed to like snippet');  // ← BETTER ERROR HANDLING
      }
    }
  };


  const categoryColors = {
    'Bug Fix': 'from-red-500 to-orange-500',
    'Elegant': 'from-blue-500 to-cyan-500',
    'Hack': 'from-yellow-500 to-green-500',
    'Optimization': 'from-purple-500 to-pink-500'
  };

  const categoryIcons = { 'Bug Fix': Clock, 'Elegant': Sparkles, 'Hack': Zap, 'Optimization': Award };
  const CategoryIcon = categoryIcons[snippet.category] || Code;

  return (
    <div onClick={onClick} className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${categoryColors[snippet.category]} rounded-xl blur opacity-20 group-hover:opacity-40 transition`}></div>
        <div className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon className="w-5 h-5 text-purple-400" />
                  <span className={`text-xs bg-gradient-to-r ${categoryColors[snippet.category]} bg-clip-text text-transparent font-bold uppercase tracking-wider`}>{snippet.category}</span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition">{snippet.title}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{snippet.story}</p>
          </div>
          <div className="p-4 bg-gray-950/50">
            <pre className="text-xs text-gray-300 overflow-hidden line-clamp-4"><code>{snippet.code}</code></pre>
          </div>
          <div className="p-4 bg-gray-900/50 flex items-center justify-between border-t border-gray-800">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{snippet.views}</span></div>
              <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /><span>{snippet.comments}</span></div>
            </div>
            <button onClick={handleLike} className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${liked ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-semibold">{likes}</span>
            </button>
          </div>
          <div className="px-4 pb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">{snippet.author[0]}</div>
            <span className="text-sm text-gray-400">{snippet.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SnippetModal = ({ snippet, onClose, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [localViews, setLocalViews] = useState(snippet.views);
  const [localComments, setLocalComments] = useState(snippet.comments);

  useEffect(() => {
    if (snippet) {
      // Increment view count
      incrementView();
      // Fetch comments
      fetchComments();
    }
  }, [snippet]);

  const incrementView = async () => {
    try {
      const response = await axios.post(`${API_URL}/snippets/${snippet.id}/view`);
      setLocalViews(response.data.views);
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/snippets/${snippet.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to comment!');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/snippets/${snippet.id}/comments`, {
        user_id: currentUser.id,
        username: currentUser.username,
        comment_text: newComment
      });
      setComments([response.data, ...comments]);
      setLocalComments(localComments + 1);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  if (!snippet) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="relative max-w-5xl w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition z-10">✕</button>
          
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-6 h-6 text-purple-400" />
                <span className="text-sm text-purple-400 font-bold uppercase tracking-wider">{snippet.category}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">{snippet.title}</h2>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">{snippet.author[0]}</div>
                  <span>{snippet.author}</span>
                </div>
                <span>•</span>
                <span>{snippet.date}</span>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />The Story
              </h3>
              <p className="text-gray-300 leading-relaxed">{snippet.story}</p>
            </div>

            {snippet.before_code ? (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <CodeBlock code={snippet.before_code} language={snippet.language} label="Before 😰" />
                <CodeBlock code={snippet.code} language={snippet.language} label="After ✨" />
              </div>
            ) : (
              <div className="mb-6"><CodeBlock code={snippet.code} language={snippet.language} label="The Code" /></div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {snippet.tags && snippet.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">#{tag}</span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-800 mb-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-400">
                  <Heart className="w-5 h-5" /><span>{snippet.likes} likes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="w-5 h-5" /><span>{localViews} views</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MessageSquare className="w-5 h-5" /><span>{localComments} comments</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Comments ({comments.length})</h3>
              
              {/* Add Comment Form */}
              {currentUser ? (
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {currentUser.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
                      />
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                  <p className="text-gray-400">Please login to comment</p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {comment.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{comment.username}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.comment_text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthModal = ({ mode, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        if (!formData.username || !formData.email || !formData.password) {
          alert('Please fill all fields');
          return;
        }
        const response = await axios.post(`${API_URL}/auth/signup`, formData);
        onSuccess(response.data);
      } else {
        if (!formData.email || !formData.password) {
          alert('Please fill all fields');
          return;
        }
        const response = await axios.post(`${API_URL}/auth/login`, formData);
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition">✕</button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4"><User className="w-8 h-8 text-white" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-400">{mode === 'signup' ? 'Join the Code Museum community' : 'Sign in to continue'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" placeholder="johndoe" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition">{mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
};

const AddSnippetModal = ({ onClose, onAdd, currentUser }) => {
  const [formData, setFormData] = useState({ title: '', category: 'Bug Fix', language: 'JavaScript', story: '', code: '', before: '', tags: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.story || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }
    const newSnippet = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean), author: currentUser.username, date: new Date().toISOString().split('T')[0] };
    onAdd(newSnippet);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="relative max-w-4xl w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition z-10">✕</button>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4"><Plus className="w-8 h-8 text-white" /></div>
              <h2 className="text-3xl font-bold text-white mb-2">Share Your Code Story</h2>
              <p className="text-gray-400">Add your legendary snippet to the museum</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition">
                    <option>Bug Fix</option><option>Elegant</option><option>Hack</option><option>Optimization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language *</label>
                  <select value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition">
                    <option>JavaScript</option><option>Python</option><option>Java</option><option>C++</option><option>SQL</option><option>TypeScript</option><option>Go</option><option>Rust</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" placeholder="The Bug That Took 3 Days..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Story *</label>
                <textarea value={formData.story} onChange={(e) => setFormData({...formData, story: e.target.value})} rows="4" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none" placeholder="Tell the story behind this code. What happened? What did you learn?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Before Code (Optional)</label>
                <textarea value={formData.before} onChange={(e) => setFormData({...formData, before: e.target.value})} rows="4" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none font-mono text-sm" placeholder="// The problematic code before the fix..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">After Code *</label>
                <textarea value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} rows="6" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none font-mono text-sm" placeholder="// Your beautiful solution..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" placeholder="debugging, react, performance" />
              </div>
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition text-lg">Add to Museum</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountModal = ({ onClose, currentUser, snippets }) => {
  const userSnippets = snippets.filter(s => s.author === currentUser.username);
  const totalLikes = userSnippets.reduce((sum, s) => sum + s.likes, 0);
  const totalViews = userSnippets.reduce((sum, s) => sum + s.views, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="relative max-w-4xl w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition z-10">✕</button>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 text-4xl font-bold text-white">{currentUser.username[0].toUpperCase()}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{currentUser.username}</h2>
              <p className="text-gray-400">{currentUser.email}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-3xl font-bold text-purple-400 mb-1">{userSnippets.length}</div>
                <div className="text-sm text-gray-400">Snippets</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-3xl font-bold text-pink-400 mb-1">{totalLikes}</div>
                <div className="text-sm text-gray-400">Total Likes</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-3xl font-bold text-cyan-400 mb-1">{totalViews}</div>
                <div className="text-sm text-gray-400">Total Views</div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><History className="w-6 h-6 text-purple-400" />My Snippets</h3>
              {userSnippets.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                  <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">You haven't shared any snippets yet</p>
                  <button
                    onClick={() => 
                      {onClose(); 
                      document.querySelector('[data-add-story-btn]')?.click();
                    }}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Share Your First Story
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userSnippets.map(snippet => (
                    <div key={snippet.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">{snippet.title}</h4>
                          <span className="text-xs text-purple-400 font-semibold">{snippet.category}</span>
                        </div>
                        <span className="text-xs text-gray-500">{snippet.date}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{snippet.story}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Heart className="w-4 h-4" /><span>{snippet.likes}</span></div>
                        <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{snippet.views}</span></div>
                        <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /><span>{snippet.comments}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CodeMuseum() {
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [authModal, setAuthModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/snippets`);
      setSnippets(response.data);
    } catch (error) {
      console.error('Error fetching snippets:', error);
      setSnippets([{id:1,title:"The Null Pointer That Cost 3 Days",category:"Bug Fix",language:"JavaScript",author:"Sarah Chen",date:"2024-11-15",story:"After three sleepless nights debugging a production crash, I finally found it.",before_code:"const userName = user.profile.name;",code:"const userName = user?.profile?.name || 'Anonymous';",likes:234,views:1523,comments:42,tags:["debugging","javascript"]}]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Bug Fix', 'Elegant', 'Hack', 'Optimization'];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesFilter = filter === 'All' || snippet.category === filter;
    const matchesSearch = snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.story.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (snippet.tags && snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const handleAuth = async (userData) => {
    setCurrentUser(userData);
    setAuthModal(null);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    alert(`Welcome ${userData.username}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    alert('Logged out successfully!');
  };

  const handleAddSnippet = async (newSnippet) => {
    if (!currentUser) {  // ← ADDED CHECK
      alert('Please login to add snippets!');
      return;
    }
    try {
      const snippetData = {
        ...newSnippet,
        user_id: currentUser.id  // ← THIS WAS ADDED
      };
      const response = await axios.post(`${API_URL}/snippets`, snippetData);
      setSnippets([response.data, ...snippets]);
      setShowAddModal(false);
      alert('Your snippet has been added to the museum!');
    } catch (error) {
      console.error('Error adding snippet:', error);
      alert(error.response?.data?.error || 'Failed to add snippet. Please try again.');  // ← BETTER ERROR
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"><Plus className="w-5 h-5" />Add Story</button>
                  <button onClick={() => setShowAccountModal(true)} className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">{currentUser.username[0].toUpperCase()}</div>
                    <span className="text-sm text-gray-300">{currentUser.username}</span>
                  </button>
                  <button onClick={handleLogout} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition" title="Logout"><LogOut className="w-5 h-5 text-gray-400" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setAuthModal('login')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"><LogIn className="w-5 h-5" />Sign In</button>
                  <button onClick={() => setAuthModal('signup')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"><User className="w-5 h-5" />Sign Up</button>
                </>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Code className="w-12 h-12 text-purple-400" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Code Snippet Museum</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">A curated gallery of legendary code snippets, battle-tested bugs, and elegant solutions from developers around the world</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="w-full md:w-96">
            <input type="text" placeholder="Search snippets, tags, stories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-lg font-medium transition ${filter === cat ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>{cat}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="col-span-full text-center py-16">
            <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading snippets...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnippets.map(snippet => (
              <SnippetCard key={snippet.id} snippet={snippet} currentUser={currentUser} onClick={() => setSelectedSnippet(snippet)} />
            ))}
          </div>
        )}

        {filteredSnippets.length === 0 && !loading && (
          <div className="text-center py-16">
            <Code className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No snippets found matching your criteria</p>
          </div>
        )}
      </div>

      {selectedSnippet && <SnippetModal snippet={selectedSnippet} currentUser={currentUser} onClose={() => setSelectedSnippet(null)} />}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSuccess={handleAuth} />}
      {showAddModal && <AddSnippetModal currentUser={currentUser} onClose={() => setShowAddModal(false)} onAdd={handleAddSnippet} />}
      {showAccountModal && currentUser && <AccountModal currentUser={currentUser} snippets={snippets} onClose={() => setShowAccountModal(false)} />}
    </div>
  );
}