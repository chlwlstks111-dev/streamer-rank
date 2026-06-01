'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 수파베이스 데이터 창고 직통 연결 키
const SUPABASE_URL = 'https://zcsdmemnsqhslpwldnhd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Streamer {
  id?: number;
  name: string;
  platform: string;
  viewers: number;
  current_game: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  likes: number;
  password?: string;
  created_at: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ranking' | 'board'>('ranking');
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 게시판 관련 입력 상태
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('자유');
  const [newPassword, setNewPassword] = useState(''); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedFilter, setSelectedFilter] = useState('전체'); 

  const [stats, setStats] = useState({
    chzzkTotal: 0,
    soopTotal: 0,
    chzzkPct: 50,
    soopPct: 50
  });

  // 📊 창고에서 랭킹 리드
  const loadRankings = async () => {
    const { data, error } = await supabase
      .from('streamers')
      .select('*')
      .order('viewers', { ascending: false })
      .limit(100);

    if (!error && data) {
      let chzzkSum = 0;
      let soopSum = 0;

      data.forEach((s: Streamer) => {
        if (s.platform === '치지직') chzzkSum += s.viewers;
        if (s.platform === 'SOOP') soopSum += s.viewers;
      });

      const total = chzzkSum + soopSum;
      let cPct = 50;
      let sPct = 50;
      if (total > 0) {
        cPct = Math.round((chzzkSum / total) * 100);
        sPct = 100 - cPct;
      }

      setStats({ chzzkTotal: chzzkSum, soopTotal: soopSum, chzzkPct: cPct, soopPct: sPct });
      setStreamers(data);
    }
  };

  // 📝 창고에서 게시글 리드
  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
  };

  // ✍️ 글 등록
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 채워주세요!');
      return;
    }
    if (!newPassword.trim()) {
      alert('글 삭제용 비밀번호를 입력해주세요!');
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([{ 
        title: newTitle, 
        content: newContent, 
        category: newCategory, 
        likes: 0,
        password: newPassword 
      }]);

    if (!error) {
      setNewTitle('');
      setNewContent('');
      setNewPassword('');
      loadPosts();
      alert('게시글이 성공적으로 등록되었습니다.');
    } else {
      alert('글 등록 실패: 창고 연동 에러');
    }
  };

  // ❤️ 좋아요 기능
  const handleLike = async (id: number, currentLikes: number) => {
    const { error } = await supabase
      .from('posts')
      .update({ likes: currentLikes + 1 })
      .eq('id', id);

    if (!error) {
      loadPosts();
    }
  };

  // ❌ 비밀번호 기반 삭제 로직
  const handleDeletePost = async (id: number, correctPassword?: string) => {
    const inputPassword = prompt('게시글 작성 시 입력한 비밀번호를 입력하세요:');
    if (inputPassword === null) return; 

    if (inputPassword !== correctPassword && correctPassword !== undefined && correctPassword !== '') {
      alert('비밀번호가 일치하지 않습니다! 삭제할 수 없습니다.');
      return;
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (!error) {
      alert('게시글이 안전하게 파쇄되었습니다.');
      loadPosts();
    } else {
      alert('삭제 실패: 권한 에러');
    }
  };

  useEffect(() => {
    const initData = async () => {
      await Promise.all([loadRankings(), loadPosts()]);
      setLoading(false);
    };
    initData();

    const interval = setInterval(loadRankings, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔍 실시간 검색창 필터 엔진
  const filteredPosts = posts.filter((post: Post) => {
    const matchesCategory = selectedFilter === '전체' || post.category === selectedFilter;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans flex-col md:flex-row">
      
      {/* 모바일 상단 바 */}
      <div className="md:hidden flex items-center justify-between bg-gray-950 p-4 border-b border-gray-800 sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
        <div className="flex space-x-2">
          <button onClick={() => setActiveTab('ranking')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'ranking' ? 'bg-blue-600' : 'bg-gray-800'}`}>랭킹</button>
          <button onClick={() => setActiveTab('board')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'board' ? 'bg-blue-600' : 'bg-gray-800'}`}>게시판</button>
        </div>
      </div>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
            <p className="text-xs text-gray-500 mt-1">통합 라이브 포털</p>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('ranking')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm border transition-all ${activeTab === 'ranking' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border-blue-500/30' : 'border-transparent text-gray-400 hover:bg-gray-900'}`}
            >
              <span>📊</span><span>실시간 통합 랭킹</span>
            </button>
            <button 
              onClick={() => setActiveTab('board')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm border transition-all ${activeTab === 'board' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30' : 'border-transparent text-gray-400 hover:bg-gray-900'}`}
            >
              <span>📝</span><span>통합 커뮤니티 게시판</span>
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      {/* 메인 뷰포트 구역 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xl font-bold animate-pulse text-gray-500">대시보드 안전 연동 중...</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {activeTab === 'ranking' ? (
              <>
                {/* 📊 상단 대항전 스코어보드 */}
                <section className="bg-gray-950 p-5 rounded-2xl border border-gray-800 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs md:text-sm font-black tracking-wide">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <span>🟢 CHZZK (Top 50)</span>
                      <span className="font-mono bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                        {stats.chzzkTotal.toLocaleString()}명
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-xs font-black">VS 플랫폼 점유율 대항전</div>
                      <div className="text-[10px] text-gray-600 mt-0.5 font-medium">양대 플랫폼 인기 라이브 방송 각 50명 기준</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sky-400">
                      <span className="font-mono bg-sky-950/60 border border-sky-500/20 px-2 py-0.5 rounded text-xs">
                        {stats.soopTotal.toLocaleString()}명
                      </span>
                      <span>(Top 50) SOOP 🔵</span>
                    </div>
                  </div>

                  <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden flex border border-gray-700/50 shadow-inner relative">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full flex items-center justify-start pl-3 text-[10px] font-black text-gray-950 transition-all duration-700" style={{ width: `${stats.chzzkPct}%` }}>
                      {stats.chzzkPct > 10 && `${stats.chzzkPct}%`}
                    </div>
                    <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-full flex items-center justify-end pr-3 text-[10px] font-black text-white transition-all duration-700" style={{ width: `${stats.soopPct}%` }}>
                      {stats.soopPct > 10 && `${stats.soopPct}%`}
                    </div>
                  </div>
                </section>

                {/* 📋 통합 테이블 */}
                <div className="space-y-4">
                  <header>
                    <h2 className="text-xl md:text-2xl font-black">CHZZK & SOOP 통합 실시간 라이브 랭킹</h2>
                    <p className="text-xs text-gray-500 mt-1">※ 데이터베이스와 연동되어 실시간 계측되는 통합 전광판입니다.</p>
                  </header>

                  <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                    <div className="hidden md:grid grid-cols-12 bg-gray-700 p-4 text-sm font-bold text-gray-300 text-center">
                      <div className="col-span-1">순위</div>
                      <div className="col-span-2">플랫폼</div>
                      <div className="col-span-3 text-left pl-4">스트리머/BJ</div>
                      <div className="col-span-4 text-left">방송 제목</div>
                      <div className="col-span-2">시청자 수</div>
                    </div>

                    <div className="divide-y divide-gray-700">
                      {streamers.map((streamer, index) => (
                        <div key={index} className="flex flex-col md:grid md:grid-cols-12 p-4 md:items-center text-center hover:bg-gray-750 transition-colors gap-2 md:gap-0">
                          <div className="flex items-center justify-between md:col-span-1 md:justify-center">
                            <span className="md:hidden text-xs text-gray-500 font-bold">순위</span>
                            <span className="font-black text-base md:text-lg">{index + 1}</span>
                          </div>
                          <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                            <span className="md:hidden text-xs text-gray-500 font-bold">플랫폼</span>
                            {streamer.platform === '치지직' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">CHZZK</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-950 text-sky-400 border border-sky-500/30">SOOP</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between md:col-span-3 md:text-left md:pl-4">
                            <span className="md:hidden text-xs text-gray-500 font-bold">스트리머</span>
                            <span className="font-bold text-gray-100 text-sm md:text-base">{streamer.name}</span>
                          </div>
                          <div className="flex flex-col text-left md:col-span-4 bg-gray-900/30 p-2 md:p-0 rounded-lg md:bg-transparent">
                            <span className="md:hidden text-[10px] text-gray-500 font-bold mb-1">방송 제목</span>
                            <span className="text-xs md:text-sm text-gray-400 truncate">{streamer.current_game}</span>
                          </div>
                          <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                            <span className="md:hidden text-xs text-gray-500 font-bold">시청자</span>
                            <span className="font-mono font-bold text-amber-400 text-sm md:text-base">{streamer.viewers.toLocaleString()}명</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 📝 통합 커뮤니티 게시판 구역 */
              <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black">스트리머 랭킹 통합 커뮤니티</h2>
                    <p className="text-xs text-gray-500 mt-1">비하 없는 청정 소통 공간, 원하는 스트리머를 추천해보세요.</p>
                  </div>
                  
                  {/* 🔍 1. 실시간 통합 검색바 */}
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text" 
                      placeholder="글 제목, 내용 실시간 검색..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-950 text-xs text-gray-200 border border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-purple-500 pl-8"
                    />
                    <span className="absolute left-2.5 top-2.5 text-xs text-gray-600">🔍</span>
                  </div>
                </header>

                {/* 📋 2. 카테고리별 분리 필터 탭 (스트리머 추천합니다 완벽 분리) */}
                <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
                  {['전체', '자유', '응원', '스트리머 추천합니다'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedFilter(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedFilter === category ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* ✍️ 글쓰기 에디터 폼 */}
                <form onSubmit={handleCreatePost} className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3 shadow-2xl">
                  <div className="flex flex-col md:flex-row gap-2">
                    <select 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 focus:outline-none"
                    >
                      <option value="자유">자유</option>
                      <option value="응원">응원</option>
                      <option value="스트리머 추천합니다">스트리머 추천합니다</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="게시글 제목을 입력하세요." 
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                    />
                    <input 
                      type="password" 
                      placeholder="삭제 비밀번호" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full md:w-32 bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-center font-mono"
                    />
                  </div>
                  <textarea 
                    placeholder="게시판 규정에 맞는 내용을 자유롭게 기술해 주세요." 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/30">
                      작성글 창고 등록
                    </button>
                  </div>
                </form>

                {/* 📜 게시글 피드 리스트 */}
                <div className="space-y-3">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 text-sm text-gray-600 font-bold">조건에 맞는 게시글이 존재하지 않습니다.</div>
                  ) : (
                    filteredPosts.map((post: Post) => (
                      <div key={post.id} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${post.category === '스트리머 추천합니다' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' : 'bg-purple-950 text-purple-400 border border-purple-500/20'}`}>
                                {post.category}
                              </span>
                              <h3 className="font-black text-gray-100 text-sm md:text-base">{post.title}</h3>
                            </div>
                            
                            {/* ❌ 3. 비밀번호 매칭 삭제 버튼 */}
                            <button 
                              onClick={() => handleDeletePost(post.id, post.password)}
                              className="text-[10px] text-gray-600 hover:text-red-400 font-bold px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-gray-400 mt-2.5 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        </div>
                        
                        {/* ❤️ 4. 좋아요 연동 디스플레이 */}
                        <div className="flex justify-between items-center border-t border-gray-700/50 pt-3 text-[11px] text-gray-500">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleLike(post.id, post.likes)}
                            className="flex items-center space-x-1.5 bg-gray-900/60 border border-gray-700 hover:border-pink-500/40 px-3 py-1.5 rounded-lg font-bold text-pink-400 transition-colors"
                          >
                            <span>❤️</span><span>{post.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}