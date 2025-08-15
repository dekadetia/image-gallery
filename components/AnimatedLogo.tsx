// Auto-generated AnimatedLogo with real path data
'use client';
import { useEffect } from 'react';
import gsap from 'gsap';

export default function AnimatedLogo() {
  useEffect(() => {
    const saved = sessionStorage.getItem('logoState');
    const isAlt = saved === 'alt';

    for (let i = 1; i <= 8; i++) {
      const base = document.getElementById('letter_' + i);
      const alt = document.getElementById('letter_' + i + '_alt');

      if (base && alt) {
        base.style.display = isAlt ? 'none' : 'inline';
        alt.style.display = isAlt ? 'inline' : 'none';
      }
    }
  }, []);

  return (
    <svg viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
      
        <g id="letter_1" style={ display: 'inline' }>
          <path d="M44.5,57.6h-13.2v-21.4h51.6v21.3h-12.9v41.8h-25.4v-41.7Z" />
        </g>
    
        <g id="letter_2" style={ display: 'inline' }>
          <path d="M144.1,34.5l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
        </g>
    
        <g id="letter_3" style={ display: 'inline' }>
          <path d="M255.9,37.1h28.2c16.8,0,28.9,17,28.9,32.3s-13.4,30.8-30.5,30.8h-26.5l-.2-63.2Z" />
        </g>
    
        <g id="letter_4" style={ display: 'inline' }>
          <path d="M369.6,36.1h31.9c10.1,0,17.9,9.1,17.9,18.7s-3.7,15.4-11.3,18.3l11.7,26.2h-50.2v-63.2Z" />
        </g>
    
        <g id="letter_5" style={ display: 'inline' }>
          <path d="M32,168.3h23.3c10.9,0,24.5,2.1,24.5,16.4s-2.7,10-6.9,12.9c5,2.2,10.7,6.4,10.7,16.7s-7.7,17.2-19,17.2H31.8l.2-63.2Z" />
        </g>
    
        <g id="letter_6" style={ display: 'inline' }>
          <path d="M158.7,189.7h-13.2v-21.4h51.6v21.3h-12.9v41.8h-25.4v-41.7Z" />
        </g>
    
        <g id="letter_7" style={ display: 'inline' }>
          <path d="M257.3,167.6l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
        </g>
    
        <g id="letter_8" style={ display: 'inline' }>
          <path d="M380.6,205.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.1,9.9-21.1,22-21.1s17.7,4.1,20.5,13l-9.9,10.1c8.6,4.4,12.6,12.7,12.6,21.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
        </g>
    
      
        <g id="letter_1_alt" style={ display: 'none' }>
          <path d="M33.7,36.1h23.3c10.9,0,24.5,2.1,24.5,16.4s-2.7,10-6.9,12.9c5,2.2,10.7,6.4,10.7,16.7s-7.7,17.2-19,17.2h-32.8l.2-63.2Z" />
        </g>
    
        <g id="letter_2_alt" style={ display: 'none' }>
          <path d="M150.6,36.1h18.2v34.8h21.1v28.3h-39.3v-63.2Z" />
        </g>
    
        <g id="letter_3_alt" style={ display: 'none' }>
          <path d="M257.5,35.5l34.3,20.7v-19h19.6v63.2h-54l.2-64.8Z" />
        </g>
    
        <g id="letter_4_alt" style={ display: 'none' }>
          <path d="M363.8,36.1h28.2c16.8,0,28.9,17,28.9,32.3s-13.4,30.8-30.5,30.8h-26.5l-.2-63.2Z" />
        </g>
    
        <g id="letter_5_alt" style={ display: 'none' }>
          <path d="M24.9,200.5c0-18.1,13.9-33.5,32.1-33.5s24.3,6.2,29.2,18.4l-24.3,14.7h28.1v33.1s-11.6-8.8-11.7-8.8c-6,4.9-13,8.6-21.3,8.6-18.4,0-32-15.3-32-32.4Z" />
        </g>
    
        <g id="letter_6_alt" style={ display: 'none' }>
          <path d="M153.7,168.3h18.2v34.8h21.1v28.3h-39.3v-63.2Z" />
        </g>
    
        <g id="letter_7_alt" style={ display: 'none' }>
          <path d="M270.6,206.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.1,9.9-21.1,22-21.1s17.7,4.1,20.5,13l-9.9,10.1c8.6,4.4,12.6,12.7,12.6,21.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
        </g>
    
        <g id="letter_8_alt" style={ display: 'none' }>
          <path d="M378.3,205.8c-6.1-5.4-8.6-10.4-8.6-18,0-12.1,9.9-21.1,22-21.1s17.7,4.1,20.5,13l-9.9,10.1c8.6,4.4,12.6,12.7,12.6,21.6,0,12.8-10.5,22.6-23.6,22.6s-20.5-7.6-22.6-18.2l9.6-10.1Z" />
        </g>
    
    </svg>
  );
}
