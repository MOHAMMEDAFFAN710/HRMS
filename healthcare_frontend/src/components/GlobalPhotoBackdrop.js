import React, { useEffect, useState } from "react";
import "./GlobalPhotoBackdrop.css";

const PHOTOS = [
    { src: "/images/background1.jpg", alt: "Surgical instruments passed between clinicians" },
    { src: "/images/background2.jpg", alt: "A surgical team working together" },
];

const GlobalPhotoBackdrop = () => {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollRoot = document.scrollingElement || document.documentElement;
            const scrollableHeight = scrollRoot.scrollHeight - window.innerHeight;
            const scrollPosition = Math.max(window.scrollY, scrollRoot.scrollTop);
            setScrollProgress(scrollableHeight > 0 ? Math.max(0, Math.min(1, scrollPosition / scrollableHeight)) : 0);
        };

        updateProgress();
        const restorePosition = window.setTimeout(updateProgress, 0);
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
        window.addEventListener("pageshow", updateProgress);
        window.addEventListener("hashchange", updateProgress);
        return () => {
            window.clearTimeout(restorePosition);
            window.removeEventListener("scroll", updateProgress);
            window.removeEventListener("resize", updateProgress);
            window.removeEventListener("pageshow", updateProgress);
            window.removeEventListener("hashchange", updateProgress);
        };
    }, []);

    const fadeStart = 0.44;
    const fadeEnd = 0.56;
    const secondPhotoOpacity = Math.max(0, Math.min(1, (scrollProgress - fadeStart) / (fadeEnd - fadeStart)));

    return (
        <div className="global-photo-backdrop" aria-hidden="true">
            {PHOTOS.map((photo, index) => <img className={`backdrop-photo backdrop-photo-${index + 1}`} key={photo.src} src={photo.src} alt={photo.alt} style={{ opacity: index === 0 ? 1 - secondPhotoOpacity : secondPhotoOpacity }} />)}
        </div>
    );
};

export default GlobalPhotoBackdrop;