export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* House roof */}
      <path
        d="M24 4L4 20H10V38H38V20H44L24 4Z"
        fill="white"
        fillOpacity="0.15"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Football (soccer ball) inside the house */}
      <circle cx="24" cy="26" r="9" fill="white" />
      {/* Pentagon pattern on ball */}
      <path
        d="M24 19.5L26.5 21.5L25.5 24.5H22.5L21.5 21.5L24 19.5Z"
        fill="#15803d"
      />
      <path
        d="M29.5 23L33 25L32 28.5L28.5 28L27.5 24.5L29.5 23Z"
        fill="#15803d"
      />
      <path
        d="M18.5 23L15 25L16 28.5L19.5 28L20.5 24.5L18.5 23Z"
        fill="#15803d"
      />
      <path
        d="M21 30.5L19 34L22 35L24 33L26 35L29 34L27 30.5L24 30L21 30.5Z"
        fill="#15803d"
      />
    </svg>
  )
}
