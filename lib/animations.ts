// Animation utility classes for smooth transitions and effects
export const animations = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',

  // Slide animations
  slideInFromLeft: 'animate-slide-in-left',
  slideInFromRight: 'animate-slide-in-right',
  slideInFromTop: 'animate-slide-in-top',
  slideInFromBottom: 'animate-slide-in-bottom',

  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',

  // Bounce animations
  bounce: 'animate-bounce',
  bounceIn: 'animate-bounce-in',

  // Pulse animations
  pulse: 'animate-pulse',
  wiggle: 'animate-wiggle',
};

// Tailwind CSS custom animation styles to add to globals.css
export const tailwindAnimations = `
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-top {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scale-out {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

.animate-fade-out {
  animation: fade-out 0.3s ease-in-out;
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-in-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-in-out;
}

.animate-slide-in-top {
  animation: slide-in-top 0.3s ease-in-out;
}

.animate-slide-in-bottom {
  animation: slide-in-bottom 0.3s ease-in-out;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-in-out;
}

.animate-scale-out {
  animation: scale-out 0.3s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-wiggle {
  animation: wiggle 0.2s ease-in-out;
}
`;
