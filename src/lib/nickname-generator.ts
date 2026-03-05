const ADJECTIVES = [
  // 성격
  '용감한', '신중한', '현명한', '대담한', '침착한', '열정적인', '냉철한', '슬기로운', '지혜로운', '담대한',
  '겸손한', '인내하는', '끈기있는', '통찰력있는', '분석적인', '직관적인', '논리적인', '창의적인', '혁신적인', '도전적인',
  // 운/행운
  '행운의', '럭키한', '축복받은', '운좋은', '황금손',
  // 속도/스타일
  '빠른', '느긋한', '꾸준한', '안정적인', '역동적인', '민첩한', '신속한', '여유로운', '차분한', '활발한',
  // 색상/특성
  '푸른', '붉은', '황금빛', '은빛', '빛나는', '반짝이는', '영롱한', '찬란한', '눈부신', '화려한',
];

// 부동산 테마 명사
const REAL_ESTATE_TERMS = [
  '집주인', '세입자', '공인중개사', '건축가', '인테리어', '분양러', '청약러', '갭투자자', '임대인', '매수자',
  '매도자', '전세러', '월세러', '재개발러', '재건축러',
];

const ANIMALS = [
  '고래', '개미', '여우', '사자', '호랑이', '독수리', '상어', '늑대', '곰', '황소',
  '팬더', '코끼리', '치타', '매', '올빼미', '돌고래', '펭귄', '다람쥐', '토끼', '용',
];

const GENERAL_NOUNS = [
  '여행자', '탐험가', '몽상가', '철학자', '선구자', '개척자', '수호자', '관찰자', '예언자', '전략가',
  '마에스트로', '아티스트', '챔피언', '레전드', '마스터',
];

const ALL_NOUNS = [...ANIMALS, ...REAL_ESTATE_TERMS, ...GENERAL_NOUNS];

function generateTag(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let tag = '';
  for (let i = 0; i < 4; i++) {
    tag += chars[Math.floor(Math.random() * chars.length)];
  }
  return tag;
}

export function generateRandomNickname(): string {
  const tag = generateTag();
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = ALL_NOUNS[Math.floor(Math.random() * ALL_NOUNS.length)];
  return `${adjective} ${noun}#${tag}`;
}
