
'use client';

// app/page.tsx
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
};

const MotionSection = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
    >
      {children}
    </motion.div>
);


export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main>
        <Hero />
      </main>
      {/* These sections are only rendered on desktop to create a zero-scroll mobile experience */}
      <div className="hidden md:block">
        <div className="space-y-4">
          <MotionSection><Features /></MotionSection>
          <MotionSection><HowItWorks /></MotionSection>
          <MotionSection><CtaBanner /></MotionSection>
        </div>
        <div>
          <MotionSection><Footer /></MotionSection>
        </div>
      </div>
    </div>
  );
}
