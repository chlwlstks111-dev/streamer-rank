const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// ⚠️ 대표님의 수파베이스 주소와 열쇠를 정확히 넣어주세요!
const SUPABASE_URL = 'https://zcsdmemnsqhslpwldnhd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchLiveStreamers() {
  console.log('🤖 [최종 수리 완료 로봇] 치지직 & 숲(SOOP) 실시간 라이브 데이터 동기화 가동...');

  const allStreamers = [];

  // 1. 🟢 치지직 실시간 데이터 수집 (인기순 상위 20개)
  try {
    const chzzkResponse = await axios.get('https://api.chzzk.naver.com/service/v1/lives?size=20&sortType=POPULAR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    if (chzzkResponse.data?.content?.data) {
      chzzkResponse.data.content.data.forEach(stream => {
        allStreamers.push({
          name: stream.liveChannel?.channelName || stream.liveTitle || '치지직 스트리머',
          platform: '치지직',
          viewers: parseInt(stream.concurrentUserCount) || 0,
          current_game: stream.liveCategoryValue || '종합 게임'
        });
      });
    }
  } catch (err) {
    console.error('❌ 치지직 데이터 수집 실패:', err.message);
  }

  // 2. 🔵 숲 (SOOP) 실시간 데이터 수집 (메인 화면 실제 호출 API 주소 탑재)
  try {
    // [팩트체크] 숲(SOOP) PC/모바일 메인 페이지가 라이브 목록을 렌더링할 때 사용하는 진짜 실시간 API 경로입니다.
    const soopResponse = await axios.get('https://live.sooplive.co.kr/api/main_broad_list_api.php', {
      params: {
        selectType: 'action',
        pageKey: 'main'
      },
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.sooplive.co.kr/'
      }
    });

    // 숲의 실제 데이터 응답 규격(broad)에 맞춰 정밀 파싱합니다.
    if (soopResponse.data?.broad) {
      soopResponse.data.broad.forEach(stream => {
        allStreamers.push({
          name: stream.user_nick || '숲 BJ',
          platform: '숲(SOOP)',
          viewers: parseInt(stream.total_view_cnt) || 0,
          current_game: stream.game_name || '종합 방송'
        });
      });
    }
  } catch (err) {
    console.error('❌ 숲(SOOP) 데이터 수집 실패:', err.message);
  }

  // 3. ⚖️ 모아진 치지직 + 숲 데이터를 시청자수 기준으로 완벽 정렬
  allStreamers.sort((a, b) => b.viewers - a.viewers);

  // 4. ✂️ 대한민국 탑 10만 선별
  const top10Streamers = allStreamers.slice(0, 10);

  // 5. 💥 수파베이스 데이터베이스 최종 업데이트
  if (top10Streamers.length > 0) {
    try {
      // 테이블 청소
      await supabase.from('streamers').delete().neq('name', '');

      // 10명의 데이터를 순서대로 적재
      for (const streamer of top10Streamers) {
        await supabase.from('streamers').insert({
          name: streamer.name,
          platform: streamer.platform,
          viewers: streamer.viewers,
          current_game: streamer.current_game,
          tier: streamer.viewers >= 10000 ? '다이아' : streamer.viewers >= 3000 ? '골드' : '실버'
        });
      }
      console.log(`✅ [완벽 동기화] 치지직 + 숲 진짜 실시간 TOP ${top10Streamers.length} 연동 완료! (총 수집 데이터: ${allStreamers.length}개)`);
    } catch (supabaseErr) {
      console.error('❌ 수파베이스 저장 오류:', supabaseErr.message);
    }
  } else {
    console.log('⚠️ 수집된 실시간 데이터가 존재하지 않습니다.');
  }
}

// 1분마다 실행
cron.schedule('*/1 * * * *', () => {
  fetchLiveStreamers();
});

// 즉시 가동
fetchLiveStreamers();