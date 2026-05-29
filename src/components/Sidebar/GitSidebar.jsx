import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { GitBranch, GitCommit, ArrowUp, Link, FileText, CheckCircle, Plus, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GithubIcon = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const GitSidebar = () => {
  const {
    files,
    gitOriginalFiles,
    gitCommits,
    gitRepo,
    cloneRepository,
    commitAndPush,
    username
  } = useEditor();

  const [githubUser, setGithubUser] = useState(localStorage.getItem('devsync_github_user') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('devsync_github_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('devsync_github_token'));
  
  const [cloneUrl, setCloneUrl] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  
  // Calculate changed files
  const [changedFiles, setChangedFiles] = useState([]);

  useEffect(() => {
    if (files.length === 0) return;
    
    const changes = [];
    files.forEach(f => {
      if (f.isFolder) return;
      const orig = gitOriginalFiles.find(o => o.id === f.id);
      if (!orig) {
        changes.push({ id: f.id, name: f.name, status: 'added' });
      } else if (orig.content !== f.content) {
        changes.push({ id: f.id, name: f.name, status: 'modified' });
      }
    });
    
    // Find deleted files
    gitOriginalFiles.forEach(orig => {
      if (orig.isFolder) return;
      const exists = files.some(f => f.id === orig.id);
      if (!exists) {
        changes.push({ id: orig.id, name: orig.name, status: 'deleted' });
      }
    });

    setChangedFiles(changes);
  }, [files, gitOriginalFiles]);

  const handleLogin = () => {
    if (githubUser.trim() && githubToken.trim()) {
      localStorage.setItem('devsync_github_user', githubUser.trim());
      localStorage.setItem('devsync_github_token', githubToken.trim());
      setIsAuthenticated(true);
    } else {
      // Mock login for demo ease
      const mockUser = username.split('@')[0] || 'developer';
      const mockToken = 'ghp_' + Math.random().toString(36).substr(2, 15);
      setGithubUser(mockUser);
      setGithubToken(mockToken);
      localStorage.setItem('devsync_github_user', mockUser);
      localStorage.setItem('devsync_github_token', mockToken);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devsync_github_user');
    localStorage.removeItem('devsync_github_token');
    localStorage.removeItem('devsync_git_repo');
    setIsAuthenticated(false);
    setGithubUser('');
    setGithubToken('');
  };

  const handleClone = async () => {
    if (!cloneUrl.trim()) return;
    setIsCloning(true);
    // Simulate web network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    cloneRepository(cloneUrl.trim());
    setIsCloning(false);
    setCloneUrl('');
  };

  const handleCommit = async () => {
    if (!commitMsg.trim() || changedFiles.length === 0) return;
    setIsPushing(true);
    // Simulate push network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    commitAndPush(commitMsg.trim());
    setCommitMsg('');
    setIsPushing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc] overflow-y-auto">
      {/* ─── GITHUB AUTHENTICATION ─── */}
      {!isAuthenticated ? (
        <div className="p-4 space-y-4 border-b border-[#3c3c3c]">
          <div className="flex items-center gap-2 text-white">
            <GithubIcon size={20} className="text-[#a89eff]" />
            <span className="font-semibold text-[13px]">GitHub Connection</span>
          </div>
          <p className="text-[11px] text-[#858585]">
            Link your GitHub account to import repositories and push updates directly from DevSync.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Username"
              value={githubUser}
              onChange={e => setGithubUser(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1.5 rounded text-[12px] text-white"
            />
            <input
              type="password"
              placeholder="Personal Access Token"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1.5 rounded text-[12px] text-white"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-[#007acc] hover:bg-[#005f9e] text-white py-1.5 rounded text-[12px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <GithubIcon size={14} /> Connect Account
          </button>
        </div>
      ) : (
        <div className="p-3 border-b border-[#3c3c3c] bg-[#2d2d2d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={`https://github.com/${githubUser}.png`} 
              alt={githubUser} 
              onError={(e) => { e.target.src = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"; }}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-[12px] text-white font-medium">{githubUser}</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-[10px] text-[#f44336] hover:underline cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* ─── CLONE / ACTIVE REPO ─── */}
      {isAuthenticated && (
        <div className="flex-1 flex flex-col min-h-0">
          {!gitRepo ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Link size={16} className="text-[#a89eff]" />
                <span className="font-semibold text-[13px]">Clone Repository</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  value={cloneUrl}
                  onChange={e => setCloneUrl(e.target.value)}
                  disabled={isCloning}
                  className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] outline-none px-2 py-1.5 rounded text-[12px] text-white"
                />
                <button
                  onClick={handleClone}
                  disabled={isCloning || !cloneUrl.trim()}
                  className="bg-[#007acc] hover:bg-[#005f9e] disabled:bg-[#3c3c3c] disabled:cursor-not-allowed text-white px-3 rounded text-[12px] flex items-center justify-center cursor-pointer transition-colors"
                >
                  {isCloning ? <RefreshCw size={14} className="animate-spin" /> : 'Clone'}
                </button>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] text-[11px] text-[#858585]">
                💡 <b>Try cloning:</b> <code>https://github.com/coder/express-app</code> to simulate importing a workspace.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Repository Title */}
              <div className="px-4 py-2 border-b border-[#3c3c3c] bg-[#1e1e1e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 text-white text-[12px] font-semibold truncate">
                  <GitBranch size={14} className="text-[#a89eff]" />
                  <span className="truncate">{gitRepo.replace('https://github.com/', '')}</span>
                </div>
                <span className="text-[10px] text-[#007acc] bg-[#007acc15] px-1.5 py-0.5 rounded border border-[#007acc30]">
                  origin/main
                </span>
              </div>

              {/* Source Control Changes List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#858585] font-bold mb-2 flex items-center justify-between">
                    <span>Staged & Working Changes</span>
                    <span className="bg-[#3c3c3c] text-white text-[9px] px-1.5 py-0.5 rounded">
                      {changedFiles.length}
                    </span>
                  </div>

                  {changedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-[#858585] gap-2 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
                      <CheckCircle size={20} className="text-[#4caf50]" />
                      <span className="text-[11px]">No changes detected.<br />Working directory is clean.</span>
                    </div>
                  ) : (
                    <div className="space-y-1 bg-[#1e1e1e] p-1.5 rounded border border-[#2d2d2d]">
                      {changedFiles.map(f => (
                        <div key={f.id} className="flex items-center justify-between px-2 py-1 hover:bg-[#2d2d2d] rounded group text-[12px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText size={13} className="text-[#858585] shrink-0" />
                            <span className="truncate text-white">{f.name}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono uppercase shrink-0 ${
                            f.status === 'modified' ? 'text-[#e2c08d] bg-[#e2c08d12]' :
                            f.status === 'added' ? 'text-[#73c991] bg-[#73c99112]' :
                            'text-[#f44336] bg-[#f4433612]'
                          }`}>
                            {f.status === 'modified' ? 'M' : f.status === 'added' ? 'A' : 'D'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Commit Message Box */}
                {changedFiles.length > 0 && (
                  <div className="space-y-2 bg-[#2d2d2d] p-3 rounded-lg border border-[#3c3c3c] shadow-md">
                    <textarea
                      placeholder="Commit message (e.g. Add validation controls)"
                      value={commitMsg}
                      onChange={e => setCommitMsg(e.target.value)}
                      disabled={isPushing}
                      rows={2}
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] outline-none p-2 rounded text-[12px] text-white resize-none"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={isPushing || !commitMsg.trim()}
                      className="w-full bg-[#007acc] hover:bg-[#005f9e] disabled:bg-[#3c3c3c] disabled:text-[#858585] disabled:cursor-not-allowed text-white py-1.5 rounded text-[12px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow"
                    >
                      {isPushing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Pushing to GitHub...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp size={14} />
                          <span>Commit & Push Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Commit History Timeline Graph */}
                <div className="pt-2 border-t border-[#3c3c3c]">
                  <div className="text-[11px] uppercase tracking-wider text-[#858585] font-bold mb-3 flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>Multiplayer Commit Graph</span>
                  </div>

                  {gitCommits.length === 0 ? (
                    <div className="p-4 text-center text-[#858585] text-[11px] italic bg-[#1e1e1e] rounded border border-[#2d2d2d]">
                      No commits have been pushed to this room yet.
                    </div>
                  ) : (
                    <div className="relative pl-4 border-l border-[#3c3c3c] ml-2 space-y-4">
                      {gitCommits.slice().reverse().map((commit, idx) => (
                        <div key={commit.hash} className="relative text-[11px]">
                          {/* Timeline dot */}
                          <div className="absolute left-[-21.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#007acc] border-4 border-[#252526] z-10 flex items-center justify-center shadow" />
                          
                          <div className="flex flex-col gap-1 p-2 rounded bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#3c3c3c] transition-all">
                            <div className="flex items-center justify-between text-white font-medium">
                              <span className="truncate">{commit.message}</span>
                              <span className="text-[10px] text-[#858585] font-mono shrink-0 ml-1">
                                {commit.hash}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-[#858585]">
                              <span>by <b>{commit.author.split('@')[0]}</b></span>
                              <span>
                                {new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <div className="text-[9px] text-[#007acc] mt-0.5">
                              📄 {commit.filesCount} file{commit.filesCount === 1 ? '' : 's'} tracked
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
