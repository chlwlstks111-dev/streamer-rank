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
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ranking' | 'community'>('ranking');
  const [subTab, setSubTab] = useState<'all' | 'concept'>('all'); // 디시형 [전체글/개념글] 탭
  
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const fetchStreamers = async () => {
    const { data, error } = await supabase
      .from('streamers')
      .select('*')
      .order('viewers', { ascending: false });
    if (!error && data) setStreamers(data);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data);
  };

  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([fetchStreamers(), fetchPosts()]);
      setLoading(false);
    };
    initFetch();

    const interval = setInterval(() => {
      fetchStreamers();
      fetchPosts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return alert('제목과 내용을 입력해주세요!');

    const { error } = await supabase.from('community_posts').insert({
      title: newTitle,
      content: newContent,
      author: newAuthor.trim() ? newAuthor : '익명 유저',
      likes: 0
    });

    if (!error) {
      setNewTitle('');
      setNewContent('');
      setNewAuthor('');
      fetchPosts();
      alert('글이 디시 갤러리에 등록되었습니다! 🚀');
    }
  };

  // 👍 디시형 추천(개념글) 버튼 기능
  const handleLike = async (postId: number, currentLikes: number) => {
    const { error } = await supabase
      .from('community_posts')
      .update({ likes: currentLikes + 1 })
      .eq('id', postId);

    if (!error) {
      fetchPosts(); // 실시간 추천수 반영
    }
  };

  // [수정 완료] 추천수가 10개 이상이면 개념글로 인정
  const filteredPosts = subTab === 'all' 
    ? posts 
    : posts.filter(post => (post.likes || 0) >= 10);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      
      {/* 🧭 사이드바 메뉴판 */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              STREAMER RANK
            </h1>
            <p className="text-xs text-gray-500 mt-1">통합 플랫폼 포털</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'ranking' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>📊</span>
              <span>실시간 순위</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'community' ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>💬</span>
              <span>인방 갤러리 (커뮤)</span>
            </button>

            <button
              onClick={() => alert('대표님, 티어표는 다음 공사 타깃입니다! 🛠️')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-600 hover:text-gray-500 cursor-not-allowed"
            >
              <span>👑</span>
              <span>스트리머 티어표 (준비중)</span>
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      {/* 🖥️ 메인 컨텐츠 대시보드 */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xl font-bold animate-pulse text-gray-500">포털 기지 연결 중...</div>
        ) : (
          <div className="max-w-4xl mx-auto">
            
            {/* 1️⃣ 실시간 순위 */}
            {activeTab === 'ranking' && (
              <div>
                <header className="mb-8">
                  <h2 className="text-2xl font-black">CHZZK & SOOP 실시간 통합 랭킹 TOP 10</h2>
                  <p className="text-gray-400 mt-1 text-sm">5분마다 실시간 라이브 데이터를 순위별로 정렬합니다.</p>
                </header>

                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                  <div className="grid grid-cols-12 bg-gray-700 p-4 text-sm font-bold text-gray-300 text-center">
                    <div className="col-span-1">순위</div>
                    <div className="col-span-2">플랫폼</div>
                    <div className="col-span-3 text-left pl-4">스트리머/BJ</div>
                    <div className="col-span-4 text-left">방송 제목</div>
                    <div className="col-span-2">시청자 수</div>
                  </div>

                  <div className="divide-y divide-gray-700">
                    {streamers.map((streamer, index) => (
                      <div key={index} className="grid grid-cols-12 p-4 items-center text-center hover:bg-gray-750 transition-colors">
                        <div className="col-span-1 font-black text-lg">{index === 0 ? '👑 1' : index + 1}</div>
                        <div className="col-span-2">
                          {streamer.platform === '치지직' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">CHZZK</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-950 text-sky-400 border border-sky-500/30">SOOP</span>
                          )}
                        </div>
                        <div className="col-span-3 text-left pl-4 font-bold text-gray-100">{streamer.name}</div>
                        <div className="col-span-4 text-left text-sm text-gray-400 truncate pr-2">{streamer.current_game}</div>
                        <div className="col-span-2 font-mono font-bold text-amber-400">{streamer.viewers.toLocaleString()}명</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2️⃣ 통합 커뮤니티 (추천수 10개 념글 필터) */}
            {activeTab === 'community' && (
              <div>
                <header className="mb-6">
                  <h2 className="text-2xl font-black">💬 스트리머 통합 갤러리</h2>
                  <p className="text-gray-400 mt-1 text-sm">유저들이 직접 념글(개념글)을 보내는 디시 스타일 익명 광장</p>
                </header>

                {/* 디시형 [전체글 / 개념글] 필터 버튼 시스템 */}
                <div className="flex space-x-2 mb-6 border-b border-gray-800 pb-3">
                  <button
                    onClick={() => setSubTab('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      subTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    전체글
                  </button>
                  <button
                    onClick={() => setSubTab('concept')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-1 ${
                      subTab === 'concept' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <span>🔥</span>
                    <span>개념글</span>
                  </button>
                </div>

                {/* 글쓰기 폼 */}
                <form onSubmit={handleCreatePost} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8 space-y-4 shadow-xl">
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="디시 닉네임"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="념글 티켓 끊을 제목 입력"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="col-span-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="인방 갤러리 떡밥을 굴려보세요! (욕설 및 비방 금지)"
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                  <div className="text-right">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-md">
                      갤러리 글쓰기 📝
                    </button>
                  </div>
                </form>

                {/* 게시글 목록 구역 */}
                <div className="space-y-4">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl text-gray-500 text-sm">
                      {/* [수정 완료] 추천 10개 안내 문구 개편 */}
                      {subTab === 'concept' ? '🔥 아직 추천 10개를 받은 개념글이 없습니다. 념글 버튼을 눌러보세요!' : '갤러리에 작성된 글이 없습니다.'}
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <div key={post.id} className={`p-5 rounded-2xl border transition-all shadow-sm flex justify-between items-center ${
                        // [수정 완료] 추천수 10개 이상 배경색 변경 조건 적용
                        (post.likes || 0) >= 10 ? 'bg-red-950/10 border-red-900/40' : 'bg-gray-800/50 border-gray-800 hover:border-gray-700'
                      }`}>
                        <div className="space-y-2 max-w-[80%]">
                          <div className="flex items-center space-x-2">
                            {/* [수정 완료] 추천수 10개 이상 념글 배지 표기 조건 적용 */}
                            {(post.likes || 0) >= 10 && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-black">념글</span>}
                            <span className="font-bold text-gray-200">{post.title}</span>
                          </div>
                          <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="text-gray-400 font-bold">👤 {post.author}</span>
                            <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* 👍 디시형 우측 추천 버튼 배정 */}
                        <button
                          onClick={() => handleLike(post.id, post.likes || 0)}
                          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all ${
                            // [수정 완료] 추천수 10개 이상 버튼 활성화 조건 적용
                            (post.likes || 0) >= 10 
                              ? 'bg-red-900/30 border-red-500/40 text-red-400 hover:bg-red-900/50' 
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                          }`}
                        >
                          <span className="text-lg">👍</span>
                          <span className="text-xs font-mono font-bold mt-0.5">{post.likes || 0}</span>
                        </button>
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