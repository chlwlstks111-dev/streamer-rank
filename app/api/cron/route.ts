import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcsdmemnsqhslpwldnhd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET() {
  console.log('🤖 [방화벽 우회 모드] Vercel 클라우드 로봇 가동...');
  let chzzkStreamers: any[] = [];
  let soopStreamers: any[] = [];

  // 1. 🟢 치지직 상위 50명 수集
  try {
    const chzzkResponse = await axios.get('https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=POPULAR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (chzzkResponse.data?.content?.data) {
      chzzkResponse.data.content.data.forEach((stream: any) => {
        chzzkStreamers.push({
          name: stream.channel?.channelName || '치지직 스트리머',
          platform: '치지직',
          viewers: parseInt(stream.concurrentUserCount) || 0,
          current_game: stream.liveTitle || '라이브 방송'
        });
      });
    }
  } catch (err: any) {
    console.error('❌ 치지직 백엔드 수집 실패:', err.message);
  }

  // 2. 🔵 SOOP 상위 50명 수집 (방화벽 통과용 헤더 전면 강화)
  try {
    const soopResponse = await axios.get('https://live.sooplive.co.kr/api/main_broad_list_api.php', {
      params: { selectType: 'action', pageKey: 'main' },
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.sooplive.co.kr/',
        'Origin': 'https://www.sooplive.co.kr',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (soopResponse.data?.broad) {
      const tempSoop: any[] = [];
      soopResponse.data.broad.forEach((stream: any) => {
        tempSoop.push({
          name: stream.user_nick || '숲 BJ',
          platform: 'SOOP',
          viewers: parseInt(stream.total_view_cnt) || 0,
          current_game: stream.broad_title || '라이브 방송'
        });
      });
      tempSoop.sort((a, b) => b.viewers - a.viewers);
      soopStreamers = tempSoop.slice(0, 50);
    }
  } catch (err: any) {
    console.error('❌ SOOP 백엔드 수집 실패:', err.message);
  }

  const finalStreamers = [...chzzkStreamers, ...soopStreamers];
  finalStreamers.sort((a, b) => b.viewers - a.viewers);

  if (finalStreamers.length > 0) {
    try {
      await supabase.from('streamers').delete().neq('name', '');
      await supabase.from('streamers').insert(
        finalStreamers.map(s => ({
          name: s.name,
          platform: s.platform,
          viewers: s.viewers,
          current_game: s.current_game,
          tier: s.viewers >= 10000 ? 'S' : s.viewers >= 3000 ? 'A' : 'B'
        }))
      );
      return NextResponse.json({ success: true, count: finalStreamers.length, chzzk: chzzkStreamers.length, soop: soopStreamers.length });
    } catch (supabaseErr: any) {
      return NextResponse.json({ success: false, error: supabaseErr.message }, { status: 500 });
    }
  }
  return NextResponse.json({ success: false, message: 'No data collected' });
}