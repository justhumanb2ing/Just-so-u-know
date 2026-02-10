#!/usr/bin/env bash

set -euo pipefail

TARGET_ENVIRONMENT="${1:-production}"
ENV_FILE="${2:-}"

case "$TARGET_ENVIRONMENT" in
  production|preview|development) ;;
  *)
    echo "지원하지 않는 환경입니다: $TARGET_ENVIRONMENT"
    echo "사용 가능: production | preview | development"
    exit 1
    ;;
esac

if [[ -z "$ENV_FILE" ]]; then
  case "$TARGET_ENVIRONMENT" in
    production) ENV_FILE=".env" ;;
    preview) ENV_FILE=".env" ;;
    development) ENV_FILE=".env.local" ;;
  esac
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "환경 파일을 찾을 수 없습니다: $ENV_FILE"
  exit 1
fi

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf "%s" "$value"
}

echo "Vercel 환경변수 동기화 시작: $ENV_FILE -> $TARGET_ENVIRONMENT"

while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
  line="${raw_line%$'\r'}"
  line="$(trim "$line")"

  if [[ -z "$line" || "${line:0:1}" == "#" ]]; then
    continue
  fi

  if [[ "$line" == export\ * ]]; then
    line="${line#export }"
  fi

  if [[ "$line" != *=* ]]; then
    continue
  fi

  key="$(trim "${line%%=*}")"
  value="$(trim "${line#*=}")"

  if [[ -z "$key" ]]; then
    continue
  fi

  if [[ "$value" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  else
    value="${value%% #*}"
    value="$(trim "$value")"
  fi

  if [[ "$key" == "BETTER_AUTH_URL" && "$TARGET_ENVIRONMENT" != "development" ]]; then
    if [[ "$value" == *"localhost"* || "$value" == *"127.0.0.1"* ]]; then
      echo "오류: $TARGET_ENVIRONMENT 환경의 BETTER_AUTH_URL에 localhost를 사용할 수 없습니다."
      echo "현재 값: $value"
      exit 1
    fi
  fi

  echo "동기화: $key"
  bunx vercel env rm "$key" "$TARGET_ENVIRONMENT" --yes >/dev/null 2>&1 || true
  printf "%s" "$value" | bunx vercel env add "$key" "$TARGET_ENVIRONMENT" >/dev/null
done < "$ENV_FILE"

echo "Vercel 환경변수 동기화 완료"
