'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Streamer {
  name: string;
  platform: string;
  viewers: number;
  current_game: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ranking'>('ranking');
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);

  // 화면이 켜지면 수파베이스 거치지 않고 양사 실시간 API 다이렉트 호출
  const fetchLiveRankings = async () => {
    let combinedList: Streamer[] = [];

    // 1. 🟢 치지직 상위 인기 방송 수집
    try {
      const chzzkResponse = await axios.get('https://api.chzzk.naver.com/service/v1/lives?size=100&sortType=POPULAR', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (chzzkResponse.data?.content?.data) {
        chzzkResponse.data.content.data.forEach((stream: any) => {
          combinedList.push({
            name: stream.channel?.channelName || '치지직 스트리머',
            platform: '치지직',
            viewers: parseInt(stream.concurrentUserCount) || 0,
            current_game: stream.liveTitle || '라이브 방송'
          });
        });
      }
    } catch (err) {
      console.error('치지직 로딩 실패:', err);
    }

    // 2. 🔵 SOOP 메인 인기 방송 수집
    try {
      const soopResponse = await axios.get('https://live.sooplive.co.kr/api/main_broad_list_api.php', {
        params: { selectType: 'action', pageKey: 'main' },
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.sooplive.co.kr/'
        }
      });
      if (soopResponse.data?.broad) {
        soopResponse.data.broad.forEach((stream: any) => {
          combinedList.push({
            name: stream.user_nick || '숲 BJ',
            platform: 'SOOP',
            viewers: parseInt(stream.total_view_cnt) || 0,
            current_game: stream.broad_title || '라이브 방송'
          });
        });
      }
    } catch (err) {
      console.error('SOOP 로딩 실패:', err);
    }

    // 3. ⚖️ 믹스 후 시청자 순으로 완벽하게 정렬하여 상위 딱 100명만 컷!
    combinedList.sort((a, b) => b.viewers - a.viewers);
    setStreamers(combinedList.slice(0, 100));
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveRankings();
    // 15초마다 유저 브라우저에서 자동으로 실시간 데이터 갱신
    const interval = setInterval(fetchLiveRankings, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans flex-col md:flex-row">
      
      {/* 상단 모바일 바 */}
      <div className="md:hidden flex items-center justify-between bg-gray-950 p-4 border-b border-gray-800 sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
      </div>

      {/* 사이드바 사이드메뉴 */}
      <aside className="hidden md:flex w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
            <p className="text-xs text-gray-500 mt-1">통합 라이브 포털</p>
          </div>
          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30">
              <span>📊</span><span>실시간 통합 랭킹</span>
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      {/* 메인 콘텐츠 구역 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xl font-