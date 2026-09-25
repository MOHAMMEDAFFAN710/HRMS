import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

import '../styles/AuthForm.css';

function AuthExperience({ mode, children }) {
    const pageRef = useRef(null);
    const isLogin = mode === 'login';

    useEffect(() => {
        const context = gsap.context(() => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            gsap.from('.auth-panel', { opacity: 0, y: 28, duration: 0.85, ease: 'power3.out' });
            gsap.from('.auth-aside > *', { opacity: 0, x: -24, duration: 0.7, stagger: 0.1, delay: 0.15, ease: 'power3.out' });
            gsap.to('.auth-orbit', { rotate: 360, duration: 28, repeat: -1, ease: 'none' });
        }, pageRef);
        return () => context.revert();
    }, []);

    return (
        <main className="auth-experience" ref={pageRef}>
            <div className="auth-atmosphere" aria-hidden="true"><span className="auth-orbit orbit-a" /><span className="auth-orbit orbit-b" /><span className="auth-star star-a" /><span className="auth-star star-b" /></div>
            <header className="auth-header">
                <Link to="/" className="auth-brand"><span>◌</span> careline</Link>
                <Link to="/" className="auth-back">Return to careline <span>↗</span></Link>
            </header>
            <div className="auth-layout">
                <section className="auth-aside">
                    <p className="auth-eyebrow"><span /> Private, thoughtful healthcare</p>
                    <h1>{isLogin ? <>Good to<br /><em>see you.</em></> : <>Make room<br /><em>for care.</em></>}</h1>
                    <p className="auth-aside-copy">{isLogin ? 'Your care space is ready when you are.' : 'Start with a more considered way to look after yourself.'}</p>
                    <div className="auth-aside-mark"><span>careline</span><span>{isLogin ? '04 / 04' : '01 / 04'}</span></div>
                </section>
                <section className="auth-panel">
                    <div className="auth-panel-top"><span>{isLogin ? 'Welcome back' : 'Create your space'}</span><span className="auth-live"><i /> Secure entry</span></div>
                    {children}
                    <p className="auth-legal">By continuing, you agree to careline's thoughtful approach to privacy.</p>
                </section>
            </div>
        </main>
    );
}

export default AuthExperience;