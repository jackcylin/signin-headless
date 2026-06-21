// Brand marks for the social sign-in buttons. Each is rendered in full color
// (the brand color, or true multicolor for Google/Microsoft) and shown on a
// white chip so it stays colorful on any theme.
const D = {
  google: { color: "#4285F4", label: "Continue with Google", path: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z", vb: "0 0 48 48", multi: `<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>` },
  line: { color: "#06C755", label: "Continue with LINE", path: "M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.843 2.573-5.992zM7.755 13.595H5.367a.631.631 0 0 1-.63-.63V8.183a.631.631 0 0 1 1.26 0v4.151h1.758a.63.63 0 1 1 0 1.261zm2.467-.63a.631.631 0 0 1-1.26 0V8.183a.631.631 0 0 1 1.26 0v4.782zm5.76 0a.63.63 0 0 1-1.135.378l-2.446-3.33v2.952a.63.63 0 1 1-1.26 0V8.183a.631.631 0 0 1 1.135-.378l2.446 3.33V8.183a.631.631 0 0 1 1.26 0v4.782zm3.872-3.021a.63.63 0 0 1 0 1.26h-1.758v1.131h1.758a.631.631 0 0 1 0 1.26h-2.388a.631.631 0 0 1-.63-.63V8.183a.631.631 0 0 1 .63-.63h2.388a.631.631 0 0 1 0 1.26h-1.758v1.131h1.758z" },
  github: { color: "#181717", label: "Continue with GitHub", path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  facebook: { color: "#1877F2", label: "Continue with Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  microsoft: { color: "#5E5E5E", label: "Continue with Microsoft", path: "M11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4zM11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24z", multi: `<rect x="0" y="0" width="11" height="11" fill="#F25022"/><rect x="13" y="0" width="11" height="11" fill="#7FBA00"/><rect x="0" y="13" width="11" height="11" fill="#00A4EF"/><rect x="13" y="13" width="11" height="11" fill="#FFB900"/>` },
  amazon: { color: "#FF9900", label: "Continue with Amazon", path: "M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 0 1-10.951-.577 17.88 17.88 0 0 1-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.244 1.82-2.88.976-.616 2.1-.975 3.39-1.066h.54c1.65 0 2.957.42 3.888 1.275.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.045.3.06.586.01.286.016.45.016.51v4.847c0 .345.046.66.15.93.097.27.196.466.286.575l.51.66c.09.135.135.255.135.39 0 .135-.075.255-.225.39-1.5 1.29-2.317 1.994-2.453 2.115-.225.18-.495.196-.81.06a8.054 8.054 0 0 1-.69-.65c-.18-.196-.31-.345-.39-.435a9.4 9.4 0 0 0-.39-.51c-.78.855-1.546 1.395-2.31 1.605a5.05 5.05 0 0 1-1.32.166c-1.12 0-2.045-.345-2.77-1.035-.726-.69-1.083-1.665-1.083-2.94zm3.753-.435c0 .57.142.96.426 1.245.282.285.66.42 1.126.42a.96.96 0 0 0 .12-.015.96.96 0 0 1 .12-.015c.585-.15 1.034-.525 1.364-1.14.165-.27.285-.57.36-.885.075-.315.12-.57.12-.765l.015-.84v-.345c-.838 0-1.476.06-1.92.18-1.262.36-1.892 1.095-1.892 2.205z" },
  apple: { color: "#000000", label: "Continue with Apple", path: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" },
  twitter: { color: "#000000", label: "Continue with X", path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" },
  discord: { color: "#5865F2", label: "Continue with Discord", path: "M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" },
  spotify: { color: "#1DB954", label: "Continue with Spotify", path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" },
  naver: { color: "#03C75A", label: "Continue with NAVER", path: "M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" },
  kakao: { color: "#FFCD00", label: "Continue with Kakao", path: "M12 0C5.373 0 0 4.243 0 9.476c0 3.388 2.255 6.36 5.642 8.03-.249.918-.901 3.327-1.031 3.844-.16.643.235.635.495.462.205-.137 3.262-2.215 4.583-3.113.756.11 1.534.169 2.311.169 6.627 0 12-4.243 12-9.476C24 4.243 18.627 0 12 0" },
  yahoo: { color: "#6001D2", label: "Continue with Yahoo", path: "M18.86 1.56L14.27 11.87H19.4L24 1.56H18.86M0 6.71L5.15 18.27L3.3 22.44H7.83L14.69 6.71H10.19L7.39 13.44L4.62 6.71H0M15.62 12.87C13.95 12.87 12.71 14.12 12.71 15.58C12.71 17 13.91 18.19 15.5 18.19C17.18 18.19 18.43 16.96 18.43 15.5C18.43 14.03 17.23 12.87 15.62 12.87Z" },
  twitch: { color: "#9146FF", label: "Continue with Twitch", path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" },
  yandex: { color: "#FC3F1D", label: "Continue with Yandex", path: "M3 3H9L12.4 10.8V21H10.6V11.8L3 3.9ZM14.2 3H21L13.7 12.4L12.1 9.7Z" },
  linkedin: { color: "#0A66C2", label: "Continue with LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  instagram: { color: "#E4405F", label: "Continue with Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
  tiktok: { color: "#010101", label: "Continue with TikTok", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  snapchat: { color: "#FFFC00", label: "Continue with Snapchat", path: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.77 4.01.255.044.435.27.42.524 0 .074-.015.149-.044.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.135.553-.073.27-.27.405-.57.405h-.03c-.135 0-.33-.031-.57-.075-.36-.075-.81-.135-1.38-.135-.345 0-.69.03-1.034.074-.66.105-1.23.51-1.889.976-.945.674-2.024 1.439-3.65 1.439-.074 0-.149-.015-.209-.015h-.196c-1.62 0-2.685-.765-3.646-1.44-.654-.466-1.234-.87-1.89-.975a6.798 6.798 0 0 0-1.043-.075c-.6 0-1.073.09-1.38.135-.255.044-.45.074-.6.074-.45 0-.51-.27-.57-.405-.06-.18-.105-.375-.135-.555-.044-.21-.105-.479-.165-.57-1.889-.225-2.924-.644-3.164-1.213a.97.97 0 0 1-.045-.225.49.49 0 0 1 .42-.524c3.24-.526 4.71-3.864 4.77-4.005l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.135-.045-.255-.074-.345-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.299 1.099.299.234 0 .384-.06.465-.105l-.045-.569c-.105-1.626-.226-3.65.299-4.84C7.84 1.082 11.2.807 12.18.807l.029-.014z", multi: `<circle cx="12" cy="12" r="12" fill="#FFFC00"/><g transform="translate(4.32 4.32) scale(0.64)"><path fill="#fff" stroke="#161616" stroke-width="1.4" stroke-linejoin="round" d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.77 4.01.255.044.435.27.42.524 0 .074-.015.149-.044.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.135.553-.073.27-.27.405-.57.405h-.03c-.135 0-.33-.031-.57-.075-.36-.075-.81-.135-1.38-.135-.345 0-.69.03-1.034.074-.66.105-1.23.51-1.889.976-.945.674-2.024 1.439-3.65 1.439-.074 0-.149-.015-.209-.015h-.196c-1.62 0-2.685-.765-3.646-1.44-.654-.466-1.234-.87-1.89-.975a6.798 6.798 0 0 0-1.043-.075c-.6 0-1.073.09-1.38.135-.255.044-.45.074-.6.074-.45 0-.51-.27-.57-.405-.06-.18-.105-.375-.135-.555-.044-.21-.105-.479-.165-.57-1.889-.225-2.924-.644-3.164-1.213a.97.97 0 0 1-.045-.225.49.49 0 0 1 .42-.524c3.24-.526 4.71-3.864 4.77-4.005l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.135-.045-.255-.074-.345-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.299 1.099.299.234 0 .384-.06.465-.105l-.045-.569c-.105-1.626-.226-3.65.299-4.84C7.84 1.082 11.2.807 12.18.807l.029-.014z"/></g>` },
  reddit: { color: "#FF4500", label: "Continue with Reddit", path: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-6.993 4.87-3.86 0-6.99-2.176-6.99-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12c-.69 0-1.25.56-1.25 1.25 0 .687.56 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.91 2.961.91.477 0 2.105-.057 2.961-.91a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
  tumblr: { color: "#36465D", label: "Continue with Tumblr", path: "M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.475c.016 1.305.488 3.089 2.84 3.089h.144c.376-.012.882-.123 1.141-.249l1.13 3.347c-.221.351-1.182 1.428-3.66 1.491h-.529z" },
};

const svg = (inner, vb = "0 0 24 24") => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;

// Full-color mark (multicolor where defined, else brand-colored) — used with a
// white chip behind the label formats.
function iconColor(d) {
  if (d.multi) return svg(d.multi, d.vb);
  if (d.path) return svg(`<path fill="${d.color}" d="${d.path}"/>`);
  return "";
}

// Monochrome mark that inherits the button text color (currentColor) — used for
// the icon-only format so the themed/shaped button shows through.
function iconMono(d) {
  return d.path ? svg(`<path fill="currentColor" d="${d.path}"/>`) : "";
}

// The renderable icon variants (what the widget / providerIconVariant produce).
export const ICON_VARIANTS = ["color", "white", "dark", "outline"];

// The choices shown in the admin picker. "default" is the sentinel for "no
// override — match the theme" (color on light, monochrome on dark/color icon-only
// buttons); it is never stored or published, so the widget keeps its theme-driven
// mark. The other four are explicit overrides applied in every theme.
export const ICON_VARIANT_CHOICES = ["default", ...ICON_VARIANTS];

// Providers that expose the icon-variant picker — every provider with a brand
// mark. For these, the merchant's choice is stored/published/previewed
// EXPLICITLY (including "color"), so the picker is WYSIWYG (the color swatch
// always yields the full-color mark, and switching back to it reliably reverts).
// A name not in this set never gets an explicit variant → keeps the theme mark.
export const ICON_PICKER_PROVIDERS = Object.keys(D);

// One provider mark rendered in a chosen visual variant:
//   color   → full-color mark (e.g. Google's 4-color "G") — the default
//   white   → solid white mark (for dark / colored buttons)
//   dark    → solid #1f1f1f mark (for light buttons)
//   outline → currentColor mark inside a thin currentColor circle
// Falls back to the full-color mark for an unknown variant or a provider without
// a single-color `path` to recolor.
export function providerIconVariant(name, variant) {
  const d = D[name];
  if (!d) return "";
  if (!d.path) return iconColor(d); // no recolorable glyph → only full-color
  switch (variant) {
    case "white": return svg(`<path fill="#ffffff" d="${d.path}"/>`);
    case "dark": return svg(`<path fill="#1f1f1f" d="${d.path}"/>`);
    case "outline":
      return svg(`<circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/><g transform="translate(4.8 4.8) scale(0.6)"><path fill="currentColor" d="${d.path}"/></g>`);
    case "color":
    default:
      return iconColor(d);
  }
}

// ── Contrast helpers: keep an icon from blending into its button background ──
function hexToRgb(hex) {
  let h = String(hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function isLightColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return true; // unknown → treat as light (safe: prefers dark/color marks)
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 140;
}
const sanitizeHexColor = (v) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v ?? "").trim()) ? String(v).trim() : "");
const isPlainWhite = (hex) => { const h = String(hex).toLowerCase(); return h === "#fff" || h === "#ffffff"; };
function colorDistance(a, b) {
  const x = hexToRgb(a), y = hexToRgb(b);
  if (!x || !y) return 255;
  return Math.sqrt((x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2);
}
const BLEND_THRESHOLD = 100; // RGB distance below which a mark blends into the button

// Pick the SVG mark to render for a provider button, guaranteeing the icon
// contrasts with the button background across every theme/format:
//  - `variant` "default"/null → a theme-appropriate auto mark.
//  - an explicit variant → honored UNLESS it would blend into the button
//    background (e.g. a "color" green glyph on a green Color-theme button, or a
//    near-black glyph on the Dark button), in which case we fall back to the auto
//    mark. The button background is white for label formats (icons sit on a white
//    chip), the theme color for icon-only Light/Dark, and the brand color for the
//    Color theme's icon-only buttons.
export function pickIconMark(name, variant, theme, format, bgOverride) {
  const d = D[name];
  if (!d) return "";
  const iconOnly = format === "icon";
  // A merchant-set custom background colour overrides the button colour (icon-only
  // sits directly on it; label formats keep their white icon chip).
  const customBg = iconOnly && sanitizeHexColor(bgOverride);
  const btnBg = customBg || (!iconOnly ? "#ffffff"
    : theme === "light" ? "#ffffff"
      : theme === "dark" ? "#1a1a1a"
        : (d.color || "#444444")); // Color theme: the brand-colored button
  const bgLight = isLightColor(btnBg);
  // Guaranteed-contrasting mark (also the blend fallback), chosen by the actual
  // button background so it's robust to custom backgrounds too:
  //  - label formats: full colour (icon sits on a white chip).
  //  - plain white button: full-colour brand mark (pops on white).
  //  - other light button (brand/custom): a dark monochrome mark.
  //  - dark button: a white monochrome mark.
  const autoMark = !iconOnly
    ? iconColor(d)
    : bgLight
      ? (isPlainWhite(btnBg) ? iconColor(d) : providerIconVariant(name, "dark"))
      : providerIconVariant(name, "white");
  if (!variant || variant === "default" || !ICON_VARIANTS.includes(variant)) return autoMark;
  // The forced variant's dominant colour. For "color" this is the brand colour —
  // which is also a badge mark's own background (e.g. the red Yandex square) — so
  // on a matching brand-colour button (the Color theme) it blends and we fall back
  // to the mono auto mark that fills the icon. "outline" uses currentColor → visible.
  const fg = variant === "white" ? "#ffffff"
    : variant === "dark" ? "#1f1f1f"
      : variant === "color" ? d.color
        : null;
  const blends = fg && colorDistance(fg, btnBg) < BLEND_THRESHOLD;
  return blends ? autoMark : providerIconVariant(name, variant);
}

export function providerDisplay(name) {
  const d = D[name];
  // `brand` is the provider's display name (Google, LINE, NAVER, X, …); the
  // widget composes the button label from a translatable "Continue with
  // {provider}" template so the prefix localizes while the brand stays as-is.
  if (!d) return { label: `Continue with ${name}`, brand: name, color: "#444444", icon: "", iconMono: "" };
  const brand = d.label.replace(/^Continue with /, "");
  return { label: d.label, brand, color: d.color, icon: iconColor(d), iconMono: iconMono(d) };
}

// The provider's color brand mark as a data: URI, for <img> use in the admin
// (the storefront widget inlines the SVG instead). Returns null when there's no
// mark. The mark needs an explicit xmlns to render inside an <img> data URI.
export function providerIconUri(name) {
  const svg = providerDisplay(name).icon;
  if (!svg) return null;
  const withNs = svg.replace(/^<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ');
  return `data:image/svg+xml,${encodeURIComponent(withNs)}`;
}
