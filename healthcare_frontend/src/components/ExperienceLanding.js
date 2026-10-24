import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import './ExperienceLanding.css';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AccountActions from './AccountActions';

gsap.registerPlugin(ScrollTrigger);

const serviceTones = ['mint', 'blue', 'coral'];

function WebGLBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.8));
    mount.appendChild(renderer.domElement);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 5),
      new THREE.MeshPhysicalMaterial({
        color: 0x9ee7df,
        roughness: 0.2,
        metalness: 0.05,
        transmission: 0.65,
        thickness: 1.2,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.9,
      }),
    );
    scene.add(orb);

    const particleCount = isMobile ? 260 : 720;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 2.4 + Math.random() * 1.7;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 4.5;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0xd8fffa, size: isMobile ? 0.018 : 0.025, transparent: true, opacity: 0.55 }),
    );
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const handlePointer = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.5;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.35;
    };
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('resize', resize);
    resize();

    let frame;
    const render = () => {
      orb.rotation.x += reducedMotion ? 0 : 0.0018;
      orb.rotation.y += reducedMotion ? 0 : 0.0025;
      particles.rotation.y += reducedMotion ? 0 : 0.00035;
      orb.position.x += (pointer.x - orb.position.x) * 0.015;
      orb.position.y += (-pointer.y - orb.position.y) * 0.015;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('resize', resize);
      particleGeometry.dispose();
      particles.material.dispose();
      orb.geometry.dispose();
      orb.material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="webgl-background" ref={mountRef} aria-hidden="true" />;
}

function MagneticButton({ children, className = '', ...props }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || window.matchMedia('(pointer: coarse)').matches) return undefined;
    const move = (event) => {
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
      const y = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
      gsap.to(button, { x, y, duration: 0.35, ease: 'power3.out' });
    };
    const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    button.addEventListener('pointermove', move);
    button.addEventListener('pointerleave', leave);
    return () => {
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerleave', leave);
    };
  }, []);

  return <span className={`magnetic-wrap ${className}`}><Link ref={buttonRef} className="magnetic-button" {...props}>{children}<span aria-hidden="true">↗</span></Link></span>;
}

function CustomCursor() {
  const cursorRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;
    const cursor = cursorRef.current;
    const move = (event) => gsap.to(cursor, { x: event.clientX, y: event.clientY, duration: 0.25, ease: 'power2.out' });
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return <span ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}

function ExperienceLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pageRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        gsap.from('.hero-copy > *', { y: 70, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.2 });
        gsap.from('.hero-meta', { opacity: 0, y: 20, duration: 0.8, delay: 0.8 });
        gsap.utils.toArray('.reveal-line').forEach((line) => {
          gsap.from(line, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: line, start: 'top 82%' } });
        });
        gsap.utils.toArray('.service-card').forEach((card, index) => {
          gsap.from(card, { y: 80, opacity: 0, rotateX: 8, duration: 0.9, delay: index * 0.08, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 84%' } });
        });
        gsap.to('.hero-orbit', { yPercent: 18, rotate: 9, ease: 'none', scrollTrigger: { trigger: '.hero', scrub: true } });
        gsap.to('.hero-copy', { yPercent: 14, opacity: 0.72, ease: 'none', scrollTrigger: { trigger: '.hero', scrub: true } });
      }
    }, pageRef);
    return () => context.revert();
  }, []);

  return (
    <main className="experience-page" ref={pageRef}>
      <CustomCursor />
      <header className={`experience-nav ${menuOpen ? 'menu-open' : ''}`}>
        <Link to="/" className="brand-mark" aria-label="Careline home"><span className="brand-symbol">◌</span>careline</Link>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}><span /> <span /></button>
        <nav className="experience-links">
          <a href="#approach" onClick={() => setMenuOpen(false)}>{t.approach}</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>{t.designed}</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>{t.contact || 'Contact'}</a>
          {user && <Link to="/appointments" onClick={() => setMenuOpen(false)}>Appointments</Link>}
          {user && <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>}
          {user?.role === 'doctor' && <Link to="/dataset" onClick={() => setMenuOpen(false)}>Dataset</Link>}
        </nav>
        <label className="language-switcher"><span className="sr-only">{t.language}</span><select value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={t.language}><option value="en">EN</option><option value="hi">हि</option></select></label>
        <Link to={user ? "/telemedicine" : "/login"} className="nav-cta">{user ? t.openCare : t.signIn} <span>↗</span></Link>
        {user && <AccountActions />}
      </header>

      <section className="hero" id="top">
        <WebGLBackground />
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> {t.heroEyebrow}</p>
          <h1>{t.heroTitleOne}<br /><em>{t.heroTitleTwo}</em></h1>
          <p className="hero-description">{t.heroDescription}</p>
          <MagneticButton to={user ? "/telemedicine" : "/register"}>{user ? t.openCare : t.begin}</MagneticButton>
        </div>
        <div className="hero-meta"><span>01 / 04</span><span>{t.scrollExplore}</span><span className="scroll-line" /></div>
      </section>

      <section className="statement-section" id="approach">
        <div className="section-kicker">{t.approach} <span>02</span></div>
        <div className="statement-copy"><p className="reveal-line">{t.approachTitle}<br /><strong>{t.approachTitleAccent}</strong></p><p className="statement-note">{t.approachNote}</p></div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading"><div className="section-kicker">{t.designed} <span>03</span></div><h2 className="reveal-line">{t.calmerPath}<br />{t.forward}</h2></div>
        <div className="service-grid">{t.services.map((service, index) => <article className={`service-card ${serviceTones[index]}`} key={service[0]}><img className="service-image" src={`/images/doctor${index + 1}.jpg`} alt={["Doctor in clinical scrubs", "Surgeons working together in an operating room", "Doctor wearing scrubs and a stethoscope"][index]} /><div className="card-top"><span>0{index + 1}</span><span className="card-arrow">↗</span></div><div className="service-card-copy"><h3>{service[0]}</h3><p>{service[1]}</p></div><div className="card-glow" /></article>)}</div>
      </section>

      <section className="closing-section" id="contact"><div className="closing-orb" /><div className="section-kicker">{t.closingKicker} <span>04</span></div><h2 className="reveal-line">{t.closingTitle}<br /><em>{t.closingAccent}</em></h2><MagneticButton to={user ? "/telemedicine" : "/register"} className="light-button">{user ? t.openCare : t.closingButton}</MagneticButton></section>
      <footer className="experience-footer"><span>careline / 2026</span><span>Care, with intention.</span><a href="#top">{t.backTop} ↑</a></footer>
    </main>
  );
}

export default ExperienceLanding;