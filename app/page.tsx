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
  const [activeTab, setActiveTab] = useState<'ranking' | 'free' | 'recommend' | 'tier'>('ranking');
  const [subTab, setSubTab] = useState<'all' | 'concept'>('all');
  
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 및 페이지네이션
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 5;

  // 글쓰기 폼
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 댓글 폼
  const [commentInputs, setCommentInputs] = useState<{[key: number]: { author: string, content: string, password: string }}>({});

  const fetchStreamers = async () => {
    const { data, error } = await supabase.from('streamers').select('*').order('viewers', { ascending: false });
    if (!error && data) setStreamers(data);
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
  }, [activeTab, subTab, searchQuery]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ranking' || activeTab === 'tier') return;
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
      setNewTitle('');
      setNewContent('');
      setNewAuthor('');
      setNewPassword('');
      fetchPosts();
      alert('글이 성공적으로 등록되었습니다! 🚀');
    }
  };

  const handleDeletePost = async (postId: number, correctPassword?: string) => {
    const inputPassword = prompt('글을 작성할 때 입력했던 비밀번호를 입력하세요:');
    if (inputPassword === null) return;

    if (inputPassword !== correctPassword) {
      return alert('비밀번호가 일치하지 않습니다. 본인이 쓴 글만 삭제할 수 있습니다! ❌');
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (!error) {
      fetchPosts();
      fetchComments();
      alert('게시글이 삭제되었습니다.');
    }
  };

  const handleCreateComment = async (postId: number) => {
    const input = commentInputs[postId];
    if (!input || !input.content.trim()) return alert('댓글 내용을 입력해주세요!');
    if (!input.password.trim()) return alert('댓글 삭제용 비밀번호를 입력해주세요!');

    const { error } = await supabase.from('community_comments').insert({
      post_id: postId,
      author: input.author.trim() ? input.author : '익명 댓글러',
      content: input.content,
      password: input.password
    });

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: { author: '', content: '', password: '' } }));
      fetchComments();
    }
  };

  const handleDeleteComment = async (commentId: number, correctPassword?: string) => {
    const inputPassword = prompt('댓글 비밀번호를 입력하세요:');
    if (inputPassword === null) return;

    if (inputPassword !== correctPassword) {
      return alert('비밀번호가 틀렸습니다! ❌');
    }

    const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  const handleCommentInputChange = (postId: number, field: 'author' | 'content' | 'password', value: string) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] || { author: '', content: '', password: '' }), [field]: value }
    }));
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

  // 🧮 300명 미만은 티어 분류에서 아예 제외 처리
  const getCalculatedTier = (viewers: number) => {
    if (viewers >= 10000) return 'S';
    if (viewers >= 7000) return 'A';
    if (viewers >= 3000) return 'B';
    if (viewers >= 1000) return 'C';
    if (viewers >= 300) return 'D';
    return 'NONE'; // 👈 F등급 대신 노출 제외 플래그값 부여
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      
      {/* 🧭 사이드바 메뉴판 */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
            <p className="text-xs text-gray-500 mt-1">통합 플랫폼 포털</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ranking' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}>
              <span>📊</span><span>실시간 순위</span>
            </button>
            <button onClick={() => setActiveTab('free')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'free' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}>
              <span>💬</span><span>자유게시판</span>
            </button>
            <button onClick={() => setActiveTab('recommend')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'recommend' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}>
              <span>👍</span><span>스트리머를 추천합니다</span>
            </button>
            <button onClick={() => setActiveTab('tier')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'tier' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}>
              <span>👑</span><span>스트리머 티어표</span>
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      {/* 🖥️ 메인 대시보드 */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xl font-bold animate-pulse text-gray-500">포털 기지 연결 중...</div>
        ) : (
          <div className="max-w-4xl mx-auto">
            
            {/* 📊 1. 순위 탭 */}
            {activeTab === 'ranking' && (
              <div>
                <header className="mb-8"><h2 className="text-2xl font-black">CHZZK & SOOP 실시간 통합 랭킹 TOP 10</h2></header>
                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                  <div className="grid grid-cols-12 bg-gray-700 p-4 text-sm font-bold text-gray-300 text-center">
                    <div className="col-span-1">순위</div><div className="col-span-2">플랫폼</div><div className="col-span-3 text-left pl-4">스트리머/BJ</div><div className="col-span-4 text-left">방송 제목</div><div className="col-span-2">시청자 수</div>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {streamers.map((streamer, index) => (
                      <div key={index} className="grid grid-cols-12 p-4 items-center text-center hover:bg-gray-750 transition-colors">
                        <div className="col-span-1 font-black text-lg">{index === 0 ? '👑 1' : index + 1}</div>
                        <div className="col-span-2">{streamer.platform === '치지직' ? <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">CHZZK</span> : <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-950 text-sky-400 border border-sky-500/30">SOOP</span>}</div>
                        <div className="col-span-3 text-left pl-4 font-bold text-gray-100">{streamer.name}</div>
                        <div className="col-span-4 text-left text-sm text-gray-400 truncate pr-2">{streamer.current_game}</div>
                        <div className="col-span-2 font-mono font-bold text-amber-400">{streamer.viewers.toLocaleString()}명</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 👑 2. 스트리머 티어표 (F티어 싹 삭제 완료) */}
            {activeTab === 'tier' && (
              <div>
                <header className="mb-8">
                  <h2 className="text-2xl font-black">👑 실시간 스트리머 기업 규모 티어표</h2>
                  <p className="text-gray-400 mt-1 text-sm">현재 라이브 시청자 수를 기준으로 기업 규모가 실시간 반영됩니다.</p>
                </header>

                <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl divide-y divide-gray-800">
                  
                  {/* ✂️ [수정 완료] 리스트에서 F등급 항목 완전 제외 */}
                  {[
                    { label: 'S', name: '대기업', bg: 'bg-orange-400 text-gray-950' },
                    { label: 'A', name: '중견기업', bg: 'bg-amber-200 text-gray-950' },
                    { label: 'B', name: '중기업', bg: 'bg-yellow-100 text-gray-950' },
                    { label: 'C', name: '소기업', bg: 'bg-green-400 text-gray-950' },
                    { label: 'D', name: '스타트업', bg: 'bg-emerald-300 text-gray-950' },
                  ].map(tierInfo => {
                    const tierStreamers = streamers.filter(s => getCalculatedTier(s.viewers) === tierInfo.label);

                    return (
                      <div key={tierInfo.label} className="grid grid-cols-12 items-stretch min-h-[5.5rem]">
                        <div className={`col-span-2 flex flex-col items-center justify-center font-black text-center p-2 border-r border-gray-800/20 ${tierInfo.bg}`}>
                          <span className="text-xl tracking-wider leading-none">{tierInfo.label}</span>
                          <span className="text-[11px] font-bold mt-1 text-gray-900/80">{tierInfo.name}</span>
                        </div>
                        
                        <div className="col-span-10 p-4 flex flex-wrap gap-3 items-center bg-gray-900/40">
                          {tierStreamers.length === 0 ? (
                            <span className="text-xs text-gray-700 font-medium pl-2">현재 해당 규모의 기업 스트리머가 없습니다.</span>
                          ) : (
                            tierStreamers.map((st, sIdx) => (
                              <div key={sIdx} className="flex items-center space-x-2 bg-gray-800/80 border border-gray-700 px-3 py-2 rounded-xl shadow-sm hover:border-gray-600 transition-all">
                                {st.platform === '치지직' ? (
                                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20">CH</span>
                                ) : (
                                  <span className="text-[10px] font-black text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-500/20">SP</span>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-200">{st.name}</span>
                                  <span className="text-[10px] font-mono font-medium text-amber-400/90">{st.viewers.toLocaleString()}명</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* ✂️ [수정 완료] 하단 가이드 문구에서도 F티어(꿈나무) 문항 영구 삭제 */}
                <div className="mt-6 bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                  <p className="font-bold text-gray-400 mb-1">💡 기업 규모 티어 실시간 Fact 기준표:</p>
                  <p>• 👑 S 티어 (대기업): 10,000명 이상 | • 🥇 A 티어 (중견기업): 7,000명 이상 ~ 10,000명 미만</p>
                  <p>• 🥈 B 티어 (중기업): 3,000명 이상 ~ 7,000명 미만 | • 🥉 C 티어 (소기업): 1,000명 이상 ~ 3,000명 미만</p>
                  <p>• 🎖️ D 티어 (스타트업): 300명 이상 ~ 1,000명 미만 (300명 미만 구간은 노출되지 않습니다.)</p>
                </div>
              </div>
            )}

            {/* 💬 3 & 4. 커뮤니티 게시판 공용 출력 구역 */}
            {(activeTab === 'free' || activeTab === 'recommend') && (
              <div>
                <header className="mb-6">
                  <h2 className="text-2xl font-black">{activeTab === 'free' ? '💬 자유게시판' : '👍 스트리머 추천 게시판'}</h2>
                  <p className="text-gray-400 mt-1 text-sm">{activeTab === 'free' ? '유저들과 다양한 떡밥으로 자유롭게 소통하는 광장입니다.' : '내가 좋아하는 꿀잼 스트리머나 BJ를 다른 유저들에게 추천해 보세요!'}</p>
                </header>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
                  <div className="flex space-x-2">
                    <button onClick={() => setSubTab('all')} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${subTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>전체글</button>
                    <button onClick={() => setSubTab('concept')} className={`px-4 py-1.5 rounded-lg text-sm font-bold ${subTab === 'concept' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'text-gray-400'}`}>🔥 인기글</button>
                  </div>
                  <div className="relative w-full md:w-64">
                    <input type="text" placeholder="현재 게시판 내 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-gray-200" />
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">🔍</span>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8 space-y-4 shadow-xl">
                  <div className="grid grid-cols-3 gap-4">
                    <input type="text" placeholder="익명 닉네임" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input type="password" placeholder="삭제 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder={activeTab === 'free' ? "글 제목을 입력하세요" : "추천할 스트리머 이름과 제목 입력"} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <textarea placeholder={activeTab === 'free' ? "자유로운 이야기를 적어주세요!" : "스트리머의 방송 시간, 주요 컨텐츠, 추천하는 이유를 매력 있게 적어보세요!"} rows={2} value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 resize-none"></textarea>
                  <div className="text-right"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md">글 등록하기 📝</button></div>
                </form>

                <div className="space-y-6">
                  {currentPosts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl text-gray-500 text-sm">해당 게시판에 조건과 일치하는 글이 아직 없습니다.</div>
                  ) : (
                    currentPosts.map((post) => (
                      <div key={post.id} className={`p-5 rounded-2xl border ${post.likes >= 10 ? 'bg-red-950/10 border-red-900/40' : 'bg-gray-800/50 border-gray-800'} space-y-4`}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {post.likes >= 10 && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-black">인기</span>}
                              <span className="font-bold text-lg text-gray-200">{post.title}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="text-gray-400 font-bold">👤 {post.author}</span>
                              <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleLike(post.id, post.likes || 0)} className="bg-gray-900 border border-gray-700 hover:border-blue-500 px-3 py-1.5 rounded-xl text-sm flex items-center space-x-1"><span>👍</span><span>{post.likes || 0}</span></button>
                            <button onClick={() => handleDeletePost(post.id, post.password)} className="bg-gray-900/50 border border-gray-800 hover:border-red-500 hover:text-red-400 px-2.5 py-1.5 rounded-xl text-xs text-gray-500 transition-all">삭제 🗑️</button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-900/30 p-3 rounded-xl border border-gray-800/50">{post.content}</p>

                        <div className="border-t border-gray-800/60 pt-3 mt-2 space-y-3">
                          <h4 className="text-xs font-bold text-blue-400 px-1">댓글 목록</h4>
                          <div className="space-y-2">
                            {comments.filter(c => c.post_id === post.id).length === 0 ? (
                              <div className="text-xs text-gray-600 px-1">댓글을 달아 대화를 나눠보세요!</div>
                            ) : (
                              comments.filter(c => c.post_id === post.id).map((comment) => (
                                <div key={comment.id} className="bg-gray-900/60 p-3 rounded-xl border border-gray-800/80 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5 max-w-[85%]">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-gray-300">{comment.author}</span>
                                      <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-gray-400 whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                  <button onClick={() => handleDeleteComment(comment.id, (comment as any).password)} className="text-[10px] text-gray-600 hover:text-red-400 p-1">❌</button>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="grid grid-cols-12 gap-2 pt-2">
                            <input type="text" placeholder="닉네임" value={commentInputs[post.id]?.author || ''} onChange={(e) => handleCommentInputChange(post.id, 'author', e.target.value)} className="col-span-3 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                            <input type="password" placeholder="암호" value={commentInputs[post.id]?.password || ''} onChange={(e) => handleCommentInputChange(post.id, 'password', e.target.value)} className="col-span-2 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                            <input type="text" placeholder="댓글을 입력하세요..." value={commentInputs[post.id]?.content || ''} onChange={(e) => handleCommentInputChange(post.id, 'content', e.target.value)} className="col-span-5 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                            <button type="button" onClick={() => handleCreateComment(post.id)} className="col-span-2 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-lg text-xs transition-all">🎒 등록</button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8 pt-4 border-t border-gray-800">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-all">◀</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-800/60 border border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'}`}>{pageNum}</button>
                    ))}
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-all">▶</button>
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