'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ 대표님의 수파베이스 주소와 열쇠를 여기에 다시 적어주세요!
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

export default function Home() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreamers = async () => {
    const { data, error } = await supabase
      .from('streamers')
      .select('*')
      .order('viewers', { ascending: false }); // 시청자수 높은 순 정렬

    if (!error && data) {
      setStreamers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStreamers();
    // 5초마다 화면 갱신 (로봇이 데이터 기지를 바꾸면 화면도 자동으로 슥 바뀜)
    const interval = setInterval(fetchStreamers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            CHZZK & SOOP 실시간 통합 랭킹 TOP 10
          </h1>
          <p className="text-gray-400 mt-2 text-sm">5분마다 양대 플랫폼의 라이브 데이터를 자동으로 수집합니다.</p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-xl font-bold animate-pulse text-gray-500">
            실시간 라이브 전선 연결 중...
          </div>
        ) : (
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
                  {/* 순위 마크 */}
                  <div className="col-span-1 font-black text-lg">
                    {index === 0 ? '👑 1' : index + 1}
                  </div>

                  {/* 🎨 [디자인 팩트] 플랫폼별 시그니처 색상 배지 지정 공간 */}
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

                  {/* 이름 */}
                  <div className="col-span-3 text-left pl-4 font-bold text-gray-100">
                    {streamer.name}
                  </div>

                  {/* 게임 카테고리 */}
                  <div className="col-span-4 text-left text-sm text-gray-400 truncate pr-2">
                    {streamer.current_game}
                  </div>

                  {/* 시청자 수 */}
                  <div className="col-span-2 font-mono font-bold text-amber-400">
                    {streamer.viewers.toLocaleString()}명
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}