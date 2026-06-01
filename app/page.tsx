'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcsdmemnsqhslpwldnhd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Streamer {
  name: string;
  platform: string;
  viewers: number;
  current_game: string;
  tier: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  likes: number;
  password?: string;
  category: 'free' | 'recommend';
}

interface Comment {
  id: number;
  post_id: number;
  author: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ranking' | 'free' | 'recommend'>('ranking');
  const [subTab, setSubTab] = useState<'all' | 'concept'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // 🥊 플랫폼별 실시간 시청자 통계 상태 추가
  const [platformStats, setPlatformStats] = useState({
    chzzkTotal: 0,
    soopTotal: 0,
    chzzkPercentage: 50,
    soopPercentage: 50
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 5;

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [commentInputs, setCommentInputs] = useState<{[key: number]: { author: string, content: string, password: string }}>({});

  // 🧮 스트리머 데이터를 가져온 뒤 플랫폼별 시청자 수 총합 및 비율 실시간 계산 엔진
  const fetchStreamers = async () => {
    const { data, error } = await supabase.from('streamers').select('*').order('viewers', { ascending: false });
    if (!error && data) {
      setStreamers(data);

      // 플랫폼별 시청자 합산 계산 시작 (팩트체크)
      let chzzkSum = 0;
      let soopSum = 0;

      data.forEach((s) => {
        if (s.platform === '치지직') chzzkSum += s.viewers;
        if (s.platform === 'SOOP') soopSum += s.viewers;
      });

      const total = chzzkSum + soopSum;
      let chzzkPct = 50;
      let soopPct = 50;

      if (total > 0) {
        chzzkPct = Math.round((chzzkSum / total) * 100);
        soopPct = 100 - chzzkPct;
      }

      setPlatformStats({
        chzzkTotal: chzzkSum,
        soopTotal: soopSum,
        chzzkPercentage: chzzkPct,
        soopPercentage: soopPct
      });
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
    if (!error && data) setPosts(data);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.from('community_comments').select('*').order('created_at', { ascending: true });
    if (!error && data) setComments(data);
  };

  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([fetchStreamers(), fetchPosts(), fetchComments()]);
      setLoading(false);
    };
    initFetch();

    const interval = setInterval(() => {
      fetchStreamers();
      fetchPosts();
      fetchComments();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setIsMobileMenuOpen(false);
  }, [activeTab, subTab, searchQuery]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ranking') return;
    if (!newTitle.trim() || !newContent.trim()) return alert('제목과 내용을 입력해주세요!');
    if (!newPassword.trim()) return alert('삭제용 비밀번호를 입력해주세요!');

    const { error } = await supabase.from('community_posts').insert({
      title: newTitle,
      content: newContent,
      author: newAuthor.trim() ? newAuthor : '익명 유저',
      password: newPassword,
      likes: 0,
      category: activeTab
    });

    if (!error) {
      setNewTitle(''); setNewContent(''); setNewAuthor(''); setNewPassword('');
      fetchPosts();
      alert('글이 성공적으로 등록되었습니다! 🚀');
    }
  };

  const handleDeletePost = async (postId: number, correctPassword?: string) => {
    const inputPassword = prompt('글을 작성할 때 입력했던 비밀번호를 입력하세요:');
    if (inputPassword === null) return;
    if (inputPassword !== correctPassword) return alert('비밀번호가 일치하지 않습니다! ❌');

    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (!error) { fetchPosts(); fetchComments(); alert('게시글이 삭제되었습니다.'); }
  };

  const handleCreateComment = async (postId: number) => {
    const input = commentInputs[postId];
    if (!input || !input.content.trim() || !input.password.trim()) return alert('내용과 암호를 입력해주세요!');

    const { error } = await supabase.from('community_comments').insert({
      post_id: postId,
      author: input.author.trim() ? input.author : '익명 댓글러',
      content: input.content,
      password: input.password
    });
    if (!error) { setCommentInputs(prev => ({ ...prev, [postId]: { author: '', content: '', password: '' } })); fetchComments(); }
  };

  const handleDeleteComment = async (commentId: number, correctPassword?: string) => {
    const inputPassword = prompt('댓글 비밀번호를 입력하세요:');
    if (inputPassword === null) return;
    if (inputPassword !== correctPassword) return alert('비밀번호가 틀렸습니다! ❌');

    const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  const handleCommentInputChange = (postId: number, field: 'author' | 'content' | 'password', value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: { ...(prev[postId] || { author: '', content: '', password: '' }), [field]: value } }));
  };

  const handleLike = async (postId: number, currentLikes: number) => {
    const { error } = await supabase.from('community_posts').update({ likes: currentLikes + 1 }).eq('id', postId);
    if (!error) fetchPosts();
  };

  const filteredPosts = posts
    .filter(post => post.category === (activeTab === 'free' ? 'free' : 'recommend'))
    .filter(post => subTab === 'all' ? true : (post.likes || 0) >= 10)
    .filter(post => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query) || post.author.toLowerCase().includes(query);
    });

  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const NavigationMenu = () => (
    <nav className="space-y-2">
      <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ranking' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900'}`}>
        <span>📊</span><span>실시간 순위</span>
      </button>
      <button onClick={() => setActiveTab('free')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'free' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900'}`}>
        <span>💬</span><span>자유게시판</span>
      </button>
      <button onClick={() => setActiveTab('recommend')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'recommend' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900'}`}>
        <span>👍</span><span>스트리머를 추천합니다</span>
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans flex-col md:flex-row">
      
      {/* 📱 모바일 헤더 */}
      <div className="md:hidden flex items-center justify-between bg-gray-950 p-4 border-b border-gray-800 sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-xl p-1">
          {isMobileMenuOpen ? '❌' : '☰'}
        </button>
      </div>

      {/* 🧭 PC 고정 사이드바 */}
      <aside className="hidden md:flex w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
            <p className="text-xs text-gray-500 mt-1">통합 플랫폼 포털</p>
          </div>
          <NavigationMenu />
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      {/* 🧭 모바일 드롭다운 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-950 border-b border-gray-800 p-4 space-y-4 sticky top-[57px] z-40">
          <NavigationMenu />
        </div>
      )}

      {/* 🖥️ 메인 대시보드 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xl font-bold animate-pulse text-gray-500">포털 기지 연결 중...</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* 🥊 [독점 무기 가동] 실시간 플랫폼 체급 대항전 게이지 전광판 (메인 최상단 배치) */}
            <section className="bg-gray-950 p-5 rounded-2xl border border-gray-800 shadow-2xl space-y-4">
              <div className="flex justify-between items-center text-xs md:text-sm font-black tracking-wide">
                <div className="flex items-center space-x-2 text-emerald-400 animate-pulse">
                  <span>🟢 CHZZK 실시간 체급</span>
                  <span className="font-mono bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                    {platformStats.chzzkTotal.toLocaleString()}명
                  </span>
                </div>
                <div className="text-gray-500 text-[11px] font-bold">VS 플랫폼 실시간 점유율</div>
                <div className="flex items-center space-x-2 text-sky-400 animate-pulse">
                  <span className="font-mono bg-sky-950/60 border border-sky-500/20 px-2 py-0.5 rounded text-xs">
                    {platformStats.soopTotal.toLocaleString()}명
                  </span>
                  <span>SOOP 실시간 체급 🔵</span>
                </div>
              </div>

              {/* 하이테크 반응형 게이지 바 대치 구도 */}
              <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden flex border border-gray-700/50 shadow-inner relative">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full flex items-center justify-start pl-3 text-[10px] font-black text-gray-950 transition-all duration-700"
                  style={{ width: `${platformStats.chzzkPercentage}%` }}
                >
                  {platformStats.chzzkPercentage > 15 && `${platformStats.chzzkPercentage}%`}
                </div>
                <div 
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-full flex items-center justify-end pr-3 text-[10px] font-black text-white transition-all duration-700"
                  style={{ width: `${platformStats.soopPercentage}%` }}
                >
                  {platformStats.soopPercentage > 15 && `${platformStats.soopPercentage}%`}
                </div>
              </div>
            </section>

            {/* 📊 1. 실시간 순위 표 */}
            {activeTab === 'ranking' && (
              <div className="space-y-4">
                <header><h2 className="text-xl md:text-2xl font-black">CHZZK & SOOP 실시간 통합 랭킹</h2></header>
                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                  <div className="hidden md:grid grid-cols-12 bg-gray-700 p-4 text-sm font-bold text-gray-300 text-center">
                    <div className="col-span-1">순위</div><div className="col-span-2">플랫폼</div><div className="col-span-3 text-left pl-4">스트리머/BJ</div><div className="col-span-4 text-left">방송 제목</div><div className="col-span-2">시청자 수</div>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {streamers.map((streamer, index) => (
                      <div key={index} className="flex flex-col md:grid md:grid-cols-12 p-4 md:items-center text-center hover:bg-gray-750 transition-colors gap-2 md:gap-0">
                        <div className="flex items-center justify-between md:col-span-1 md:justify-center"><span className="md:hidden text-xs text-gray-500 font-bold">순위</span><span className="font-black text-base md:text-lg">{index === 0 ? '👑 1' : index + 1}</span></div>
                        <div className="flex items-center justify-between md:col-span-2 md:justify-center"><span className="md:hidden text-xs text-gray-500 font-bold">플랫폼</span>{streamer.platform === '치지직' ? <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">CHZZK</span> : <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-950 text-sky-400 border border-sky-500/30">SOOP</span>}</div>
                        <div className="flex items-center justify-between md:col-span-3 md:text-left md:pl-4"><span className="md:hidden text-xs text-gray-500 font-bold">스트리머</span><span className="font-bold text-gray-100 text-sm md:text-base">{streamer.name}</span></div>
                        <div className="flex flex-col text-left md:col-span-4 bg-gray-900/30 p-2 md:p-0 rounded-lg md:bg-transparent"><span className="md:hidden text-[10px] text-gray-500 font-bold mb-1">방송 제목</span><span className="text-xs md:text-sm text-gray-400 truncate">{streamer.current_game}</span></div>
                        <div className="flex items-center justify-between md:col-span-2 md:justify-center"><span className="md:hidden text-xs text-gray-500 font-bold">시청자</span><span className="font-mono font-bold text-amber-400 text-sm md:text-base">{streamer.viewers.toLocaleString()}명</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 💬 2 & 3. 자유게시판 및 추천 게시판 구역 */}
            {(activeTab === 'free' || activeTab === 'recommend') && (
              <div className="space-y-6">
                <header><h2 className="text-xl md:text-2xl font-black">{activeTab === 'free' ? '💬 자유게시판' : '👍 스트리머 추천 게시판'}</h2></header>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-800 pb-4">
                  <div className="flex space-x-2">
                    <button onClick={() => setSubTab('all')} className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold ${subTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>전체글</button>
                    <button onClick={() => setSubTab('concept')} className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold ${subTab === 'concept' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'text-gray-400'}`}>🔥 인기글</button>
                  </div>
                  <div className="relative w-full md:w-64">
                    <input type="text" placeholder="현재 게시판 내 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500" />
                    <span className="absolute left-3 top-2.5 text-xs text-gray-500">🔍</span>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="bg-gray-800 p-4 md:p-6 rounded-2xl border border-gray-700 space-y-3 md:space-y-4 shadow-xl">
                  <div className="flex flex-col md:grid md:grid-cols-3 gap-2.5 md:gap-4">
                    <input type="text" placeholder="익명 닉네임" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none" />
                    <input type="password" placeholder="삭제 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none" />
                    <input type="text" placeholder="글 제목을 입력하세요" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none" />
                  </div>
                  <textarea placeholder="글 내용을 입력해 주세요!" rows={2} value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 md:p-4 text-xs md:text-sm focus:outline-none resize-none"></textarea>
                  <div className="text-right"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs md:text-sm shadow-md">글 등록하기 📝</button></div>
                </form>

                <div className="space-y-4">
                  {currentPosts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl text-gray-500 text-xs">작성된 게시글이 존재하지 않습니다.</div>
                  ) : (
                    currentPosts.map((post) => (
                      <div key={post.id} className={`p-4 md:p-5 rounded-2xl border ${post.likes >= 10 ? 'bg-red-950/10 border-red-900/40' : 'bg-gray-800/50 border-gray-800'} space-y-4`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              {post.likes >= 10 && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black mb-1 sm:mb-0">인기</span>}
                              <span className="font-bold text-base md:text-lg text-gray-200 break-all">{post.title}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-1">
                              <span className="text-gray-400 font-bold">👤 {post.author}</span>
                              <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 self-end sm:self-start">
                            <button onClick={() => handleLike(post.id, post.likes || 0)} className="bg-gray-900 border border-gray-700 px-3 py-1 rounded-xl text-xs flex items-center space-x-1"><span>👍</span><span>{post.likes || 0}</span></button>
                            <button onClick={() => handleDeletePost(post.id, post.password)} className="bg-gray-900/50 border border-gray-800 px-2 py-1 rounded-xl text-[11px] text-gray-500">삭제</button>
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap bg-gray-900/30 p-3 rounded-xl border border-gray-800/50 break-all">{post.content}</p>

                        <div className="border-t border-gray-800/60 pt-3 space-y-2">
                          <h4 className="text-[11px] font-bold text-blue-400 px-1">댓글</h4>
                          <div className="space-y-1.5">
                            {comments.filter(c => c.post_id === post.id).map((comment) => (
                              <div key={comment.id} className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/80 flex justify-between items-start text-[11px] gap-2">
                                <div className="space-y-0.5 max-w-[90%] break-all"><span className="font-bold text-gray-300 mr-2">{comment.author}</span><p className="text-gray-400 inline">{comment.content}</p></div>
                                <button onClick={() => handleDeleteComment(comment.id, (comment as any).password)} className="text-gray-600 hover:text-red-400 text-[9px] pt-0.5">❌</button>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col gap-1.5 pt-2">
                            <div className="grid grid-cols-2 gap-1.5">
                              <input type="text" placeholder="닉네임" value={commentInputs[post.id]?.author || ''} onChange={(e) => handleCommentInputChange(post.id, 'author', e.target.value)} className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[11px]" />
                              <input type="password" placeholder="암호" value={commentInputs[post.id]?.password || ''} onChange={(e) => handleCommentInputChange(post.id, 'password', e.target.value)} className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-[11px]" />
                            </div>
                            <div className="flex gap-1.5">
                              <input type="text" placeholder="댓글 내용을 입력하세요..." value={commentInputs[post.id]?.content || ''} onChange={(e) => handleCommentInputChange(post.id, 'content', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px]" />
                              <button type="button" onClick={() => handleCreateComment(post.id)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold shrink-0">등록</button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-800">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 rounded-lg bg-gray-800 text-xs text-gray-400">◀</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-7 h-7 rounded-lg text-xs font-bold ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{pageNum}</button>
                    ))}
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg bg-gray-800 text-xs text-gray-400">▶</button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

    </div>
  );
}