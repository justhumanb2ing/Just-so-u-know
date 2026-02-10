/** biome-ignore-all lint/a11y/noSvgWithoutTitle: 브랜드 로고 아이콘은 장식 목적이다. */
import type { ComponentType, SVGProps } from "react";
import { SOCIAL_ACCOUNT_LINKING_PROVIDERS, type SocialProvider } from "@/lib/auth/account-linking";

export type { SocialProvider };

type SocialProviderIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type SocialProviderOption = {
  provider: SocialProvider;
  label: string;
  loginOption: string;
  brandColor: `#${string}`;
  buttonClassName: string;
  Icon: SocialProviderIcon;
};

const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#4285F4"
        d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"
      ></path>
      <path
        fill="#34A853"
        d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"
      ></path>
      <path fill="#FBBC04" d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"></path>
      <path
        fill="#EA4335"
        d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"
      ></path>
    </g>
  </svg>
);

const KakaoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" {...props}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path
        fill="#000000"
        d="M255.5 48C299.345 48 339.897 56.5332 377.156 73.5996C414.415 90.666 443.871 113.873 465.522 143.22C487.174 172.566 498 204.577 498 239.252C498 273.926 487.174 305.982 465.522 335.42C443.871 364.857 414.46 388.109 377.291 405.175C340.122 422.241 299.525 430.775 255.5 430.775C241.607 430.775 227.262 429.781 212.467 427.795C148.233 472.402 114.042 494.977 109.892 495.518C107.907 496.241 106.012 496.15 104.208 495.248C103.486 494.706 102.945 493.983 102.584 493.08C102.223 492.177 102.043 491.365 102.043 490.642V489.559C103.126 482.515 111.335 453.169 126.672 401.518C91.8486 384.181 64.1974 361.2 43.7185 332.575C23.2395 303.951 13 272.843 13 239.252C13 204.577 23.8259 172.566 45.4777 143.22C67.1295 113.873 96.5849 90.666 133.844 73.5996C171.103 56.5332 211.655 48 255.5 48Z"
      ></path>
    </g>
  </svg>
);

const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="-2 -2 24.00 24.00"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    fill="#000000"
    stroke="#000000"
    {...props}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <title>github [#142]</title> <desc>Created with Sketch.</desc> <defs> </defs>{" "}
      <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        {" "}
        <g id="Dribbble-Light-Preview" transform="translate(-140.000000, -7559.000000)" fill="#ffffff">
          {" "}
          <g id="icons" transform="translate(56.000000, 160.000000)">
            {" "}
            <path
              d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399"
              id="github-[#142]"
            >
              {" "}
            </path>{" "}
          </g>{" "}
        </g>{" "}
      </g>{" "}
    </g>
  </svg>
);

const NaverIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="-51.2 -51.2 614.40 614.40" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" stroke="#ffffff" {...props}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path fill="#ffffff" d="M9 32V480H181.366V255.862L331.358 480H504V32H331.358V255.862L181.366 32H9Z"></path>
    </g>
  </svg>
);

/**
 * Google 계정으로 로그인하는 소셜 로그인 옵션.
 *
 * 브랜드 컬러: `#4285F4` (Google Blue)
 * 로그인 옵션: Google OAuth 2.0 인증
 */
const GOOGLE_PROVIDER_OPTION: SocialProviderOption = {
  provider: "google",
  label: "Google",
  loginOption: "Google OAuth 2.0",
  brandColor: "#4285F4",
  buttonClassName:
    "border-[#DADCE0/60 bg-white text-[#1F1F1F] hover:bg-[#F8F9FA] hover:text-[#1F1F1F] dark:border-[#DADCE0] dark:bg-white dark:text-[#1F1F1F] dark:hover:bg-[#F1F3F4] dark:hover:text-[#1F1F1F]",
  Icon: GoogleIcon,
};

/**
 * Kakao 계정으로 로그인하는 소셜 로그인 옵션.
 *
 * 브랜드 컬러: `#FEE500` (Kakao Yellow)
 * 로그인 옵션: Kakao OAuth 2.0 인증
 */
const KAKAO_PROVIDER_OPTION: SocialProviderOption = {
  provider: "kakao",
  label: "Kakao",
  loginOption: "Kakao OAuth 2.0",
  brandColor: "#FEE500",
  buttonClassName:
    "border-[#FEE500] bg-[#FEE500] text-[#191919] hover:bg-[#FADA0A] hover:text-[#191919] dark:border-[#FEE500] dark:bg-[#FEE500] dark:text-[#191919] dark:hover:bg-[#FADA0A] dark:hover:text-[#191919]",
  Icon: KakaoIcon,
};

/**
 * GitHub 계정으로 로그인하는 소셜 로그인 옵션.
 *
 * 브랜드 컬러: `#181717` (GitHub Black)
 * 로그인 옵션: GitHub OAuth 2.0 인증
 */
const GITHUB_PROVIDER_OPTION: SocialProviderOption = {
  provider: "github",
  label: "GitHub",
  loginOption: "GitHub OAuth 2.0",
  brandColor: "#181717",
  buttonClassName:
    "border-[#181717] bg-[#181717] text-white hover:bg-[#2F363D] hover:text-white dark:border-[#181717] dark:bg-[#181717] dark:text-white dark:hover:bg-[#2F363D] dark:hover:text-white",
  Icon: GithubIcon,
};

/**
 * 네이버 계정으로 로그인하는 소셜 로그인 옵션.
 *
 * 브랜드 컬러: `#03C75A` (Naver Green)
 * 로그인 옵션: Naver OAuth 2.0 인증
 */
const NAVER_PROVIDER_OPTION: SocialProviderOption = {
  provider: "naver",
  label: "Naver",
  loginOption: "Naver OAuth 2.0",
  brandColor: "#03C75A",
  buttonClassName:
    "border-[#03C75A] bg-[#03C75A] text-white hover:bg-[#02B351] hover:text-white dark:border-[#03C75A] dark:bg-[#03C75A] dark:text-white dark:hover:bg-[#02B351] dark:hover:text-white",
  Icon: NaverIcon,
};

const SOCIAL_PROVIDER_OPTION_MAP: Record<SocialProvider, SocialProviderOption> = {
  google: GOOGLE_PROVIDER_OPTION,
  kakao: KAKAO_PROVIDER_OPTION,
  github: GITHUB_PROVIDER_OPTION,
  naver: NAVER_PROVIDER_OPTION,
};

export const SOCIAL_PROVIDER_OPTIONS = SOCIAL_ACCOUNT_LINKING_PROVIDERS.map((provider) => SOCIAL_PROVIDER_OPTION_MAP[provider]);
