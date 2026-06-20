import Image from 'next/image';

// Aspect ratios from the original RN component (height / width)
const ASPECT = {
  colored: 318 / 1491,
  white: 618.44 / 2315.08,
};

type Props = {
  variant?: 'colored' | 'white';
  width?: number;
  className?: string;
};

export default function FawranWordmark({ variant = 'colored', width = 140, className = '' }: Props) {
  const height = Math.round(width * ASPECT[variant]);
  const src = variant === 'colored' ? '/wordmark-colored.png' : '/wordmark-white.png';

  return (
    <Image
      src={src}
      alt="فورًا Fawran"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
