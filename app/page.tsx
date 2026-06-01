'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ 대표님의 수파베이스 정보 유지
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
}

export default function Home() {
  // 탭 상태 관리 ('ranking' = 실시간 순위, 'community' = 커뮤니티)
  const [activeTab, setActiveTab] = useState<'ranking' | 'community'>('ranking');
  
  // 데이터 상태 관리
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 커뮤니티 글쓰기 입력 폼 상태 관리
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  // 1. 실시간 순위 가져오기
  const fetchStreamers = async () => {
    const { data, error } = await supabase
      .from('streamers')
      .select('*')
      .order('viewers', { ascending: false });

    if (!error && data) {
      setStreamers(data);
    }
  };

  // 2. 커뮤니티 게시글 목록 가져오기
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false }); // 최신글 순으로 정렬

    if (!error && data) {
      setPosts(data);
    }
  };

  // 초기 데이터 연동
  useEffect(() => {
    const initFetch = async () => {
      await Promise.all([fetchStreamers(), fetchPosts()]);
      setLoading(false);
    };
    initFetch();

    // 5초마다 데이터 기지 실시간 동기화
    const interval = setInterval(() => {
      fetchStreamers();
      fetchPosts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. 커뮤니티 글 등록하기 함수
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return alert('제목과 내용을 입력해주세요!');

    const { error } = await supabase.from('community_posts').insert({
      title: newTitle,
      content: newContent,
      author: newAuthor.trim() ? newAuthor : '익명 유저'
    });

    if (!error) {
      setNewTitle('');
      setNewContent('');
      setNewAuthor('');
      fetchPosts(); // 등록 성공 후 목록 새로고침
      alert('글이 성공적으로 등록되었습니다! 🚀');
    } else {
      console.error(error);
      alert('글 등록에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      
      {/* 🧭 왼쪽 고정 레이아웃: 사이드바 메뉴판 */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          {/* 플랫폼 대간판 */}
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              STREAMER RANK
            </h1>
            <p className="text-xs text-gray-500 mt-1">통합 플랫폼 포털</p>
          </div>

          {/* 메뉴 카테고리 목록 */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'ranking'
                  ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>📊</span>
              <span>실시간 순위</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'community'
                  ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              <span>💬</span>
              <span>통합 커뮤니티</span>
            </button>

            {/* 스트리머 티어표 공간 (기획용 비활성화 메뉴) */}
            <button
              onClick={() => alert('대표님, 스트리머 티어표 기능은 다음 공사 타깃입니다! 🛠️')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-600 hover:text-gray-500 cursor-not-allowed"
            >
              <span>👑</span>
              <span>스트리머 티어표 (준비중)</span>
            </button>
          </nav>
        </div>

        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">
          © 2026 Streamer Rank. All rights reserved.
        </div>
      </aside>

      {/* 🖥️ 오른쪽 가변 레이아웃: 메인 컨텐츠 대시보드 */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xl font-bold animate-pulse text-gray-500">
            실시간 포털 기지 연결 중...
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            
            {/* 1️⃣ 탭 화면: 실시간 순위 표 */}
            {activeTab === 'ranking' && (
              <div>
                <header className="mb-8">
                  <h2 className="text-2xl font-black">CHZZK & SOOP 실시간 통합 랭킹 TOP 10</h2>
                  <p className="text-gray-400 mt-1 text-sm">5분마다 양대 플랫폼의 라이브 데이터를 자동으로 수집합니다.</p>
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
                        <div className="col-span-1 font-black text-lg">
                          {index === 0 ? '👑 1' : index + 1}
                        </div>

                        <div className="col-span-2">
                          {streamer.platform === '치지직' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              CHZZK
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-950 text-sky-400 border border-sky-500/30">
                              SOOP
                            </span>
                          )}
                        </div>

                        <div className="col-span-3 text-left pl-4 font-bold text-gray-100">
                          {streamer.name}
                        </div>

                        <div className="col-span-4 text-left text-sm text-gray-400 truncate pr-2">
                          {streamer.current_game}
                        </div>

                        <div className="col-span-2 font-mono font-bold text-amber-400">
                          {streamer.viewers.toLocaleString()}명
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2️⃣ 탭 화면: 통합 커뮤니티 게시판 */}
            {activeTab === 'community' && (
              <div>
                <header className="mb-8">
                  <h2 className="text-2xl font-black">💬 통합 유저 커뮤니티</h2>
                  <p className="text-gray-400 mt-1 text-sm">치지직과 SOOP 팬들이 자유롭게 소통하는 익명 광장입니다.</p>
                </header>

                {/* 글쓰기 에디터 폼 */}
                <form onSubmit={handleCreatePost} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8 space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-blue-400">📝 실시간 한줄 의견 남기기</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="닉네임 (미입력시 익명)"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="글 제목을 입력하세요"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="col-span-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="인터넷 방송 관련 자유로운 이야기를 적어주세요!"
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                  <div className="text-right">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-md"
                    >
                      의견 등록하기 🚀
                    </button>
                  </div>
                </form>

                {/* 실시간 게시글 리스트 출력 구역 */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl text-gray-500 text-sm">
                      첫 번째 대화의 서막을 열어주세요! 글을 작성하면 실시간 데이터베이스에 기록됩니다.
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="bg-gray-800/50 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-200">{post.title}</span>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="bg-gray-700 px-2 py-0.5 rounded text-gray-300 font-medium">🛡️ {post.author}</span>
                            <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{post.content}</p>
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