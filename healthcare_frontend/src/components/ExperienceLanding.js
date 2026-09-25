import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import './ExperienceLanding.css';

gsap.registerPlugin(ScrollTrigger);

const services = [
  { number: '01', title: 'A clearer way to care', text: 'One calm place for appointments, conversations and the care that follows.', tone: 'mint' },
  { number: '02', title: 'Care that meets you', text: 'Move from a first question to a trusted clinician without losing your context.', tone: 'blue' },
  { number: '03', title: 'Always within reach', text: 'Your care team, your timeline, your next best step, thoughtfully connected.', tone: 'coral' },
];

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
          <a href="#approach" onClick={() => setMenuOpen(false)}>Approach</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <Link to="/login" className="nav-cta">Sign in <span>↗</span></Link>
      </header>

      <section className="hero" id="top">
        <WebGLBackground />
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Human care, intelligently connected</p>
          <h1>Care that<br /><em>feels closer.</em></h1>
          <p className="hero-description">A more considered way to move through healthcare. Thoughtful access, trusted people and space to feel looked after.</p>
          <MagneticButton to="/register">Begin your care journey</MagneticButton>
        </div>
        <div className="hero-meta"><span>01 / 04</span><span>Scroll to explore</span><span className="scroll-line" /></div>
      </section>

      <section className="statement-section" id="approach">
        <div className="section-kicker">The careline approach <span>02</span></div>
        <div className="statement-copy"><p className="reveal-line">Healthcare can be<br /><strong>more human.</strong></p><p className="statement-note">We create room for the part of care that technology often forgets: clarity, continuity and the feeling that someone is truly with you.</p></div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading"><div className="section-kicker">Designed around you <span>03</span></div><h2 className="reveal-line">A calmer path<br />forward.</h2></div>
        <div className="service-grid">{services.map((service) => <article className={`service-card ${service.tone}`} key={service.number}><div className="card-top"><span>{service.number}</span><span className="card-arrow">↗</span></div><div><h3>{service.title}</h3><p>{service.text}</p></div><div className="card-glow" /></article>)}</div>
      </section>

      <section className="closing-section" id="contact"><div className="closing-orb" /><div className="section-kicker">A better feeling is possible <span>04</span></div><h2 className="reveal-line">Start with<br /><em>one small step.</em></h2><MagneticButton to="/register" className="light-button">Meet your careline</MagneticButton></section>
      <footer className="experience-footer"><span>careline / 2026</span><span>Care, with intention.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}

export default ExperienceLanding;