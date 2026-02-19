# Teacher Analytics Platform — 프로젝트 정리(상세)

## 개요
본 프로젝트는 **수업 영상 업로드 → 음성 전사(화자 분리) → AI 기반 수업 분석 → 리포트/대시보드 제공**까지를 한 번에 수행하는 웹 애플리케이션입니다.

- **교사용(Teacher)**: 수업 업로드, 리포트 열람, 캘린더/성과 지표 확인, 제목 수정 등
- **관리자(Admin/원장)**: 교사 목록/통계, 교사별 종합평가, 비교 분석, AI 종합 요약
- **다국어**: 한국어/영어 토글(언어 상태는 `localStorage.language`에 저장)

AI 텍스트 생성/번역은 **OpenRouter**를 통해 **`google/gemini-3-flash-preview`** 모델을 사용합니다.

---

## 기술 스택
### Frontend
- **Next.js 15.1.3** (App Router, Turbopack dev)
- **React 19**
- **TypeScript 5**
- **MUI(@mui/material)** + **Emotion**
- **Framer Motion**
- **Chart.js / Recharts**

### Backend
- **Next.js Route Handlers** (`src/app/api/**/route.ts`)
- **Supabase** (Auth + Postgres + REST)
- **AssemblyAI** (음성 전사 및 utterances/화자 구분)
- **FFmpeg** (영상에서 오디오 추출 등 전처리)
- **OpenAI SDK(openai)**: OpenRouter baseURL로 호출

---

## 핵심 사용자 시나리오(데이터 흐름)
### 1) 교사: 수업 업로드 → 분석 → 리포트 생성
1. 교사가 교사용 대시보드(`/`)에서 영상을 업로드
2. 백엔드가 `/api/analyze`에서 다음을 수행
   - FFmpeg로 오디오 추출/전처리
   - AssemblyAI 전사(utterances 포함, 화자 구분 후처리)
   - OpenRouter(`google/gemini-3-flash-preview`)로 수업 분석(점수/강점/개선점/하이라이트 및 영어 버전 포함)
3. 결과 저장
   - **파일 저장(기존 방식, 핵심)**  
     `public/reports/<teacherName>/<reportId>/analysis.json`  
     `public/reports/<teacherName>/<reportId>/transcript.json`
   - **DB 저장(요약/통계/관리자 기능용)**  
     `public.reports` 테이블에 점수/강점/개선점/하이라이트/메타데이터 저장
4. 프론트(`/reports/[teacherId]/[reportId]`)에서 API/파일을 통해 데이터 로드 후 렌더링

> **중요:** `teacherName(=reports.teacher_name)` ↔ `public/reports/<teacherName>/...` 폴더명이 일치해야 리포트/대화전문 로드가 안정적입니다.

### 2) 관리자: 통계/교사 목록 → 교사별 종합 평가 → AI 요약
1. `/admin-dashboard`에서 `/api/reports/stats` 호출
   - **profiles.role='teacher'로 등록된 교사**만 목록/통계에 포함
   - 해당 교사의 `reports.teacher_name`과 `profiles.full_name`이 일치해야 보고서가 “유효 보고서”로 집계됨
2. `/admin-dashboard/evaluation/[teacherName]`
   - `/api/reports/summary/[teacherName]`로 교사별 요약(평균/추이/강점·개선점 빈도) 로드
   - `/api/reports/ai-summary/[teacherName]?language=ko|en`로 AI 종합 평가 생성/표시

---

## 저장 구조(파일 + DB)
### 1) 파일 저장소(리포트 원본)
경로:
- `public/reports/<teacherName>/<reportId>/analysis.json`
- `public/reports/<teacherName>/<reportId>/transcript.json`

역할:
- 리포트 상세 화면에서 **수업 대화 전문(utterances)** 및 분석 원본을 안정적으로 제공
- DB가 없어도(혹은 DB 오류가 있어도) 파일만 있으면 리포트 페이지에서 최대한 복구 가능

### 2) DB(Supabase Postgres)
주요 테이블:
- `public.profiles`  
  - 사용자 프로필(이름/이메일/role)
- `public.reports`  
  - 보고서 메타/점수/요약 데이터를 저장

`public.reports`(핵심 컬럼, SQL 스크립트 기준)
- 식별/메타: `report_id`, `teacher_id`, `teacher_name`, `title`, `filename`, `file_size`, `video_duration`, `created_at`
- 점수: `score_student_participation`, `score_concept_explanation`, `score_feedback`, `score_structure`, `score_interaction`, `total_score`
- 분석 요약(JSONB): `strengths`, `improvements`, `highlights`
- 영어 필드(JSONB, 마이그레이션 필요): `strengths_en`, `improvements_en`, `highlights_en`

RLS 정책(요약):
- 교사는 본인 보고서만 조회
- admin은 전체 보고서 조회
- service_role은 전체 권한

관련 SQL:
- `scripts/setup-reports-table.sql` (reports 테이블 생성 + 인덱스 + RLS)
- `scripts/add-english-fields.sql` (영어 필드 3개 추가)

---

## 다국어(i18n) 구조
- 컨텍스트: `contexts/LanguageContext.tsx`
  - `language: 'ko' | 'en'`
  - `t(key)`로 번역
  - `localStorage.language`에 저장/복원

적용 범위:
- 교사 대시보드(`/`)
- 보고서 상세(`/reports/[teacherId]/[reportId]`)
- 관리자 대시보드(`/admin-dashboard`, `/admin-dashboard/evaluation/*`, `/admin-dashboard/compare`)

### 리포트 내용(동적 텍스트) 영어 처리 방식
- **신규 보고서**: `/api/analyze`에서 한국어+영어 버전을 함께 생성하여 DB에 저장(`*_en` 컬럼)
- **기존 보고서(영어 데이터 없음)**: `/api/translate`를 호출하여 실시간 번역(영어 모드에서 한글 fallback 없이 영어만 표시하도록 설계)

---

## AI/전사 파이프라인(핵심 구현)
### 1) `/api/analyze` (메인 분석 API)
파일: `src/app/api/analyze/route.ts`
- AssemblyAI로 전사(utterances 포함)
- 전사 결과를 `public/reports/<teacherName>/<reportId>/transcript.json` 저장
- OpenRouter + Gemini 모델로 분석 결과 생성
  - 사용 모델: `google/gemini-3-flash-preview`
  - 점수/강점/개선점/하이라이트 및 영어 버전 포함(우수점(영어), 개선점(영어), 이유(영어))
- 분석 결과를 `public/reports/<teacherName>/<reportId>/analysis.json` 저장 + Supabase `reports` upsert

### 2) `/api/translate` (실시간 번역)
파일: `src/app/api/translate/route.ts`
- 입력: `{ texts: string[], targetLanguage: 'en' | 'ko' }`
- 출력: `{ translations: string[] }`
- 사용 모델: `google/gemini-3-flash-preview`

### 3) `/api/reports/ai-summary/[teacherName]`
파일: `src/app/api/reports/ai-summary/[teacherName]/route.ts`
- 교사별 전체 리포트 요약을 prompt로 구성 후 종합 평가 텍스트 생성
- 쿼리: `?language=ko|en` (언어에 맞춰 prompt/system 메시지 분기)
- 사용 모델: `google/gemini-3-flash-preview`

---

## 주요 페이지/라우트 맵
### UI 페이지(App Router)
- 교사
  - `/` : 교사용 대시보드(업로드/리포트 목록/캘린더/지표)
  - `/reports/[teacherId]/[reportId]` : 보고서 상세(점수/강점/개선/하이라이트/대화전문)
  - `/reports/[teacherId]/analyze` : 업로드/분석 관련 페이지(프로젝트 내 존재)
  - `/auth` : 로그인/회원가입
- 관리자
  - `/admin-dashboard` : 관리자 대시보드(통계/교사 목록)
  - `/admin-dashboard/evaluation/[teacherName]` : 교사별 종합 평가
  - `/admin-dashboard/compare` : 교사 비교

### API(Route Handlers)
- 분석/전사
  - `POST /api/analyze`
  - `GET /api/analyze-status?transcriptId=...&teacherId=...`
  - `POST /api/analyze-video` (분석 API 호출 래퍼/대기 로직 포함)
- 리포트/통계
  - `GET /api/reports/stats`
  - `GET /api/reports/teacher/[teacherName]`
  - `GET /api/reports/summary/[teacherName]`
  - `GET /api/reports/ai-summary/[teacherName]?language=ko|en`
  - `POST /api/reports/update-title`
  - `GET /api/reports/[teacherId]/[reportId]/analysis`
  - `GET /api/reports/[teacherId]/[reportId]/transcript` *(현재 파일이 비정상일 수 있어 정리 필요)*
- 번역
  - `POST /api/translate`

---

## 운영/설정(로컬 개발)
### 1) 설치 및 실행
```bash
npm install
npm run dev
```

### 2) 필수 환경변수(코드 기준)
다음 값들은 코드에서 사용됩니다(최소 구성):
- `AAI_API_KEY` : AssemblyAI API Key
- `OPENROUTER_API_KEY` : OpenRouter API Key (Gemini 호출)
- `NEXT_PUBLIC_SUPABASE_URL` : Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Supabase anon key (클라이언트/REST 조회)
- `SUPABASE_SERVICE_ROLE_KEY` : Supabase service role key (서버에서 DB upsert/조회)
- `NEXTAUTH_URL` : (일부 API에서 내부 호출에 사용) 없으면 `http://localhost:3000` fallback

> 보안 권장: 코드 내에 키 “하드코딩 fallback”이 남아있다면 제거/비활성화하는 것을 권장합니다.

### 3) Supabase 초기 세팅(권장 SQL)
1) reports 테이블 생성/정책:
- `scripts/setup-reports-table.sql`

2) 영어 필드 추가:
- `scripts/add-english-fields.sql`

3) 교사 이름 익명화(Teacher A~)를 DB에 반영하려면:
- `scripts/rename-teachers.sql`

---

## 데이터 정합성 체크리스트(자주 겪는 이슈)
### 1) “영상 업로드는 됐는데 대시보드에 리포트가 안 뜸”
가능 원인:
- `profiles`에 role='teacher'로 등록된 교사 이름(`full_name`)과
  `reports.teacher_name`이 다르면 `/api/reports/stats`에서 유효 보고서로 집계되지 않음
- 업로드 시 `teacherName`이 예상과 다르게 들어가 폴더/DB가 분리됨

대응:
- Supabase `profiles`의 `full_name`과 `reports.teacher_name`을 동일하게 맞추기
- `public/reports/<teacherName>/...` 폴더명도 동일하게 유지하기

### 2) “수업 대화 전문이 안 보임”
가능 원인:
- 폴더명(teacherName) 변경으로 `public/reports/<teacherName>/.../transcript.json` 경로 불일치
- 해당 reportId 폴더에 `transcript.json`이 존재하지 않음

대응:
- 폴더명/teacherName 정합성 확보
- 리포트 상세는 우선 `/api/reports/[teacherId]/[reportId]/analysis`로 metadata를 가져오고,
  transcript는 로컬 파일에서 fallback 로드하도록 되어 있음

### 3) “영어로 바꿨더니 리포트 내용이 비거나 한글이 보임”
가능 원인:
- 기존 보고서에 `*_en` 컬럼 데이터가 비어있음
- 실시간 번역 API(`/api/translate`) 모델/키 오류

대응:
- 신규 보고서는 분석 시 영어 필드가 함께 저장되도록 유지
- 기존 보고서는 `/api/translate`가 정상 동작해야 함

---

## 스크립트 모음
SQL
- `scripts/setup-reports-table.sql`: reports 테이블/정책/인덱스
- `scripts/add-english-fields.sql`: 영어 필드 추가
- `scripts/rename-teachers.sql`: 교사명 Teacher A~로 변경(수동 매핑)
- `scripts/rename-teachers-auto.sql`: 교사명 자동 매핑(주의 필요)
- `scripts/add-transcript-column.sql`: transcript 컬럼 추가(장기적으로 DB 저장을 원할 때)

Node/Python
- `scripts/create-admin.js`, `scripts/create-user.js`: 계정 생성 보조(프로젝트 상황에 따라 사용)
- `scripts/migrate-reports-to-supabase.js`: 로컬→DB 마이그레이션 보조
- `scripts/video_processor.py`: 단순 영상 처리 예시
- `teacher_management_python/`: 별도 파이프라인/실험 코드(현재 Next API 기반 파이프라인이 메인)

---

## 권장 개선 사항(추후)
- **Transcript를 DB로 저장하려면**
  - `scripts/add-transcript-column.sql` 실행
  - `/api/analyze`에서 `transcript` upsert 재활성화
  - PostgREST schema cache 반영(대개 몇 분 소요/재시도 필요)
- `/api/reports/[teacherId]/[reportId]/transcript` 라우트 파일이 비정상(내용이 `ㅁ`) → 정리 필요
- OpenRouter API Key 하드코딩 fallback 제거(보안)
- “teacherName”과 “폴더명”을 분리하고 싶다면
  - `teacher_slug` 같은 별도 식별자 도입(폴더/URL용)
  - 화면 표시용 이름은 별도 컬럼으로 유지

---

## 한 줄 요약
**교사 수업 영상을 업로드하면 AssemblyAI 전사 + OpenRouter(Gemini) 분석으로 리포트를 만들고, 교사/관리자 대시보드에서 한국어·영어로 분석 결과를 운영/활용할 수 있는 플랫폼입니다.**

