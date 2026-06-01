'use client';

import { useEffect, useState } from 'react';
import axios from 'axios'; // 🟢 react에서 axios 패키지로 올바르게 수정 완료!

interface Streamer {
  name: string;
  platform: string;
  viewers: number;
  current_game: string;
}

export default function Home() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    chzzkTotal: 0,
    soopTotal: 0,
    chzzkPct: 50,
    soopPct: 50
  });

  const fetchRankings = async () => {
    let combinedList: Streamer[] = [];
    let chzzkSum = 0;
    let soopSum = 0;

    // 1. 🟢 치지직 실시간 인기 방송 상위 50개 호출
    try {
      const chzzkResponse = await axios.get('https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=POPULAR', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (chzzkResponse.data?.content?.data) {
        chzzkResponse.data.content.data.forEach((stream: any) => {
          const vCount = parseInt(stream.concurrentUserCount) || 0;
          chzzkSum += vCount;
          combinedList.push({
            name: stream.channel?.channelName || '치지직 스트리머',
            platform: '치지직',
            viewers: vCount,
            current_game: stream.liveTitle || '라이브 방송'
          });
        });
      }
    } catch (err) {
      console.error('치지직 API 로딩 실패:', err);
    }

    // 2. 🔵 SOOP 실시간 인기 방송 상위 50개 호출
    try {
      const soopResponse = await axios.get('https://live.sooplive.co.kr/api/main_broad_list_api.php', {
        params: { selectType: 'action', pageKey: 'main' },
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.sooplive.co.kr/'
        }
      });
      if (soopResponse.data?.broad) {
        const tempSoop: Streamer[] = [];
        soopResponse.data.broad.forEach((stream: any) => {
          tempSoop.push({
            name: stream.user_nick || '숲 BJ',
            platform: 'SOOP',
            viewers: parseInt(stream.total_view_cnt) || 0,
            current_game: stream.broad_title || '라이브 방송'
          });
        });
        
        // 시청자 순 정렬 후 정확히 상위 50개만 컷 및 합산
        tempSoop.sort((a, b) => b.viewers - a.viewers);
        const top50Soop = tempSoop.slice(0, 50);
        top50Soop.forEach(s => { soopSum += s.viewers; });
        
        combinedList = [...combinedList, ...top50Soop];
      }
    } catch (err) {
      console.error('SOOP API 로딩 실패:', err);
    }

    // 3. ⚖️ 종합 상위 100명 재정렬 및 점유율 계산
    combinedList.sort((a, b) => b.viewers - a.viewers);
    
    const total = chzzkSum + soopSum;
    let cPct = 50;
    let sPct = 50;
    if (total > 0) {
      cPct = Math.round((chzzkSum / total) * 100);
      sPct = 100 - cPct;
    }

    setStats({ chzzkTotal: chzzkSum, soopTotal: soopSum, chzzkPct: cPct, soopPct: sPct });
    setStreamers(combinedList);
    setLoading(false);
  };

  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, 15000); // 15초마다 자동 갱신
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between bg-gray-950 p-4 border-b border-gray-800 sticky top-0 z-50">
        <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
      </div>

      <aside className="hidden md:flex w-64 bg-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">STREAMER RANK</h1>
            <p className="text-xs text-gray-500 mt-1">통합 실시간 라이브 포털</p>
          </div>
          <nav className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500/20 to-blue-500/20 text-blue-400 border border-blue-500/30">
              <span>📊</span><span>실시간 통합 랭킹</span>
            </button>
          </nav>
        </div>
        <div className="text-xs text-gray-600 border-t border-gray-900 pt-4">© 2026 Streamer Rank.</div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xl font-bold animate-pulse text-gray-500">실시간 데이터 수집 중...</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* 📊 상단 전광판 대항전 지표 */}
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
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full flex items-center justify-start pl-3 text-[10px] font-black text-gray-950 transition-all duration-700"
                  style={{ width: `${stats.chzzkPct}%` }}
                >
                  {stats.chzzkPct > 10 && `${stats.chzzkPct}%`}
                </div>
                <div 
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-full flex items-center justify-end pr-3 text-[10px] font-black text-white transition-all duration-700"
                  style={{ width: `${stats.soopPct}%` }}
                >
                  {stats.soopPct > 10 && `${stats.soopPct}%`}
                </div>
              </div>
            </section>

            {/* 📋 통합 테이블 TOP 100 */}
            <div className="space-y-4">
              <header>
                <h2 className="text-xl md:text-2xl font-black">CHZZK & SOOP 통합 실시간 라이브 랭킹</h2>
                <p className="text-xs text-gray-500 mt-1">※ 양사 상위 인기 방송 50개씩 총 100명의 데이터를 실시간 시청자순으로 정렬한 지표입니다.</p>
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
                        <span className="font-black text-base md:text-lg">
                          {index === 0 ? '👑 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : index + 1}
                        </span>
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

          </div>
        )}
      </main>
    </div>
  );
}