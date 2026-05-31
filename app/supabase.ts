import { createClient } from '@supabase/supabase-js';

// 환경 변수가 안 읽히니, 여기에 진짜 주소와 열쇠를 직접 넣어버립니다!
const supabaseUrl = 'https://zcsdmemnsqhslpwldnhd.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc2RtZW1uc3Foc2xwd2xkbmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMyMTAsImV4cCI6MjA5NTc2OTIxMH0.v7wEWd6UTtCeTd55VnCR8uDhUEAeHolv4xWrSQRZ4Wg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);