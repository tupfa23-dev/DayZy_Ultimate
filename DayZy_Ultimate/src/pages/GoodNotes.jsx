import React, { useState, useRef, useEffect } from 'react';
import { Save, Plus, Undo2, Redo2, Settings, Trash2, Share2, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const db = getFirestore();
const auth = getAuth();

const storageAPI = {
  async get(userId) {
    try {
      const notesRef = collection(db, 'users', userId, 'notes');
      const snapshot = await getDocs(notesRef);
      const notes = [];
      snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
      return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Load error:', error);
      return [];
    }
  },

  async set(userId, notes) {
    try {
      for (const note of notes) {
        const noteRef = doc(db, 'users', userId, 'notes', note.id);
        await setDoc(noteRef, {
          title: note.title,
          pages: note.pages,
          textObjects: note.textObjects,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          shareCode: note.shareCode || null,
        }, { merge: true });
      }
      return { success: true };
    } catch (error) {
      console.error('Save error:', error);
      return { success: false };
    }
  },

  async updateSharedNote(shareCode, updates) {
    try {
      const shareRef = doc(db, 'shares', shareCode);
      await setDoc(shareRef, {
        ...updates,
        code: shareCode
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Update shared error:', error);
      return { success: false };
    }
  },

  async getShared(shareCode) {
    try {
      const shareRef = doc(db, 'shares', shareCode);
      const snapshot = await getDoc(shareRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      console.error('Load shared error:', error);
      return null;
    }
  }
};

const SharedNoteViewer = ({ shareCode, onBack }) => {
  const [sharedNote, setSharedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [textObjects, setTextObjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [mode, setMode] = useState('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [textInput, setTextInput] = useState('');
  const [selectedText, setSelectedText] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(null);
  const [resizingText, setResizingText] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 700, height: 900 });

  const colors = { bg: '#f3f0ff', sidebar: '#ffffff', text: '#5a4a9e', border: '#e9d5ff', hover: '#f3e8ff', input: '#faf5ff', primary: '#8b5cf6' };

  useEffect(() => {
    const checkNote = async () => {
      const shared = await storageAPI.getShared(shareCode);
      if (shared) {
        setSharedNote(shared);
        setPages(shared.pages || [{ imageData: null }]);
        setTextObjects(shared.textObjects || []);
      }
      setLoading(false);
    };
    checkNote();
    const interval = setInterval(checkNote, 2000);
    return () => clearInterval(interval);
  }, [shareCode]);

  useEffect(() => { renderCanvas(); }, [currentPage, pages, textObjects]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const page = pages[currentPage];
    if (page?.imageData) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0); renderText(ctx); };
      img.src = page.imageData;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderText(ctx);
    }
  };

  const renderText = (ctx) => {
    // Don't render text on canvas - use overlay instead
  };

  const notify = (msg) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:20px;right:20px;background:#51cf66;color:white;padding:12px 24px;border-radius:8px;font-weight:600;z-index:9999`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const startDraw = (e) => {
    if (!['draw', 'erase'].includes(mode) || !canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (mode === 'erase') {
      ctx.clearRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    } else if (mode === 'draw') {
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const stopDraw = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current && sharedNote?.code) {
      const imageData = canvasRef.current.toDataURL('image/png');
      const newPages = [...pages];
      newPages[currentPage] = { imageData };
      setPages(newPages);
      await storageAPI.updateSharedNote(sharedNote.code, {
        pages: newPages,
        textObjects: textObjects,
        updatedAt: new Date().toISOString()
      });
      notify('Saved!');
    }
  };

  const addText = async () => {
    if (!textInput.trim()) return;
    const updated = [...textObjects, {
      id: `text_${Date.now()}`,
      text: textInput,
      x: 50,
      y: 50 + (textObjects.length * 30),
      fontSize,
      color,
      bold: false,
      italic: false,
    }];
    setTextObjects(updated);
    setTextInput('');
    if (sharedNote?.code) {
      await storageAPI.updateSharedNote(sharedNote.code, {
        pages: pages,
        textObjects: updated,
        updatedAt: new Date().toISOString()
      });
      notify('Text added!');
    }
  };

  const updateTextObject = (id, updates) => {
    const updated = textObjects.map(t => t.id === id ? { ...t, ...updates } : t);
    setTextObjects(updated);
  };

  const deleteTextObject = async (id) => {
    const updated = textObjects.filter(t => t.id !== id);
    setTextObjects(updated);
    if (sharedNote?.code) {
      await storageAPI.updateSharedNote(sharedNote.code, {
        pages: pages,
        textObjects: updated,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleTextMouseDown = (e, id) => {
    if (mode !== 'text') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedText(id);
    setIsDraggingText({ id, startX: e.clientX, startY: e.clientY });
  };

  const handleResizeStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingText({ id, startX: e.clientX, startY: e.clientY, startSize: textObjects.find(t => t.id === id)?.fontSize || 16 });
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingText && mode === 'text') {
      const obj = textObjects.find(t => t.id === isDraggingText.id);
      if (obj) {
        const deltaX = e.clientX - isDraggingText.startX;
        const deltaY = e.clientY - isDraggingText.startY;
        updateTextObject(obj.id, { x: obj.x + deltaX, y: obj.y + deltaY });
        setIsDraggingText({ ...isDraggingText, startX: e.clientX, startY: e.clientY });
      }
    }
    if (resizingText && mode === 'text') {
      const obj = textObjects.find(t => t.id === resizingText.id);
      if (obj) {
        const deltaX = e.clientX - resizingText.startX;
        const newSize = Math.max(8, Math.min(100, resizingText.startSize + deltaX / 5));
        updateTextObject(obj.id, { fontSize: Math.round(newSize) });
      }
    }
  };

  const stopTextDrag = async () => {
    setIsDraggingText(null);
    setResizingText(null);
    if (sharedNote?.code) {
      await storageAPI.updateSharedNote(sharedNote.code, {
        pages: pages,
        textObjects: textObjects,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const exportPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `${sharedNote.title}_p${currentPage + 1}.png`;
    link.click();
    notify('PNG exported!');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#5a4a9e' }}>⏳ Loading...</div>;
  if (!sharedNote) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#ef4444', flexDirection: 'column', gap: '20px' }}><h2>❌ Note not found</h2><button onClick={onBack} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: '#8b5cf6', color: 'white', cursor: 'pointer' }}>← Back</button></div>;

  return (
    <div style={{ display: 'flex', height: '100vh', background: colors.bg, fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' }}>
      <div style={{ width: '280px', background: colors.sidebar, borderRight: `2px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `2px solid ${colors.border}`, background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>🎨 Shared Note</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>{sharedNote.title}</p>
        </div>
        <button onClick={onBack} style={{ margin: '12px', padding: '8px', border: 'none', borderRadius: '4px', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>← Back</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)', borderBottom: `1px solid ${colors.border}`, padding: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3 style={{ margin: '0', flex: 1, fontSize: '12px', fontWeight: '600', color: colors.text }}>Edit Mode</h3>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '5px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '11px', outline: 'none', cursor: 'pointer', background: colors.input, color: colors.text }}>
            <option value="draw">✏️ Draw</option>
            <option value="erase">🧹 Erase</option>
            <option value="text">📝 Text</option>
          </select>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '30px', height: '30px', border: `1px solid ${colors.primary}`, borderRadius: '4px', cursor: 'pointer' }} />
          <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: '60px' }} />
        </div>

        <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '6px 10px', display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto' }}>
          {pages.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentPage(idx)} style={{ padding: '4px 10px', border: currentPage === idx ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: currentPage === idx ? colors.primary : colors.hover, color: currentPage === idx ? 'white' : colors.text }}>P{idx + 1}</button>
          ))}
        </div>

        <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '6px 10px', display: 'flex', gap: '4px' }}>
          <button onClick={exportPNG} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#f59e0b', color: 'white' }}>📥 PNG</button>
        </div>

        {mode === 'text' && (
          <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '8px 10px', display: 'flex', gap: '6px' }}>
            <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addText()} style={{ flex: 1, padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '12px', outline: 'none', background: colors.input, color: colors.text }} placeholder="Type text..." />
            <button onClick={addText} style={{ padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', background: colors.primary, color: 'white' }}>Add</button>
          </div>
        )}

        <div style={{ flex: 1, background: '#f3f0ff', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', position: 'relative' }} onMouseMove={handleCanvasMouseMove} onMouseUp={stopTextDrag} onMouseLeave={stopTextDrag}>
          <div style={{ position: 'relative', display: 'inline-block', marginTop: '12px' }}>
            <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', cursor: mode === 'draw' ? 'crosshair' : 'text', display: 'block' }} />
            {textObjects.map(obj => (
              <div key={obj.id} onMouseDown={(e) => handleTextMouseDown(e, obj.id)} onClick={() => setSelectedText(obj.id)} style={{ position: 'absolute', left: `${obj.x}px`, top: `${obj.y + 12}px`, fontSize: `${obj.fontSize}px`, color: obj.color, cursor: 'move', userSelect: 'none', padding: '3px 6px', border: selectedText === obj.id ? `2px solid ${colors.primary}` : '1px solid transparent', borderRadius: '3px', background: selectedText === obj.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent', fontWeight: obj.bold ? 'bold' : 'normal', fontStyle: obj.italic ? 'italic' : 'normal', whiteSpace: 'nowrap' }}>
                {obj.text}
                {selectedText === obj.id && mode === 'text' && (
                  <>
                    <div style={{ position: 'absolute', top: '-28px', left: 0, display: 'flex', gap: '2px', fontSize: '9px', background: colors.primary, padding: '3px', borderRadius: '3px' }}>
                      <button onClick={(e) => { e.stopPropagation(); updateTextObject(obj.id, { bold: !obj.bold }); }} style={{ padding: '1px 3px', background: obj.bold ? '#fff' : 'rgba(255,255,255,0.3)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', fontSize: '9px' }}>B</button>
                      <button onClick={(e) => { e.stopPropagation(); updateTextObject(obj.id, { italic: !obj.italic }); }} style={{ padding: '1px 3px', background: obj.italic ? '#fff' : 'rgba(255,255,255,0.3)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontStyle: 'italic', fontSize: '9px' }}>I</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTextObject(obj.id); }} style={{ padding: '1px 3px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>✕</button>
                    </div>
                    <div style={{ position: 'absolute', top: '-12px', right: '-40px', fontSize: '10px', background: colors.primary, color: 'white', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', fontWeight: '600' }}>{obj.fontSize}px</div>
                    <div onMouseDown={(e) => handleResizeStart(e, obj.id)} style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: colors.primary, border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedNotes = ({ user, onLogout }) => {
  const canvasRef = useRef(null);
  const historyRef = useRef({ stack: [], index: -1 });
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [mode, setMode] = useState('draw');
  const [textInput, setTextInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [textObjects, setTextObjects] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [isDraggingText, setIsDraggingText] = useState(null);
  const [resizingText, setResizingText] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 700, height: 900 });
  const [syncStatus, setSyncStatus] = useState('synced');
  const [showSettings, setShowSettings] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const colors = { bg: '#f3f0ff', sidebar: '#ffffff', text: '#5a4a9e', border: '#e9d5ff', hover: '#f3e8ff', input: '#faf5ff', primary: '#8b5cf6' };

  useEffect(() => { loadAllNotes(); }, []);

  useEffect(() => {
    if (!currentNote) return;
    const timer = setInterval(() => autoSaveNote(), 5000);
    return () => clearInterval(timer);
  }, [currentNote, pages, textObjects]);

  useEffect(() => {
    if (!currentNote?.shareCode) return;
    if (isDrawing) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const shared = await storageAPI.getShared(currentNote.shareCode);
        if (shared) {
          const newUpdatedAt = new Date(shared.updatedAt).getTime();
          const currentUpdatedAt = new Date(currentNote.updatedAt).getTime();
          if (newUpdatedAt > currentUpdatedAt + 500) {
            setPages(shared.pages || [{ imageData: null }]);
            setTextObjects(shared.textObjects || []);
            setCurrentNote(prev => ({ ...prev, updatedAt: shared.updatedAt }));
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [currentNote?.shareCode, isDrawing]);

  useEffect(() => { 
    if (!isDrawing) renderCanvas(); 
  }, [currentPage, pages]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Don't clear if there's unsaved drawing
    if (!isDrawing) {
      const page = pages[currentPage];
      if (page?.imageData) {
        const img = new Image();
        img.onload = () => { 
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0); 
          renderText(ctx); 
        };
        img.onerror = () => { 
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          renderText(ctx); 
        };
        img.src = page.imageData;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderText(ctx);
      }
    }
  };

  const renderText = (ctx) => {
    textObjects.forEach(obj => {
      ctx.save();
      ctx.font = `${obj.italic ? 'italic ' : ''}${obj.bold ? 'bold ' : ''}${obj.fontSize}px Arial`;
      ctx.fillStyle = obj.color;
      ctx.fillText(obj.text, obj.x, obj.y);
      ctx.restore();
    });
  };

  const notify = (msg) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:20px;right:20px;background:#51cf66;color:white;padding:12px 24px;border-radius:8px;font-weight:600;z-index:9999`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const loadAllNotes = async () => {
    try {
      const docs = await storageAPI.get(user.uid);
      if (docs && Array.isArray(docs)) {
        setNotes(docs);
        if (docs.length > 0) {
          setCurrentNote(docs[0]);
          setPages(docs[0].pages);
          setTextObjects(docs[0].textObjects);
        }
      }
    } catch (error) {
      console.warn('Load error:', error);
    }
  };

  const autoSaveNote = async () => {
    if (!currentNote) return;
    try {
      setSyncStatus('syncing');
      const updated = { ...currentNote, pages, textObjects, updatedAt: new Date().toISOString() };
      const newNotes = notes.map(n => n.id === updated.id ? updated : n);
      await storageAPI.set(user.uid, newNotes);
      setNotes(newNotes);
      setCurrentNote(updated);
      if (updated.shareCode) {
        await storageAPI.updateSharedNote(updated.shareCode, {
          pages: updated.pages,
          textObjects: updated.textObjects,
          updatedAt: updated.updatedAt
        });
      }
      setSyncStatus('synced');
    } catch (error) {
      setSyncStatus('error');
    }
  };

  const createNote = async () => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: `Note ${notes.length + 1}`,
      pages: [{ imageData: null }],
      textObjects: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.uid,
      shareCode: null,
    };
    const newNotes = [newNote, ...notes];
    await storageAPI.set(user.uid, newNotes);
    setNotes(newNotes);
    setCurrentNote(newNote);
    setPages(newNote.pages);
    setTextObjects([]);
    notify('Note created!');
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete note?')) return;
    try {
      const noteRef = doc(db, 'users', user.uid, 'notes', id);
      await deleteDoc(noteRef);
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      if (currentNote?.id === id) {
        setCurrentNote(newNotes[0] || null);
      }
      notify('Note deleted');
    } catch (error) {
      notify('Delete failed');
    }
  };

  const updateNote = async (id, updates) => {
    const newNotes = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    await storageAPI.set(user.uid, newNotes);
    setNotes(newNotes);
    if (currentNote?.id === id) setCurrentNote(prev => ({ ...prev, ...updates }));
  };

  const startDraw = (e) => {
    if (!['draw', 'erase'].includes(mode) || !canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (mode === 'erase') {
      ctx.clearRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    } else if (mode === 'draw') {
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const stopDraw = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/png');
      const newPages = [...pages];
      newPages[currentPage] = { imageData };
      setPages(newPages);
      addToHistory(newPages, textObjects);
      if (currentNote?.shareCode) {
        try {
          await storageAPI.updateSharedNote(currentNote.shareCode, {
            pages: newPages,
            textObjects: textObjects,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving to shared note:', error);
        }
      }
    }
  };

  const addToHistory = (newPages, newTextObjects) => {
    historyRef.current.stack = historyRef.current.stack.slice(0, historyRef.current.index + 1);
    historyRef.current.stack.push({
      pages: JSON.parse(JSON.stringify(newPages)),
      textObjects: JSON.parse(JSON.stringify(newTextObjects))
    });
    historyRef.current.index = Math.max(0, historyRef.current.stack.length - 1);
  };

  const undo = () => {
    if (historyRef.current.index > 0) {
      historyRef.current.index--;
      const state = historyRef.current.stack[historyRef.current.index];
      setPages(JSON.parse(JSON.stringify(state.pages)));
      setTextObjects(JSON.parse(JSON.stringify(state.textObjects)));
      notify('Undo!');
    }
  };

  const redo = () => {
    if (historyRef.current.index < historyRef.current.stack.length - 1) {
      historyRef.current.index++;
      const state = historyRef.current.stack[historyRef.current.index];
      setPages(JSON.parse(JSON.stringify(state.pages)));
      setTextObjects(JSON.parse(JSON.stringify(state.textObjects)));
      notify('Redo!');
    }
  };

  const canUndo = () => historyRef.current.stack.length > 1 && historyRef.current.index > 0;
  const canRedo = () => historyRef.current.stack.length > 0 && historyRef.current.index < historyRef.current.stack.length - 1;

  const addText = () => {
    if (!textInput.trim()) return;
    const updated = [...textObjects, {
      id: `text_${Date.now()}`,
      text: textInput,
      x: 50,
      y: 50 + (textObjects.length * 30),
      fontSize,
      color,
      bold: false,
      italic: false,
    }];
    setTextObjects(updated);
    addToHistory(pages, updated);
    setTextInput('');
    notify('Text added');
  };

  const updateTextObject = (id, updates) => {
    const updated = textObjects.map(t => t.id === id ? { ...t, ...updates } : t);
    setTextObjects(updated);
  };

  const deleteTextObject = (id) => {
    const updated = textObjects.filter(t => t.id !== id);
    setTextObjects(updated);
  };

  const handleTextMouseDown = (e, id) => {
    if (mode !== 'text') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedText(id);
    setIsDraggingText({ id, startX: e.clientX, startY: e.clientY });
  };

  const handleResizeStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingText({ id, startX: e.clientX, startY: e.clientY, startSize: textObjects.find(t => t.id === id)?.fontSize || 16 });
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingText && mode === 'text') {
      const obj = textObjects.find(t => t.id === isDraggingText.id);
      if (obj) {
        const deltaX = e.clientX - isDraggingText.startX;
        const deltaY = e.clientY - isDraggingText.startY;
        updateTextObject(obj.id, { x: obj.x + deltaX, y: obj.y + deltaY });
        setIsDraggingText({ ...isDraggingText, startX: e.clientX, startY: e.clientY });
      }
    }
    if (resizingText && mode === 'text') {
      const obj = textObjects.find(t => t.id === resizingText.id);
      if (obj) {
        const deltaX = e.clientX - resizingText.startX;
        const newSize = Math.max(8, Math.min(100, resizingText.startSize + deltaX / 5));
        updateTextObject(obj.id, { fontSize: Math.round(newSize) });
      }
    }
  };

  const stopTextDrag = async () => {
    setIsDraggingText(null);
    setResizingText(null);
    if (currentNote?.shareCode) {
      await storageAPI.updateSharedNote(currentNote.shareCode, {
        pages: pages,
        textObjects: textObjects,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const generateShareLink = async () => {
    if (!currentNote) return;
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const shareData = {
      code: shareCode,
      noteId: currentNote.id,
      ownerId: user.uid,
      ownerName: user.email,
      title: currentNote.title,
      pages: currentNote.pages,
      textObjects: currentNote.textObjects,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const shareRef = doc(db, 'shares', shareCode);
      await setDoc(shareRef, shareData);
      const updated = { ...currentNote, shareCode };
      const newNotes = notes.map(n => n.id === updated.id ? updated : n);
      await storageAPI.set(user.uid, newNotes);
      setNotes(newNotes);
      setCurrentNote(updated);
      const link = `${window.location.origin}/notes?share=${shareCode}`;
      setShareLink(link);
      setShowShareModal(true);
      notify('Share link created!');
    } catch (error) {
      notify('Share failed');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    notify('Link copied!');
  };

  const handleLogout = async () => {
    if (window.confirm('Logout?')) {
      try {
        await signOut(auth);
        onLogout();
      } catch (error) {
        notify('Logout failed');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: colors.bg, fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' }}>
      <div style={{ width: '280px', background: colors.sidebar, borderRight: `2px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `2px solid ${colors.border}`, background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>🎨 Notes</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>{user?.email?.split('@')[0] || 'User'}</p>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{syncStatus === 'syncing' ? '⏳ Saving...' : syncStatus === 'synced' ? '✓ Saved' : '✗ Error'}</div>
        </div>
        <button onClick={createNote} style={{ margin: '12px', padding: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus size={14} /> New</button>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {notes.map(note => (
            <div key={note.id} onClick={() => { setCurrentNote(note); setPages(note.pages); setTextObjects(note.textObjects); }} style={{ padding: '10px', background: currentNote?.id === note.id ? colors.primary : colors.hover, borderRadius: '6px', cursor: 'pointer', color: currentNote?.id === note.id ? 'white' : colors.text }}>
              <div style={{ fontWeight: '600', fontSize: '12px' }}>{note.title}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>{note.pages?.length || 1} pages {note.shareCode && '🔗'}</div>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} style={{ margin: '12px', padding: '8px', border: 'none', borderRadius: '4px', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><LogOut size={14} /> Logout</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentNote ? (
          <>
            <div style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)', borderBottom: `1px solid ${colors.border}`, padding: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" value={currentNote.title} onChange={(e) => updateNote(currentNote.id, { title: e.target.value })} style={{ padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '12px', fontWeight: '600', outline: 'none', flex: 1, minWidth: '120px', background: colors.input, color: colors.text }} />
              <button onClick={undo} disabled={!canUndo()} style={{ padding: '5px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: colors.hover, color: colors.text, opacity: canUndo() ? 1 : 0.5 }}><Undo2 size={12} /></button>
              <button onClick={redo} disabled={!canRedo()} style={{ padding: '5px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: colors.hover, color: colors.text, opacity: canRedo() ? 1 : 0.5 }}><Redo2 size={12} /></button>
              <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '5px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '11px', outline: 'none', cursor: 'pointer', background: colors.input, color: colors.text }}>
                <option value="draw">✏️ Draw</option>
                <option value="erase">🧹 Erase</option>
                <option value="text">📝 Text</option>
              </select>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '30px', height: '30px', border: `1px solid ${colors.primary}`, borderRadius: '4px', cursor: 'pointer' }} />
              <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: '60px' }} />
              <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '5px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: colors.hover, color: colors.text }}><Settings size={12} /></button>
            </div>

            {showSettings && (
              <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Font: </label><input type="range" min="10" max="50" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: '80px' }} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>W: </label><input type="number" value={canvasSize.width} onChange={(e) => setCanvasSize({...canvasSize, width: Number(e.target.value)})} style={{ width: '60px', padding: '4px', borderRadius: '3px', border: `1px solid ${colors.border}`, background: colors.input, color: colors.text, fontSize: '11px' }} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>H: </label><input type="number" value={canvasSize.height} onChange={(e) => setCanvasSize({...canvasSize, height: Number(e.target.value)})} style={{ width: '60px', padding: '4px', borderRadius: '3px', border: `1px solid ${colors.border}`, background: colors.input, color: colors.text, fontSize: '11px' }} /></div>
              </div>
            )}

            <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '6px 10px', display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto' }}>
              {pages.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentPage(idx)} style={{ padding: '4px 10px', border: currentPage === idx ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: currentPage === idx ? colors.primary : colors.hover, color: currentPage === idx ? 'white' : colors.text }}>P{idx + 1}</button>
              ))}
              <button onClick={() => { setPages([...pages, { imageData: null }]); setCurrentPage(pages.length); }} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#10b981', color: 'white' }}><Plus size={11} /></button>
            </div>

            <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '6px 10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button onClick={() => autoSaveNote()} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#10b981', color: 'white' }}><Save size={11} /></button>
              <button onClick={() => { const link = document.createElement('a'); link.href = canvasRef.current.toDataURL('image/png'); link.download = `${currentNote.title}_p${currentPage + 1}.png`; link.click(); notify('PNG exported!'); }} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#f59e0b', color: 'white' }}>📥 PNG</button>
              <button onClick={generateShareLink} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#8b5cf6', color: 'white' }}><Share2 size={11} /></button>
              <button onClick={() => deleteNote(currentNote.id)} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '600', background: '#ef4444', color: 'white' }}><Trash2 size={11} /></button>
            </div>

            {mode === 'text' && (
              <div style={{ background: '#f3e8ff', borderBottom: `1px solid ${colors.border}`, padding: '8px 10px', display: 'flex', gap: '6px' }}>
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addText()} style={{ flex: 1, padding: '6px 10px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '12px', outline: 'none', background: colors.input, color: colors.text }} placeholder="Type text..." />
                <button onClick={addText} style={{ padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', background: colors.primary, color: 'white' }}>Add</button>
              </div>
            )}

            <div style={{ flex: 1, background: '#f3f0ff', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', position: 'relative' }} onMouseMove={handleCanvasMouseMove} onMouseUp={stopTextDrag} onMouseLeave={stopTextDrag}>
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '12px' }}>
                <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', cursor: mode === 'draw' ? 'crosshair' : 'text', display: 'block', position: 'relative', zIndex: 1 }} />
                {textObjects.map(obj => (
                  <div key={obj.id} onMouseDown={(e) => handleTextMouseDown(e, obj.id)} onClick={() => setSelectedText(obj.id)} style={{ position: 'absolute', left: `${obj.x}px`, top: `${obj.y - obj.fontSize}px`, fontSize: `${obj.fontSize}px`, color: obj.color, cursor: mode === 'text' ? 'move' : 'default', userSelect: 'none', padding: '4px 8px', border: selectedText === obj.id ? `2px solid ${colors.primary}` : 'none', borderRadius: '3px', background: selectedText === obj.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent', fontWeight: obj.bold ? 'bold' : 'normal', fontStyle: obj.italic ? 'italic' : 'normal', whiteSpace: 'nowrap', zIndex: 2, lineHeight: '1' }}>
                    {obj.text}
                    {selectedText === obj.id && mode === 'text' && (
                      <>
                        <div style={{ position: 'absolute', top: '-28px', left: 0, display: 'flex', gap: '2px', fontSize: '9px', background: colors.primary, padding: '3px', borderRadius: '3px', zIndex: 10 }}>
                          <button onClick={(e) => { e.stopPropagation(); updateTextObject(obj.id, { bold: !obj.bold }); }} style={{ padding: '1px 3px', background: obj.bold ? '#fff' : 'rgba(255,255,255,0.3)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', fontSize: '9px' }}>B</button>
                          <button onClick={(e) => { e.stopPropagation(); updateTextObject(obj.id, { italic: !obj.italic }); }} style={{ padding: '1px 3px', background: obj.italic ? '#fff' : 'rgba(255,255,255,0.3)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontStyle: 'italic', fontSize: '9px' }}>I</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteTextObject(obj.id); }} style={{ padding: '1px 3px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '9px' }}>✕</button>
                        </div>
                        <div style={{ position: 'absolute', top: '-12px', right: '-40px', fontSize: '10px', background: colors.primary, color: 'white', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', fontWeight: '600', zIndex: 10 }}>{obj.fontSize}px</div>
                        <div onMouseDown={(e) => handleResizeStart(e, obj.id)} style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: colors.primary, border: '2px solid white', borderRadius: '50%', cursor: 'ew-resize', boxShadow: '0 0 4px rgba(0,0,0,0.3)', zIndex: 10 }} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showShareModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: '400px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: colors.text }}>📤 Share Note</h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', fontWeight: '600' }}>Send this link to friends:</p>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', fontSize: '11px', background: colors.input }} />
                    <button onClick={copyShareLink} style={{ padding: '8px 12px', border: 'none', borderRadius: '4px', background: colors.primary, color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Copy</button>
                  </div>
                  <button onClick={() => setShowShareModal(false)} style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '4px', background: '#e5e7eb', color: colors.text, cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Close</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: colors.text }}>
            <h3 style={{ fontSize: '28px', margin: 0 }}>📝</h3>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>No notes yet</p>
            <button onClick={createNote} style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: '#51cf66', color: 'white' }}><Plus size={14} /> Create Note</button>
          </div>
        )}
      </div>
    </div>
  );
};

const GoodNotes = ({ user, onLogout, theme }) => {
  const [shareCode, setShareCode] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkShareCode = () => {
      let code = null;
      const params = new URLSearchParams(window.location.search);
      code = params.get('share');
      if (!code && window.location.hash) {
        code = window.location.hash.substring(1).split('=')[1]?.trim();
      }
      if (code && code !== '' && code !== 'undefined') {
        setShareCode(code);
      } else {
        setShareCode(null);
      }
      setInitialized(true);
    };
    checkShareCode();
    window.addEventListener('popstate', checkShareCode);
    return () => window.removeEventListener('popstate', checkShareCode);
  }, []);

  if (!initialized) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '16px' }}>⏳ Loading...</div>;
  
  if (shareCode && shareCode.length > 0) {
    return <SharedNoteViewer shareCode={shareCode} onBack={() => { setShareCode(null); window.location.hash = ''; }} />;
  }
  
  return <AdvancedNotes user={user} onLogout={onLogout} />;
};

export default GoodNotes;