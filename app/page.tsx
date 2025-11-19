'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mountain } from 'lucide-react'
import Link from "next/link"

function Globe() {
  const points = useRef()

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.1
    }
  })

  const particlesPosition = React.useMemo(() => {
    const positions = new Float32Array(10000 * 3)
    const radius = 2

    for (let i = 0; i < 10000; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = THREE.MathUtils.randFloatSpread(360)

      const x = radius * Math.sin(theta) * Math.cos(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(theta)

      positions.set([x, y, z], i * 3)
    }

    return positions
  }, [])

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export default function Component() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Mountain className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold text-lg md:text-xl">Cache</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4 md:gap-6">
          <Link href="#features" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4">
            Features
          </Link>
          <Link href="#pricing" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4 hidden sm:inline">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-[calc(100vh-3.5rem)] bg-black">
          <Canvas camera={{ position: [0, 0, 6] }}>
            <ambientLight intensity={0.5} />
            <Globe />
          </Canvas>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="text-center text-white z-10 max-w-4xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                Cache
              </h1>
              <p className="mx-auto max-w-[90%] sm:max-w-[600px] text-gray-300 mt-3 sm:mt-4 text-base sm:text-lg md:text-xl px-4">
                Manage your spending with ease and precision
              </p>
              <div className="mt-6 sm:mt-8">
                <Button asChild className="bg-white text-black hover:bg-gray-200 h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white" id="features">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center order-2 lg:order-1">
                <span className="text-gray-400 text-sm sm:text-base">Dashboard Preview</span>
              </div>
              <div className="flex flex-col justify-center space-y-4 order-1 lg:order-2">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                    Spend smarter, not harder
                  </h2>
                  <p className="max-w-[600px] text-gray-500 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
                    Cache gives you real-time insights into your spending habits, helping you make informed financial decisions.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild className="w-full min-[400px]:w-auto">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full min-[400px]:w-auto">
                    <Link href="#cta">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100" id="cta">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  Start managing your finances today
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed px-4">
                  Join thousands of users who have taken control of their spending with Cache.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2 px-4">
                <form className="flex flex-col sm:flex-row gap-2">
                  <Input className="flex-1" placeholder="Enter your email" type="email" />
                  <Button type="submit" className="w-full sm:w-auto">Sign Up</Button>
                </form>
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our{" "}
                  <Link className="underline underline-offset-2" href="#">
                    Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 text-center sm:text-left">© 2025 Cache Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
