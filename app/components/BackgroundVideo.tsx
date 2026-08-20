'use client';

import { useEffect, useRef, useState, memo } from 'react';

function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mobil brauzerlar (iOS Safari / Android) uchun majburiy xususiyatlar
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setVideoLoaded(true))
          .catch((err) => {
            console.log('Autoplay blocked on mobile, waiting for touch:', err);
            // Agar brauzer bloklasa, birinchi foydalanuvchi teginishida (touch/click) ishga tushirish
            const handleTouch = () => {
              video.play().then(() => setVideoLoaded(true)).catch(() => {});
              window.removeEventListener('touchstart', handleTouch);
              window.removeEventListener('click', handleTouch);
            };
            window.addEventListener('touchstart', handleTouch, { passive: true, once: true });
            window.addEventListener('click', handleTouch, { passive: true, once: true });
          });
      }
    };

    tryPlay();
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none bg-slate-950">
      {/* Video element with poster fallback */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/image.png"
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-100' : 'opacity-90'
        }`}
      >
        <source src="/back.MP4" type="video/mp4" />
      </video>

      {/* Dark overlay for optimal text contrast and reading */}
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[0.5px] -z-10" />
    </div>
  );
}

export default memo(BackgroundVideo);
