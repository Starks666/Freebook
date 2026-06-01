/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.webm') ||
    lowerUrl.endsWith('.mov') ||
    lowerUrl.startsWith('data:video/')
  );
};

interface AnimatedMediaProps {
  src?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

export default function AnimatedMedia({ src, alt = "", className = "", onClick, referrerPolicy = "no-referrer" }: AnimatedMediaProps) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={`${className} object-cover`}
        autoPlay
        loop
        muted
        playsInline
        onClick={onClick}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      onClick={onClick}
    />
  );
}
