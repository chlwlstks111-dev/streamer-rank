const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

const SUPABASE_URL = 'https://zcsdmemnsqhslpwldnhd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchLiveStreamers() {
  console.log('🤖 [형평성 50vs50 세팅] 치지직 & SOOP 탑 50 수집 가동...');

  let chzzkStreamers = [];
  let soopStreamers = [];

  // 1. 🟢 치지직 상위 인기 50명 수집
  try {
    const chzzkResponse = await axios.get('https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=POPULAR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    if (chzzkResponse.data?.content?.data) {
      chzzkResponse.data.content.data.forEach(stream => {
        chzzkStreamers.push({
          name: stream.channel?.channelName || '치지직 스트리머',
          platform: '치지직',
          viewers: parseInt(stream.concurrentUserCount) || 0,
          current_game: stream.liveTitle || '라이브 방송'
        });
      });
    }
  } catch (err) {
    console.error('❌ 치지직 수집 실패:', err.message);
  }

  // 2. 🔵 SOOP 메인 데이터 수집 후 상위 50명 정밀 커팅
  try {
    const soopResponse = await axios.get('https://live.sooplive.co.kr/api/main_broad_list_api.php', {
      params: { selectType: 'action', pageKey: 'main' },
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.sooplive.co.kr/'
      }
    });

    if (soopResponse.data?.broad) {
      const tempSoop = [];
      soopResponse.data.broad.forEach(stream => {
        tempSoop.push({
          name: stream.user_nick || '숲 BJ',
          platform: 'SOOP',
          viewers: parseInt(stream.total_view_cnt) || 0,
          current_game: stream.broad_title || '라이브 방송'
        });
      });
      // 시청자순 정렬 후 확실하게 딱 50명만 커트 (치지직과 동등)
      tempSoop.sort((a, b) => b.viewers - a.viewers);
      soopStreamers = tempSoop.slice(0, 50);
    }
  } catch (err) {
    console.error('❌ SOOP 수집 실패:', err.message);
  }

  // 3. 양대 플랫폼 탑 50 데이터 결합 (총 100명 내외)
  const finalStreamers = [...chzzkStreamers, ...soopStreamers];
  finalStreamers.sort((a, b) => b.viewers - a.viewers);

  if (finalStreamers.length > 0) {
    try {
      await supabase.from('streamers').delete().neq('name', '');

      const { error } = await supabase.from('streamers').insert(
        finalStreamers.map(s => ({
          name: s.name,
          platform: s.platform,
          viewers: s.viewers,
          current_game: s.current_game,
          tier: s.viewers >= 10000 ? 'S' : s.viewers >= 3000 ? 'A' : 'B'
        }))
      );

      if (error) throw error;
      console.log(`✅ [형평성 동기화 완료] 치지직 ${chzzkStreamers.length}명 vs SOOP ${soopStreamers.length}명 창고 적재 완료!`);
    } catch (supabaseErr) {
      console.error('❌ 창고 저장 오류:', supabaseErr.message);
    }
  }
}

cron.schedule('*/1 * * * *', () => { fetchLiveStreamers(); });
fetchLiveStreamers();